from langgraph.graph import StateGraph, START, END
from .state import AgentState

def orchestrator_node(state: AgentState):
    return state

def domain_node(state: AgentState):
    return state

def insight_node(state: AgentState):
    return state

def priority_node(state: AgentState):
    return state

def writer_node(state: AgentState):
    return state

def task_node(state: AgentState):
    return state

graph_builder = StateGraph(AgentState)

graph_builder.add_node("orchestrator", orchestrator_node)
graph_builder.add_node("domain", domain_node)
graph_builder.add_node("insight", insight_node)
graph_builder.add_node("priority", priority_node)
graph_builder.add_node("writer", writer_node)
graph_builder.add_node("task", task_node)

graph_builder.add_edge(START, "orchestrator")
graph_builder.add_edge("orchestrator", "domain")
graph_builder.add_edge("domain", "insight")
graph_builder.add_edge("insight", "priority")
graph_builder.add_edge("priority", "writer")
graph_builder.add_edge("writer", "task")
graph_builder.add_edge("task", END)

compiled_graph = graph_builder.compile()
