import os
import logging
from google import genai
from google.genai import types

from .state import AgentState
from .utils import emit_step

logger = logging.getLogger(__name__)

async def run_writer_agent(state: AgentState, db_session) -> AgentState:
    run_id = state.get("run_id", "unknown")
    domain_context = state.get("domain_context", {})
    spec_format = domain_context.get("spec_format", "prd")
    
    # 1. Select prompt file
    if spec_format == "prd":
        prompt_file = "prompts/writer_software.txt"
    elif spec_format == "campaign_brief":
        prompt_file = "prompts/writer_marketing.txt"
    elif spec_format == "curriculum_plan":
        prompt_file = "prompts/writer_education.txt"
    else:
        prompt_file = "prompts/writer_software.txt"
        
    try:
        with open(prompt_file, "r", encoding="utf-8") as f:
            system_prompt = f.read()
    except Exception as e:
        logger.error(f"Failed to read writer prompt {prompt_file}: {e}")
        system_prompt = "You are an expert product manager. Write a comprehensive spec document."
        
    # 2. Build the user message
    priorities = state.get("priorities", [])
    top_priorities = priorities[:5]
    
    insights = state.get("insights", [])
    top_insights = insights[:5] # limit insights to avoid massive context if needed
    
    vocabulary = domain_context.get("vocabulary", [])
    
    user_message = "Here is the compiled data to inform your specification document:\n\n"
    
    user_message += "### Domain Vocabulary\n"
    user_message += ", ".join(vocabulary) + "\n\n"
    
    user_message += "### Top Priorities\n"
    for idx, p in enumerate(top_priorities, start=1):
        user_message += f"{idx}. {p.get('initiative_title')} (Impact: {p.get('impact_score')}, Effort: {p.get('effort_score')})\n"
        user_message += f"Rationale: {p.get('rationale')}\n\n"
        
    user_message += "### Top Insights & Sentiment\n"
    for idx, i in enumerate(top_insights, start=1):
        user_message += f"{idx}. {i.get('theme_label')} (Sentiment: {i.get('sentiment_score')})\n"
        if "representative_quotes" in i and i["representative_quotes"]:
            user_message += f"Quotes: {i['representative_quotes'][0]}\n"
        user_message += "\n"
        
    try:
        from .llm_client import call_gemini
        response_text = await call_gemini(
            system_prompt=system_prompt,
            user_message=user_message,
            max_tokens=2000
        )
        spec_doc = response_text.strip()
    except Exception as e:
        logger.error(f"Writer generation failed: {e}")
        spec_doc = "# Generation Failed\n\nThe specification document could not be generated."
        
    # Clean up any potential markdown fences that encompass the whole document
    if spec_doc.startswith("```markdown"):
        lines = spec_doc.split("\n")
        if lines[-1].strip() == "```":
            spec_doc = "\n".join(lines[1:-1])
            
    # 5. Store the spec in state["spec_document"]
    state["spec_document"] = spec_doc
    
    # 6. Emit step events, return state
    step_dict = emit_step(
        run_id=run_id,
        agent_name="writer_agent",
        step_type="document_generation",
        message="Successfully generated Specification Document.",
        payload={"spec_length": len(spec_doc), "format": spec_format},
        sequence=len(state.get("agent_trace", [])) + 1
    )
    if "agent_trace" not in state:
        state["agent_trace"] = []
    state["agent_trace"].append(step_dict)
    
    return state
