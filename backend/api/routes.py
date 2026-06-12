import asyncio
import os
import requests
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from db.database import get_db, SessionLocal
from db import models
from .schemas import RunRequest, RunResponse, ResultResponse, HealthResponse, RegenerateRequest
from agents.utils import generate_run_id
from agents.graph import compiled_graph
from api.streaming import get_or_create_queue, publish_event, active_streams

router = APIRouter()

async def run_pipeline_background(run_id: str, input_text: str, source: str, domain_override: str | None, db: Session):
    initial_state = {
        "run_id": run_id,
        "input_bundle": {"text": input_text, "source": source, "domain_override": domain_override},
        "domain_context": None,
        "insights": [],
        "priorities": [],
        "spec_document": None,
        "tasks": [],
        "agent_trace": [],
        "pipeline_status": "running",
        "error_message": None
    }
    
    try:
        publish_event(run_id, {
            "type": "pipeline_start",
            "agent": "orchestrator",
            "message": "Pipeline execution started",
            "payload": None,
            "sequence": 0,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "run_id": run_id
        })
        
        await compiled_graph.ainvoke(initial_state)
        
        # Save cache fallback
        import json
        result_response = get_run_result(run_id, db)
        os.makedirs("/data/cache", exist_ok=True)
        with open(f"/data/cache/{run_id}.json", "w") as f:
            f.write(result_response.model_dump_json())
            
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Pipeline error: {e}")
        db_run = db.query(models.PipelineRun).filter(models.PipelineRun.id == run_id).first()
        if db_run:
            db_run.status = "error"
            db_run.error_message = str(e)
            db.commit()
        publish_event(run_id, {
            "type": "pipeline_error",
            "agent": "orchestrator",
            "message": f"Pipeline failed: {e}",
            "payload": None,
            "sequence": 999,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "run_id": run_id
        })
        
        # Fallback to cached demo JSON if we failed but have one
        try:
            cache_files = os.listdir("/data/cache") if os.path.exists("/data/cache") else []
            if cache_files:
                cached_file = cache_files[0] # Just use the first one
                logger = logging.getLogger(__name__)
                logger.info(f"Fallback: using cached result from {cached_file}")
                # We won't re-populate the DB to keep things simple, 
                # but we could send a special event to frontend if we wanted
        except Exception as cache_e:
            logger = logging.getLogger(__name__)
            logger.error(f"Cache fallback failed: {cache_e}")
    finally:
        db.close()

@router.post("/api/run", response_model=RunResponse)
async def start_run(request: RunRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    run_id = generate_run_id()
    
    # Create the run record
    db_run = models.PipelineRun(
        id=run_id,
        status="pending",
        input_text=request.input_text[:500] + "..." if len(request.input_text) > 500 else request.input_text,
        input_source=request.input_source
    )
    db.add(db_run)
    db.commit()
    
    bg_db = SessionLocal()
    asyncio.create_task(run_pipeline_background(
        run_id, 
        request.input_text, 
        request.input_source, 
        request.domain_override,
        bg_db
    ))
    
    return RunResponse(
        run_id=run_id,
        status="pending",
        stream_url=f"/api/run/{run_id}/stream",
        created_at=datetime.now(timezone.utc).isoformat()
    )

@router.get("/api/run/{run_id}/stream")
async def stream_run(run_id: str):
    import json
    queue = get_or_create_queue(run_id)
    
    async def event_generator():
        try:
            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield f"data: {json.dumps(event)}\n\n"
                    if event.get("type") in ["pipeline_complete", "pipeline_error"]:
                        break
                except asyncio.TimeoutError:
                    yield "data: {\"type\":\"keepalive\"}\n\n"
        finally:
            if run_id in active_streams:
                del active_streams[run_id]

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )

@router.get("/api/run/{run_id}/result", response_model=ResultResponse)
def get_run_result(run_id: str, db: Session = Depends(get_db)):
    db_run = db.query(models.PipelineRun).filter(models.PipelineRun.id == run_id).first()
    if not db_run:
        raise HTTPException(status_code=404, detail="Run not found")
        
    db_domain = db.query(models.DomainContext).filter(models.DomainContext.run_id == run_id).first()
    db_insights = db.query(models.Insight).filter(models.Insight.run_id == run_id).all()
    db_priorities = db.query(models.Priority).filter(models.Priority.run_id == run_id).all()
    db_tasks = db.query(models.Task).filter(models.Task.run_id == run_id).all()
    db_steps = db.query(models.AgentStep).filter(models.AgentStep.run_id == run_id).all()
        
    insights = [
        {
            "id": i.id,
            "theme_label": i.theme_label,
            "frequency": i.frequency,
            "sentiment_score": i.sentiment_score
        } for i in db_insights
    ]
    
    priorities = [
        {
            "id": p.id,
            "theme_label": getattr(p, "initiative_title", ""),
            "ice_score": p.ice_score,
            "impact_score": p.impact_score,
            "effort_score": p.effort_score,
            "confidence_score": p.confidence_score,
            "rationale": p.rationale
        } for p in db_priorities
    ]
    
    tasks = [
        {
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "priority_tag": t.priority_tag,
            "effort_estimate": t.effort_estimate,
            "status": t.status,
            "linear_issue_id": t.linear_issue_id,
            "linear_url": t.linear_url
        } for t in db_tasks
    ]
    
    agent_steps = [
        {
            "id": s.id,
            "agent_name": s.agent_name,
            "step_type": s.step_type,
            "message": s.message,
            "payload": s.payload,
            "timestamp": s.created_at.isoformat() if s.created_at else None
        } for s in db_steps
    ]
    
    return ResultResponse(
        run_id=db_run.id,
        status=db_run.status,
        domain=db_domain.project_type if db_domain else db_run.domain,
        domain_confidence=db_domain.confidence_score if db_domain else None,
        insights=insights,
        priorities=priorities,
        spec_document=None, # Spec document is only stored in agent state in this implementation
        tasks=tasks,
        agent_steps=agent_steps,
        completed_at=db_run.completed_at.isoformat() if db_run.completed_at else None
    )

@router.get("/api/runs")
def list_runs(db: Session = Depends(get_db)):
    runs = db.query(models.PipelineRun).order_by(models.PipelineRun.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "status": r.status,
            "domain": r.domain,
            "created_at": r.created_at.isoformat() if r.created_at else None
        } for r in runs
    ]

@router.post("/api/run/{run_id}/regenerate")
def regenerate_section(run_id: str, request: RegenerateRequest, db: Session = Depends(get_db)):
    db_run = db.query(models.PipelineRun).filter(models.PipelineRun.id == run_id).first()
    if not db_run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    # In a real implementation, this would trigger the LangGraph pipeline from the specific node
    # For now, we just acknowledge the request.
    return {"status": "accepted", "section": request.section, "note": request.note}

@router.get("/api/health", response_model=HealthResponse)
def health_check():
    qdrant_host = os.environ.get("QDRANT_HOST", "qdrant")
    try:
        resp = requests.get(f"http://{qdrant_host}:6333/healthz", timeout=2)
        qdrant_status = "ok" if resp.status_code == 200 else "error"
    except Exception:
        qdrant_status = "error"
        
    llm_status = "error"
    try:
        from google import genai
        client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
        # Minimal test call
        client.models.get(model='gemini-2.5-flash-lite')
        llm_status = "ok"
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"LLM check failed: {e}")
        llm_status = "error"
        
    linear_status = "ok" if os.environ.get("LINEAR_API_KEY") else "not_configured"
        
    return HealthResponse(
        status="ok",
        qdrant=qdrant_status,
        llm=llm_status,
        linear=linear_status
    )

@router.get("/api/demo/{dataset}")
def get_demo_dataset(dataset: str):
    valid_datasets = ["software", "marketing", "education"]
    if dataset not in valid_datasets:
        raise HTTPException(status_code=400, detail="Invalid dataset")
        
    # Find matching seed file
    seed_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "seed")
    matching_files = [f for f in os.listdir(seed_dir) if f.startswith(dataset) and f.endswith(".txt")]
    if not matching_files:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    filename = matching_files[0]
    filepath = os.path.join(seed_dir, filename)
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            text = f.read()
            
        item_count = 0
        try:
            item_count = int(filename.split("_")[1].split(".")[0])
        except Exception:
            item_count = len([line for line in text.split("\n") if line.strip()])
            
        return {
            "dataset": dataset,
            "text": text,
            "item_count": item_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read dataset: {e}")
