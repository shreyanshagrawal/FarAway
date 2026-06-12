from langgraph.graph import StateGraph, START, END
from .state import AgentState

from .domain_agent import run_domain_agent
from .insight_agent import run_insight_agent
from .priority_agent import run_priority_agent
from .writer_agent import run_writer_agent
from .task_agent import run_task_agent
from db.database import SessionLocal
from db import models

async def orchestrator_node(state: AgentState):
    state["pipeline_status"] = "running"
    return state

async def domain_node(state: AgentState):
    db = SessionLocal()
    try:
        new_state = await run_domain_agent(state, db)
        return new_state
    finally:
        db.close()

async def insight_node(state: AgentState):
    db = SessionLocal()
    try:
        new_state = await run_insight_agent(state, db)
        return new_state
    finally:
        db.close()

async def priority_node(state: AgentState):
    db = SessionLocal()
    try:
        new_state = await run_priority_agent(state, db)
        return new_state
    finally:
        db.close()

async def writer_node(state: AgentState):
    db = SessionLocal()
    try:
        new_state = await run_writer_agent(state, db)
        return new_state
    finally:
        db.close()

async def task_node(state: AgentState):
    db = SessionLocal()
    try:
        new_state = await run_task_agent(state, db)
        new_state["pipeline_status"] = "complete"
        return new_state
    finally:
        db.close()
async def final_node(state: AgentState):
    db = SessionLocal()
    try:
        from api.streaming import publish_event
        from datetime import datetime, timezone
        
        state["pipeline_status"] = "complete"
        
        db_run = db.query(models.PipelineRun).filter(models.PipelineRun.id == state["run_id"]).first()
        if db_run:
            db_run.status = "complete"
            db_run.completed_at = datetime.now(timezone.utc)
            db.commit()
            
        event = {
            "type": "pipeline_complete",
            "agent": "orchestrator",
            "message": "Pipeline completed successfully.",
            "payload": None,
            "sequence": 999,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "run_id": state["run_id"]
        }
        publish_event(state["run_id"], event)
        return state
    finally:
        db.close()

graph_builder = StateGraph(AgentState)

graph_builder.add_node("orchestrator", orchestrator_node)
graph_builder.add_node("domain", domain_node)
graph_builder.add_node("insight", insight_node)
graph_builder.add_node("priority", priority_node)
graph_builder.add_node("writer", writer_node)
graph_builder.add_node("task", task_node)
graph_builder.add_node("final", final_node)

graph_builder.add_edge(START, "orchestrator")
graph_builder.add_edge("orchestrator", "domain")
graph_builder.add_edge("domain", "insight")
graph_builder.add_edge("insight", "priority")
graph_builder.add_edge("priority", "writer")
graph_builder.add_edge("writer", "task")
graph_builder.add_edge("task", "final")
graph_builder.add_edge("final", END)

compiled_graph = graph_builder.compile()
