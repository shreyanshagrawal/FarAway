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

def emit_step(run_id: str, agent_name: str, step_type: str, message: str, payload: Optional[Dict[str, Any]], sequence: int) -> Dict[str, Any]:
    """Formats and returns a dict formatted as the SSE event schema."""
    return {
        "type": step_type,
        "agent": agent_name,
        "message": message,
        "payload": payload,
        "sequence": sequence,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "run_id": run_id
    }

def generate_run_id() -> str:
    """Returns a new UUID4 as a string."""
    return str(uuid.uuid4())
