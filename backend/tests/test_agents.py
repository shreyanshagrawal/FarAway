import pytest
import uuid
import os
import json
from unittest.mock import patch
from agents.state import AgentState
from agents.domain_agent import run_domain_agent
from agents.insight_agent import run_insight_agent
from agents.priority_agent import run_priority_agent
from db.database import SessionLocal, Base, engine

# Ensure tables are created for tests
Base.metadata.create_all(bind=engine)

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_seed_text(filename: str) -> str:
    # Go up one dir from tests, then to data/seed
    filepath = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "seed", filename)
    with open(filepath, "r", encoding="utf-8") as f:
        return f.read()

@pytest.mark.asyncio
@patch('agents.llm_client.call_gemini')
async def test_domain_inference_software(mock_call_gemini, db_session):
    mock_call_gemini.return_value = '{"project_type": "software", "confidence_score": 0.95, "priority_weights": {}, "vocabulary": ["bug", "commit", "deploy"]}'
    run_id = str(uuid.uuid4())
    text = get_seed_text("software_50.txt")
    
    state = AgentState(
        run_id=run_id,
        input_bundle={"text": text},
        agent_trace=[]
    )
    
    result = await run_domain_agent(state, db_session)
    
    assert "domain_context" in result
    assert result["domain_context"]["project_type"] == "software"
    assert result["domain_context"]["confidence_score"] > 0.6

@pytest.mark.asyncio
@patch('agents.llm_client.call_gemini')
async def test_domain_inference_marketing(mock_call_gemini, db_session):
    mock_call_gemini.return_value = '{"project_type": "marketing", "confidence_score": 0.9, "priority_weights": {}, "vocabulary": ["campaign", "ads"]}'
    run_id = str(uuid.uuid4())
    text = get_seed_text("marketing_30.txt")
    
    state = AgentState(
        run_id=run_id,
        input_bundle={"text": text},
        agent_trace=[]
    )
    
    result = await run_domain_agent(state, db_session)
    assert "domain_context" in result
    assert result["domain_context"]["project_type"] == "marketing"

@pytest.mark.asyncio
@patch('agents.llm_client.call_gemini')
async def test_domain_inference_education(mock_call_gemini, db_session):
    mock_call_gemini.return_value = '{"project_type": "education", "confidence_score": 0.9, "priority_weights": {}, "vocabulary": ["student", "grades"]}'
    run_id = str(uuid.uuid4())
    text = get_seed_text("education_20.txt")
    
    state = AgentState(
        run_id=run_id,
        input_bundle={"text": text},
        agent_trace=[]
    )
    
    result = await run_domain_agent(state, db_session)
    assert "domain_context" in result
    assert result["domain_context"]["project_type"] == "education"

@pytest.mark.asyncio
@patch('agents.insight_agent.embed_texts')
@patch('agents.llm_client.call_gemini')
async def test_insight_agent_returns_clusters(mock_call_gemini, mock_embed_texts, db_session):
    mock_embed_texts.return_value = [[0.1] * 768 for _ in range(5)]
    mock_call_gemini.return_value = '{"theme_label": "Test Theme", "sentiment_score": 0.5}'
    run_id = str(uuid.uuid4())
    text = get_seed_text("software_50.txt")
    
    state = AgentState(
        run_id=run_id,
        input_bundle={"text": text},
        domain_context={"project_type": "software", "confidence_score": 0.9, "vocabulary": []},
        agent_trace=[]
    )
    
    result = await run_insight_agent(state, db_session)
    
    assert "insights" in result
    assert len(result["insights"]) >= 1
    for insight in result["insights"]:
        assert "theme_label" in insight
        assert "frequency" in insight
        assert "sentiment_score" in insight

@pytest.mark.asyncio
@patch('agents.insight_agent.embed_texts')
@patch('agents.llm_client.call_gemini')
async def test_priority_agent_returns_sorted_list(mock_call_gemini, mock_embed_texts, db_session):
    mock_embed_texts.return_value = [[0.1] * 768 for _ in range(5)]
    mock_call_gemini.side_effect = [
        '{"theme_label": "Test Theme 1", "sentiment_score": 0.5}',
        '{"impact_score": 8, "effort_score": 4, "confidence_score": 9, "rationale": "High ROI"}',
        '{"impact_score": 5, "effort_score": 8, "confidence_score": 5, "rationale": "Low ROI"}'
    ] * 5  # side effects enough for the loop
    run_id = str(uuid.uuid4())
    text = get_seed_text("software_50.txt")
    
    state = AgentState(
        run_id=run_id,
        input_bundle={"text": text},
        domain_context={"project_type": "software", "confidence_score": 0.9, "priority_weights": {"impact": 0.4, "effort": 0.3, "confidence": 0.3}},
        agent_trace=[]
    )
    
    # Run insight agent first to populate insights
    state = await run_insight_agent(state, db_session)
    
    # Now run priority agent
    result = await run_priority_agent(state, db_session)
    
    assert "priorities" in result
    assert len(result["priorities"]) > 0
    
    # Assert it is sorted by ice_score descending
    priorities = result["priorities"]
    sorted_priorities = sorted(priorities, key=lambda x: x["ice_score"], reverse=True)
    assert priorities == sorted_priorities
