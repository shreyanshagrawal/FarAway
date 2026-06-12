import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
import tiktoken

def chunk_text(text: str, max_tokens: int = 512) -> List[str]:
    """Splits text into chunks of at most max_tokens tokens using cl100k_base encoding."""
    encoding = tiktoken.get_encoding("cl100k_base")
    tokens = encoding.encode(text)
    
    chunks = []
    for i in range(0, len(tokens), max_tokens):
        chunk_tokens = tokens[i:i + max_tokens]
        chunk_text = encoding.decode(chunk_tokens)
        chunks.append(chunk_text)
        
    return chunks

from api.streaming import publish_event

def emit_step(run_id: str, agent_name: str, step_type: str, message: str, payload: Optional[Dict[str, Any]], sequence: int) -> Dict[str, Any]:
    """Formats and returns a dict formatted as the SSE event schema."""
    event = {
        "type": step_type,
        "agent": agent_name,
        "message": message,
        "payload": payload,
        "sequence": sequence,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "run_id": run_id
    }
    publish_event(run_id, event)
    return event

def generate_run_id() -> str:
    """Returns a new UUID4 as a string."""
    return str(uuid.uuid4())

import asyncio
import logging
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

async def call_gemini_with_retry(client, model, contents, config, max_retries=5):
    for attempt in range(max_retries):
        try:
            return client.models.generate_content(
                model=model,
                contents=contents,
                config=config
            )
        except Exception as e:
            err_msg = str(e).lower()
            if "429" in err_msg or "quota" in err_msg or "exhausted" in err_msg:
                wait_time = (attempt + 1) * 10
                logger.warning(f"Rate limit hit. Retrying in {wait_time}s... (Attempt {attempt+1}/{max_retries})")
                await asyncio.sleep(wait_time)
            else:
                raise e
    raise Exception(f"Failed after {max_retries} retries due to rate limits.")

async def embed_with_retry(client, model, contents, max_retries=5):
    for attempt in range(max_retries):
        try:
            return client.models.embed_content(
                model=model,
                contents=contents
            )
        except Exception as e:
            err_msg = str(e).lower()
            if "429" in err_msg or "quota" in err_msg or "exhausted" in err_msg:
                wait_time = (attempt + 1) * 10
                logger.warning(f"Rate limit hit. Retrying in {wait_time}s... (Attempt {attempt+1}/{max_retries})")
                await asyncio.sleep(wait_time)
            else:
                raise e
    raise Exception(f"Failed after {max_retries} retries due to rate limits.")
