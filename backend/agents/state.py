from typing import TypedDict, Optional, List, Dict, Any

class AgentState(TypedDict):
    run_id: str
    input_bundle: dict
    domain_context: Optional[dict]
    insights: list
    priorities: list
    spec_document: Optional[str]
    tasks: list
    agent_trace: list
    pipeline_status: str
    error_message: Optional[str]
