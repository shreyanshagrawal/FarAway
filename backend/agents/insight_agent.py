import os
import uuid
import json
import logging
import numpy as np
from typing import List, Dict, Any
from google import genai
from google.genai import types
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score

from .state import AgentState
from .utils import chunk_text, emit_step
from db.models import Insight

logger = logging.getLogger(__name__)

VECTOR_SIZE = 3072  # gemini-embedding-001 returns 3072 dimensions

async def run_insight_agent(state: AgentState, db_session) -> AgentState:
    run_id = state.get("run_id", "unknown")
    text = state.get("input_bundle", {}).get("text", "")
    
    # 1. Chunk state["input_bundle"]["text"] using chunk_text() (512 tokens max)
    chunks = chunk_text(text, max_tokens=512)
    if not chunks:
        state["insights"] = []
        return state
        
    # 2. For each chunk, call Gemini text-embedding-004
    genai_client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
    
    embeddings = []
    from .utils import embed_with_retry
    for chunk in chunks:
        try:
            response = await embed_with_retry(
                client=genai_client,
                model='gemini-embedding-001',
                contents=chunk
            )
            embeddings.append(response.embeddings[0].values)
        except Exception as e:
            logger.error(f"Embedding failed for chunk: {e}")
            embeddings.append([0.0] * VECTOR_SIZE)
            
    # 3. Upsert all chunk vectors to Qdrant
    qdrant_host = os.environ.get("QDRANT_HOST", "localhost")
    qclient = QdrantClient(host=qdrant_host, port=6333)
    
    collection_name = "input_chunks"
    try:
        qclient.get_collection(collection_name)
    except Exception:
        qclient.create_collection(
            collection_name=collection_name,
            vectors_config=qmodels.VectorParams(size=VECTOR_SIZE, distance=qmodels.Distance.COSINE)
        )
        
    points = []
    for i, (chunk, emb) in enumerate(zip(chunks, embeddings)):
        points.append(qmodels.PointStruct(
            id=str(uuid.uuid4()),
            vector=emb,
            payload={"run_id": run_id, "text": chunk, "chunk_index": i}
        ))
        
    qclient.upsert(
        collection_name=collection_name,
        points=points
    )
    
    # 4. Retrieve all vectors for this run_id from Qdrant
    scroll_res = qclient.scroll(
        collection_name=collection_name,
        scroll_filter=qmodels.Filter(
            must=[qmodels.FieldCondition(key="run_id", match=qmodels.MatchValue(value=run_id))]
        ),
        limit=1000,
        with_payload=True,
        with_vectors=True
    )
    records = scroll_res[0]
    
    retrieved_embeddings = []
    retrieved_texts = []
    for r in records:
        if r.vector:
            retrieved_embeddings.append(r.vector)
            retrieved_texts.append(r.payload["text"])
            
    if not retrieved_embeddings:
        retrieved_embeddings = embeddings
        retrieved_texts = chunks

    # 5. Run KMeans clustering with scikit-learn
    num_chunks = len(retrieved_embeddings)
    X = np.array(retrieved_embeddings)
    
    best_k = 1
    best_labels = [0] * num_chunks
    
    if num_chunks < 3:
        best_k = 1
        best_labels = [0] * num_chunks
    elif num_chunks < 6:
        best_k = 2
        kmeans = KMeans(n_clusters=best_k, random_state=42, n_init="auto").fit(X)
        best_labels = kmeans.labels_
    else:
        best_score = -1
        max_k = min(8, num_chunks)
        for k in range(3, max_k):
            kmeans = KMeans(n_clusters=k, random_state=42, n_init="auto").fit(X)
            score = silhouette_score(X, kmeans.labels_)
            if score > best_score:
                best_score = score
                best_k = k
                best_labels = kmeans.labels_
                
    # 6. For each cluster, call Gemini to Label and Score
    clusters = {}
    for i, label in enumerate(best_labels):
        if label not in clusters:
            clusters[label] = []
        clusters[label].append(retrieved_texts[i])
        
    insights_data = []
    for label, texts in clusters.items():
        combined_text = "\n---\n".join(texts)
        prompt = "Given these feedback items, return JSON: {\"theme_label\": string, \"sentiment_score\": float}"
        
        try:
            from .utils import call_gemini_with_retry
            resp = await call_gemini_with_retry(
                client=genai_client,
                model='gemini-2.5-flash-lite',
                contents=combined_text,
                config=types.GenerateContentConfig(
                    system_instruction=prompt,
                    temperature=0.1
                )
            )
            res_text = resp.text.strip()
            if res_text.startswith("```"):
                lines = res_text.split("\n")
                if len(lines) >= 3:
                    res_text = "\n".join(lines[1:-1])
            parsed = json.loads(res_text)
            if isinstance(parsed, list):
                if len(parsed) > 0:
                    parsed = parsed[0]
                else:
                    parsed = {}
            theme_label = parsed.get("theme_label", f"Cluster {label}")
            sentiment_score = parsed.get("sentiment_score", 0.0)
        except Exception as e:
            logger.error(f"Cluster label generation failed: {e}")
            theme_label = f"Cluster {label}"
            sentiment_score = 0.0
            
        freq = len(texts)
        score_val = freq * abs(float(sentiment_score))
        
        insights_data.append({
            "theme_label": theme_label,
            "frequency": freq,
            "sentiment_score": float(sentiment_score),
            "representative_quotes": texts[:3],
            "_score": score_val 
        })
        
    # 7. Rank clusters by frequency x abs(sentiment_score) descending
    insights_data.sort(key=lambda x: x["_score"], reverse=True)
    
    # 8. Build InsightReport and 9. Store in insights table
    final_insights = []
    for rank, item in enumerate(insights_data, start=1):
        insight_dict = {
            "theme_label": item["theme_label"],
            "frequency": item["frequency"],
            "sentiment_score": item["sentiment_score"],
            "representative_quotes": item["representative_quotes"],
            "rank": rank
        }
        final_insights.append(insight_dict)
        
        try:
            db_insight = Insight(
                run_id=run_id,
                theme_label=item["theme_label"],
                frequency=item["frequency"],
                sentiment_score=item["sentiment_score"],
                representative_quotes=item["representative_quotes"],
                rank=rank
            )
            db_session.add(db_insight)
        except Exception as e:
            logger.error(f"DB write failed for insight: {e}")
            
    try:
        db_session.commit()
    except Exception as e:
        db_session.rollback()
        logger.error(f"DB commit failed: {e}")
        
    # 10. Emit step events and append to agent_trace
    step_dict = emit_step(
        run_id=run_id,
        agent_name="insight_agent",
        step_type="insight_generation",
        message=f"Generated {len(final_insights)} insights from {num_chunks} chunks.",
        payload={"insights": final_insights},
        sequence=len(state.get("agent_trace", [])) + 1
    )
    if "agent_trace" not in state:
        state["agent_trace"] = []
    state["agent_trace"].append(step_dict)
    
    # 11. Set state["insights"] and return state
    state["insights"] = final_insights
    return state
