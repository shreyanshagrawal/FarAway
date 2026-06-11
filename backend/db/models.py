import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, Float, DateTime, ForeignKey, JSON
from .database import Base

def generate_uuid():
    return str(uuid.uuid4())

def get_utcnow():
    return datetime.now(timezone.utc)

class PipelineRun(Base):
    __tablename__ = "pipeline_runs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    created_at = Column(DateTime, nullable=False, default=get_utcnow)
    status = Column(String(20), nullable=False) # pending | running | complete | error
    domain = Column(String(50), nullable=True)
    input_text = Column(Text, nullable=False)
    input_source = Column(String(20), nullable=False) # text | file | url
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)

class AgentStep(Base):
    __tablename__ = "agent_steps"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    run_id = Column(String(36), ForeignKey("pipeline_runs.id"))
    agent_name = Column(String(50), nullable=False)
    step_type = Column(String(50), nullable=False)
    message = Column(Text, nullable=False)
    payload = Column(JSON, nullable=True)
    sequence = Column(Integer, nullable=False)
    created_at = Column(DateTime, nullable=False, default=get_utcnow)

class DomainContext(Base):
    __tablename__ = "domain_contexts"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    run_id = Column(String(36), ForeignKey("pipeline_runs.id"), unique=True)
    project_type = Column(String(50), nullable=False)
    vocabulary = Column(JSON, nullable=False)
    spec_format = Column(String(50), nullable=False)
    priority_weights = Column(JSON, nullable=False)
    confidence_score = Column(Float, nullable=False)

class Insight(Base):
    __tablename__ = "insights"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    run_id = Column(String(36), ForeignKey("pipeline_runs.id"))
    theme_label = Column(String(200), nullable=False)
    frequency = Column(Integer, nullable=False)
    sentiment_score = Column(Float, nullable=False)
    representative_quotes = Column(JSON, nullable=True)
    rank = Column(Integer, nullable=False)

class Priority(Base):
    __tablename__ = "priorities"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    run_id = Column(String(36), ForeignKey("pipeline_runs.id"))
    initiative_title = Column(String(300), nullable=False)
    impact_score = Column(Float, nullable=False)
    effort_score = Column(Float, nullable=False)
    confidence_score = Column(Float, nullable=False)
    ice_score = Column(Float, nullable=False)
    rationale = Column(Text, nullable=False)
    rank = Column(Integer, nullable=False)

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    run_id = Column(String(36), ForeignKey("pipeline_runs.id"))
    priority_id = Column(String(36), ForeignKey("priorities.id"))
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    priority_tag = Column(String(5), nullable=False)
    effort_estimate = Column(String(5), nullable=False)
    linear_issue_id = Column(String(100), nullable=True)
    linear_url = Column(String(500), nullable=True)
    status = Column(String(20), nullable=False) # pending | created | failed
