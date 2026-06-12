import os
import json
import logging
from typing import Dict, Any
from google import genai
from google.genai import types

from .state import AgentState
from .utils import emit_step
from db.models import Priority

logger = logging.getLogger(__name__)

async def run_priority_agent(state: AgentState, db_session) -> AgentState:
    run_id = state.get("run_id", "unknown")
    insights = state.get("insights", [])
    domain_context = state.get("domain_context", {})
    weights = domain_context.get("priority_weights", {"impact": 0.35, "effort": 0.3, "compliance": 0.15, "reach": 0.2})
    domain_type = domain_context.get("project_type", "general")
    
    if not insights:
        state["priorities"] = []
        return state
        
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
    priorities_data = []
    
    # 2. For each insight theme, call Gemini to score
    for insight in insights:
        theme = insight.get("theme_label", "")
        freq = insight.get("frequency", 1)
        sentiment = insight.get("sentiment_score", 0.0)
        
        prompt = f"""
You are an expert product manager scoring initiatives.
Evaluate the following insight theme:
Theme: {theme}
Frequency: {freq}
Sentiment: {sentiment}
Domain Context: {domain_type}

Score the impact, effort, and confidence on a 1.0 to 10.0 scale.
(impact_score: 1.0-10.0, effort_score: 1.0-10.0 where higher means more effort, confidence_score: 1.0-10.0).

Return JSON exactly in this format:
{{"impact_score": float, "effort_score": float, "confidence_score": float, "rationale": "string"}}
"""
        try:
            from .llm_client import call_gemini
            res_text = await call_gemini(
                system_prompt="You are an expert product manager scoring initiatives.",
                user_message=prompt,
                response_mime_type="application/json"
            )
            
            if res_text.startswith("```"):
                lines = res_text.split("\n")
                if len(lines) >= 3:
                    res_text = "\n".join(lines[1:-1])
            parsed = json.loads(res_text)
            
            impact_score = float(parsed.get("impact_score", 5.0))
            effort_score = float(parsed.get("effort_score", 5.0))
            confidence_score = float(parsed.get("confidence_score", 5.0))
            rationale = str(parsed.get("rationale", "No rationale provided"))
        except Exception as e:
            logger.error(f"Priority generation failed for theme '{theme}': {e}")
            impact_score = 5.0
            effort_score = 5.0
            confidence_score = 5.0
            rationale = "Fallback scores due to generation failure"
            
        # Special multiplier for marketing
        if domain_type.lower() == "marketing":
            impact_score *= 1.3
            
        # 3. Calculate ICE score
        adjusted_impact = impact_score * (weights.get("impact", 0.35) + weights.get("reach", 0.2))
        adjusted_effort = effort_score * weights.get("effort", 0.3)
        if adjusted_effort == 0:
            adjusted_effort = 1.0
            
        ice_score = (adjusted_impact * confidence_score) / adjusted_effort
        
        # Special multiplier for healthcare compliance
        if domain_type.lower() == "healthcare" and "compliance" in theme.lower():
            ice_score *= 1.5
            
        priorities_data.append({
            "initiative_title": theme,
            "impact_score": impact_score,
            "effort_score": effort_score,
            "confidence_score": confidence_score,
            "ice_score": ice_score,
            "rationale": rationale
        })
        
    # 4. Sort all items by ice_score descending
    priorities_data.sort(key=lambda x: x["ice_score"], reverse=True)
    
    # 5. Assign rank and store in priorities table
    final_priorities = []
    for rank, item in enumerate(priorities_data, start=1):
        item["rank"] = rank
        final_priorities.append(item)
        
        try:
            db_priority = Priority(
                run_id=run_id,
                initiative_title=item["initiative_title"],
                impact_score=item["impact_score"],
                effort_score=item["effort_score"],
                confidence_score=item["confidence_score"],
                ice_score=item["ice_score"],
                rationale=item["rationale"],
                rank=rank
            )
            db_session.add(db_priority)
        except Exception as e:
            logger.error(f"DB write failed for priority: {e}")
            
    try:
        db_session.commit()
    except Exception as e:
        db_session.rollback()
        logger.error(f"DB commit failed: {e}")
        
    # 6. Emit step events, set state["priorities"], return state
    step_dict = emit_step(
        run_id=run_id,
        agent_name="priority_agent",
        step_type="priority_scoring",
        message=f"Scored and ranked {len(final_priorities)} priorities.",
        payload={"priorities": final_priorities},
        sequence=len(state.get("agent_trace", [])) + 1
    )
    if "agent_trace" not in state:
        state["agent_trace"] = []
    state["agent_trace"].append(step_dict)
    
    state["priorities"] = final_priorities
    return state
