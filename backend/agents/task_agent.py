import os
import json
import logging
import httpx
from typing import List, Dict, Any
from google import genai
from google.genai import types

from .state import AgentState
from .utils import emit_step
from db.models import Task

logger = logging.getLogger(__name__)

async def run_task_agent(state: AgentState, db_session) -> AgentState:
    run_id = state.get("run_id", "unknown")
    spec_document = state.get("spec_document", "")
    
    if not spec_document:
        state["tasks"] = []
        return state
        
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
    
    # 1. Call Gemini to decompose spec
    prompt = """
Decompose this specification into 6-10 granular tasks.
Return ONLY a JSON array. Each item must have the following keys exactly:
{"title": string, "description": string, "priority_tag": string (P0/P1/P2/P3), "effort_estimate": string (XS/S/M/L/XL)}
"""
    
    try:
        from .utils import call_gemini_with_retry
        response = await call_gemini_with_retry(
            client=client,
            model='gemini-2.5-flash-lite',
            contents=f"Specification:\n{spec_document}",
            config=types.GenerateContentConfig(
                system_instruction=prompt,
                temperature=0.2
            )
        )
        res_text = response.text.strip()
        if res_text.startswith("```"):
            lines = res_text.split("\n")
            if len(lines) >= 3:
                res_text = "\n".join(lines[1:-1])
        tasks_json = json.loads(res_text)
        if not isinstance(tasks_json, list):
            tasks_json = [tasks_json]
    except Exception as e:
        logger.error(f"Task generation failed: {e}")
        tasks_json = []
        
    # 2 & 3. Create Linear issues and track status
    linear_api_key = os.environ.get("LINEAR_API_KEY", "")
    linear_team_id = os.environ.get("LINEAR_TEAM_ID", "")
    linear_url_endpoint = "https://api.linear.app/graphql"
    
    graphql_query = """
    mutation CreateIssue($title: String!, $description: String!, $teamId: String!) {
      issueCreate(input: {title: $title, description: $description, teamId: $teamId}) {
        success
        issue { id url }
      }
    }
    """
    
    headers = {
        "Authorization": linear_api_key,
        "Content-Type": "application/json"
    }
    
    final_tasks = []
    
    async with httpx.AsyncClient() as http_client:
        for t in tasks_json:
            title = t.get("title", "Untitled Task")
            description = t.get("description", "")
            priority_tag = t.get("priority_tag", "P2")
            effort_estimate = t.get("effort_estimate", "M")
            
            task_status = "pending"
            issue_id = None
            issue_url = None
            
            if linear_api_key and linear_team_id:
                try:
                    payload = {
                        "query": graphql_query,
                        "variables": {
                            "title": title,
                            "description": f"{description}\n\nPriority: {priority_tag}\nEffort: {effort_estimate}",
                            "teamId": linear_team_id
                        }
                    }
                    resp = await http_client.post(linear_url_endpoint, json=payload, headers=headers, timeout=10.0)
                    resp_data = resp.json()
                    
                    if resp.status_code == 200 and not resp_data.get("errors"):
                        issue_data = resp_data.get("data", {}).get("issueCreate", {})
                        if issue_data.get("success"):
                            issue = issue_data.get("issue", {})
                            issue_id = issue.get("id")
                            issue_url = issue.get("url")
                            task_status = "created"
                        else:
                            task_status = "failed"
                    else:
                        logger.error(f"Linear API error: {resp_data}")
                        task_status = "failed"
                except Exception as e:
                    logger.error(f"Failed to call Linear API: {e}")
                    task_status = "failed"
            else:
                task_status = "failed" # missing credentials
                
            task_dict = {
                "title": title,
                "description": description,
                "priority_tag": priority_tag,
                "effort_estimate": effort_estimate,
                "linear_issue_id": issue_id,
                "linear_url": issue_url,
                "status": task_status
            }
            final_tasks.append(task_dict)
            
            # 4. Store task in DB
            try:
                db_task = Task(
                    run_id=run_id,
                    title=title,
                    description=description,
                    priority_tag=priority_tag,
                    effort_estimate=effort_estimate,
                    linear_issue_id=issue_id,
                    linear_url=issue_url,
                    status=task_status
                )
                db_session.add(db_task)
            except Exception as e:
                logger.error(f"DB write failed for task: {e}")
                
            # 5. Emit step event for each task
            step_msg = f"Task '{title}' " + ("created in Linear." if task_status == "created" else "failed to sync to Linear.")
            step_dict = emit_step(
                run_id=run_id,
                agent_name="task_agent",
                step_type="task_creation",
                message=step_msg,
                payload=task_dict,
                sequence=len(state.get("agent_trace", [])) + 1
            )
            if "agent_trace" not in state:
                state["agent_trace"] = []
            state["agent_trace"].append(step_dict)
            
    try:
        db_session.commit()
    except Exception as e:
        db_session.rollback()
        logger.error(f"DB commit failed: {e}")
        
    # 6. Set state and return
    state["tasks"] = final_tasks
    return state
