import os
import json
import logging
from typing import Dict, Any
from google import genai
from google.genai import types

from .state import AgentState
from .utils import emit_step
from db.models import DomainContext

logger = logging.getLogger(__name__)

DEFAULT_CONTEXT = {
    "project_type": "general",
    "vocabulary": [],
    "spec_format": "general_spec",
    "priority_weights": {"impact": 0.35, "effort": 0.3, "compliance": 0.15, "reach": 0.2},
    "confidence_score": 0.0
}

async def run_domain_agent(state: AgentState, db_session) -> AgentState:
    run_id = state.get("run_id", "unknown")
    input_bundle = state.get("input_bundle", {})
    text = input_bundle.get("text", "")
    domain_override = input_bundle.get("domain_override")
    
    # 1. Load the prompt from /prompts/domain.txt
    try:
        with open("prompts/domain.txt", "r", encoding="utf-8") as f:
            system_prompt = f.read()
    except Exception as e:
        logger.error(f"Failed to read prompt: {e}")
        system_prompt = "You are a domain inference agent. Return valid JSON."

    user_message = text[:4000]
    
    parsed_json = None
    try:
        # 2. Call Gemini 2.5 Flash
        client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=user_message,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json",
                max_output_tokens=500,
                temperature=0.1
            ),
        )
        
        # 3. Parse the JSON response
        response_text = response.text
        if response_text:
            parsed_json = json.loads(response_text)
            
    except Exception as e:
        logger.error(f"Gemini API or parsing failed: {e}")
        
    # On failure: fallback to the default general domain context
    if not parsed_json:
        parsed_json = DEFAULT_CONTEXT.copy()
        
    project_type = parsed_json.get("project_type", "general")
    vocabulary = parsed_json.get("vocabulary", [])
    spec_format = parsed_json.get("spec_format", "general_spec")
    priority_weights = parsed_json.get("priority_weights", DEFAULT_CONTEXT["priority_weights"])
    confidence_score = parsed_json.get("confidence_score", 0.0)
    
    if confidence_score < 0.6:
        project_type = "general"
        
    # 4. Respect domain_override from input_bundle
    if domain_override:
        project_type = domain_override
        
    # 5. Build a DomainContext dict and store it in state
    final_context = {
        "project_type": project_type,
        "vocabulary": vocabulary,
        "spec_format": spec_format,
        "priority_weights": priority_weights,
        "confidence_score": confidence_score
    }
    
    state["domain_context"] = final_context
    
    # 6. Emit a step dict using emit_step() and append it to state["agent_trace"]
    step_payload = {
        "context": final_context,
        "override_applied": bool(domain_override)
    }
    
    if "agent_trace" not in state:
        state["agent_trace"] = []
        
    sequence = len(state["agent_trace"]) + 1
    step_dict = emit_step(
        run_id=run_id,
        agent_name="domain_agent",
        step_type="domain_inference",
        message=f"Inferred domain: {project_type}",
        payload=step_payload,
        sequence=sequence
    )
    
    state["agent_trace"].append(step_dict)
    
    # 7. Write the domain_context to the domain_contexts table in the DB
    try:
        db_domain = DomainContext(
            run_id=run_id,
            project_type=project_type,
            vocabulary=vocabulary,
            spec_format=spec_format,
            priority_weights=priority_weights,
            confidence_score=confidence_score
        )
        db_session.add(db_domain)
        db_session.commit()
    except Exception as e:
        logger.error(f"DB write failed: {e}")
        db_session.rollback()
        
    # 8. Return the updated state
    return state
