from pydantic import BaseModel
from typing import Literal, Optional, List, Dict, Any

class RunRequest(BaseModel):
    input_text: str
    input_source: Literal["text", "file", "url"] = "text"
    domain_override: Optional[str] = None

class RunResponse(BaseModel):
    run_id: str
    status: str
    stream_url: str
    created_at: str

class ResultResponse(BaseModel):
    run_id: str
    status: str
    domain: Optional[str] = None
    domain_confidence: Optional[float] = None
    insights: List[Dict[str, Any]] = []
    priorities: List[Dict[str, Any]] = []
    spec_document: Optional[str] = None
    tasks: List[Dict[str, Any]] = []
    agent_steps: List[Dict[str, Any]] = []
    completed_at: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    qdrant: str
    llm: str
    linear: str

class RegenerateRequest(BaseModel):
    section: str
    note: str | None = None
