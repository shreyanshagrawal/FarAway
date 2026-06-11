# UAPA — 100 Build Prompts
### For Antigravity (AI) + You (Developer) · Intermediate Level
### Checkpoint test every 5 prompts

---

## SPRINT 0 — ENVIRONMENT & SETUP
> Goal: Monorepo running, all services up, Linear tested, seed data ready.

---

### Prompt 1 — Antigravity
```
Create a monorepo project structure with the following folders at root:
/backend, /frontend, /prompts, /data/seed, /docs, /scripts

Inside /backend create:
- main.py (empty FastAPI app)
- requirements.txt with: fastapi, uvicorn, langgraph, qdrant-client, openai, anthropic, scikit-learn, sqlalchemy, alembic, tiktoken, python-dotenv, httpx

Inside /frontend run: npx create-next-app@14 . --typescript --tailwind --app

At root create a .env.example file with these keys (no values):
GEMINI_API_KEY=
LINEAR_API_KEY=
LINEAR_TEAM_ID=
LINEAR_PROJECT_ID=

Do not fill in any values.
```

---

### Prompt 2 — Antigravity
```
Create a docker-compose.yml at the project root that starts 3 services:

1. qdrant: uses image qdrant/qdrant:latest, exposes port 6333, mounts a local volume at ./qdrant_storage

2. backend: builds from ./backend using a Dockerfile you will also create,
   runs uvicorn main:app --reload on port 8000,
   mounts the ./backend directory as a volume so code changes reflect live,
   depends_on qdrant

3. frontend: builds from ./frontend, runs npm run dev on port 3000, depends_on backend

Also create /backend/Dockerfile:
- FROM python:3.11-slim
- WORKDIR /app
- COPY requirements.txt .
- RUN pip install -r requirements.txt
- COPY . .
- CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

---

### Prompt 3 — You
```
1. Copy .env.example to .env and fill in your real API keys.
2. Run: docker-compose up --build
3. Visit http://localhost:6333/healthz — Qdrant should return {"title":"qdrant","version":"..."}
4. Visit http://localhost:8000 — FastAPI should return {"Hello":"World"} or similar.
5. Visit http://localhost:3000 — Next.js default page should load.

If anything fails, check docker-compose logs <service_name>.
```

---

### Prompt 4 — Antigravity
```
Create 3 seed data files in /data/seed/:

1. software_50.txt — 50 lines of realistic software product feedback.
   Mix of: bug reports, feature requests, performance complaints, UX praise.
   Examples of domains: GitHub issues, sprint retros, user interviews.
   Each line is one feedback item, no numbering.

2. marketing_30.txt — 30 lines of marketing campaign feedback.
   Mix of: ad performance notes, copy feedback, audience targeting concerns,
   channel performance, brand voice comments.

3. education_20.txt — 20 lines of school/curriculum feedback.
   Mix of: student engagement issues, curriculum gaps, teacher workload,
   assessment feedback, resource requests.

Make the data realistic and varied — not generic lorem ipsum.
```

---

### Prompt 5 — Antigravity
```
In /backend/main.py, set up a basic FastAPI app with:

1. A GET /api/health endpoint that returns:
{
  "status":"ok",
  "qdrant":"ok",
  "gemini":"ok"
}

2. Load environment variables from .env using python-dotenv at startup.

3. Add CORS middleware that allows all origins (we'll restrict later).

4. A root GET / endpoint returning {"service": "UAPA Backend", "version": "1.0.0"}

Install and import: fastapi, uvicorn, python-dotenv, fastapi.middleware.cors
```

---

### ✅ CHECKPOINT 1 (After Prompt 5)
**You run these checks:**
```
1. curl http://localhost:8000/api/health
   Expected: {"status":"ok","qdrant":"ok","llm":"ok"}

2. curl http://localhost:8000
   Expected: {"service":"UAPA Backend","version":"1.0.0"}

3. docker-compose ps
   Expected: all 3 services show "Up"

4. Check /data/seed/ — 3 files exist with correct line counts:
   wc -l data/seed/*.txt
   Expected: 50, 30, 20 lines

5. .env exists and has all 5 keys filled in (don't commit this file).
```
**Pass all 5? Move to Prompt 6. Fail any? Fix before continuing.**

---

## SPRINT 1 — DATABASE & STATE MACHINE
> Goal: All 6 SQLite tables created. LangGraph AgentState skeleton wired.

---

### Prompt 6 — Antigravity
```
In /backend, create a file db/models.py using SQLAlchemy ORM.

Define these 6 tables exactly as specified:

Table 1: pipeline_runs
- id: UUID, primary key
- created_at: DateTime, not null, default utcnow
- status: String(20), not null  [pending | running | complete | error]
- domain: String(50), nullable
- input_text: Text, not null
- input_source: String(20), not null  [text | file | url]
- completed_at: DateTime, nullable
- error_message: Text, nullable

Table 2: agent_steps
- id: UUID, primary key
- run_id: UUID, ForeignKey pipeline_runs.id
- agent_name: String(50), not null
- step_type: String(50), not null
- message: Text, not null
- payload: JSON, nullable
- sequence: Integer, not null
- created_at: DateTime, not null, default utcnow

Table 3: domain_contexts
- id: UUID, primary key
- run_id: UUID, ForeignKey pipeline_runs.id, unique
- project_type: String(50), not null
- vocabulary: JSON, not null
- spec_format: String(50), not null
- priority_weights: JSON, not null
- confidence_score: Float, not null

Table 4: insights
- id: UUID, primary key
- run_id: UUID, ForeignKey pipeline_runs.id
- theme_label: String(200), not null
- frequency: Integer, not null
- sentiment_score: Float, not null
- representative_quotes: JSON, nullable
- rank: Integer, not null

Table 5: priorities
- id: UUID, primary key
- run_id: UUID, ForeignKey pipeline_runs.id
- initiative_title: String(300), not null
- impact_score: Float, not null
- effort_score: Float, not null
- confidence_score: Float, not null
- ice_score: Float, not null
- rationale: Text, not null
- rank: Integer, not null

Table 6: tasks
- id: UUID, primary key
- run_id: UUID, ForeignKey pipeline_runs.id
- priority_id: UUID, ForeignKey priorities.id
- title: String(500), not null
- description: Text, not null
- priority_tag: String(5), not null
- effort_estimate: String(5), not null
- linear_issue_id: String(100), nullable
- linear_url: String(500), nullable
- status: String(20), not null  [pending | created | failed]

Use SQLite for now. Create db/database.py that creates the engine and a get_db() session dependency.
Create db/__init__.py.
Run create_all() on startup in main.py.
```

---

### Prompt 7 — Antigravity
```
In /backend create agents/state.py.

Define the LangGraph AgentState as a TypedDict with these keys:
- run_id: str
- input_bundle: dict  (keys: text, source, domain_override)
- domain_context: dict | None
- insights: list
- priorities: list
- spec_document: str | None
- tasks: list
- agent_trace: list  (list of step dicts)
- pipeline_status: str  (pending | running | complete | error)
- error_message: str | None

Also create agents/__init__.py.

Then in agents/graph.py, create the LangGraph StateGraph:
- Import StateGraph from langgraph.graph
- Create a graph with AgentState
- Add 6 placeholder node functions (each just returns the state unchanged for now):
  orchestrator_node, domain_node, insight_node, priority_node, writer_node, task_node
- Add edges: START → orchestrator → domain → insight → priority → writer → task → END
- Compile the graph and export it as: compiled_graph

Do not implement any logic yet — just the skeleton with placeholder nodes.
```

---

### Prompt 8 — Antigravity
```
In /backend create a file agents/utils.py with these shared utility functions:

1. chunk_text(text: str, max_tokens: int = 512) -> list[str]
   Uses tiktoken with the "cl100k_base" encoding.
   Splits text into chunks of at most max_tokens tokens.
   Returns a list of string chunks.

2. emit_step(run_id: str, agent_name: str, step_type: str, message: str, payload: dict | None, sequence: int) -> dict
   Returns a dict formatted as the SSE event schema:
   {type, agent, message, payload, sequence, timestamp (ISO format), run_id}
   Does NOT write to DB yet — just formats and returns the dict.

3. generate_run_id() -> str
   Returns a new UUID4 as a string.

Add proper imports: tiktoken, uuid, datetime.
```

---

### Prompt 9 — Antigravity
```
Create /backend/prompts/domain.txt — the system prompt for the domain inference agent.

The prompt must use XML structure with these sections:
<context>, <task>, <constraints>, <output_format>

<context>: You are the domain inference module of UAPA, an autonomous PM agent.
You receive raw unstructured input that could be from any industry.

<task>: Analyse the input text and determine:
1. project_type: one of [software, marketing, education, healthcare, legal, ops, general]
2. vocabulary: array of 5-10 domain-specific terms found in the input
3. spec_format: one of [prd, campaign_brief, curriculum_plan, care_plan, case_plan, general_spec]
4. priority_weights: object with keys impact, effort, compliance, reach — each a float 0.0-1.0 summing to 1.0
   (software: impact 0.4, effort 0.3, compliance 0.1, reach 0.2)
   (marketing: impact 0.3, effort 0.2, compliance 0.1, reach 0.4)
   (education: impact 0.35, effort 0.3, compliance 0.2, reach 0.15)
   (default general: impact 0.35, effort 0.3, compliance 0.15, reach 0.2)
5. confidence_score: float 0.0-1.0

<constraints>:
- If confidence < 0.6, set project_type to "general"
- Return ONLY valid JSON, no preamble, no markdown fences
- Do not hallucinate domain terms not present in the input

<output_format>: Return exactly this JSON schema:
{"project_type": string, "vocabulary": [string], "spec_format": string,
 "priority_weights": {"impact": float, "effort": float, "compliance": float, "reach": float},
 "confidence_score": float}
```

---

### Prompt 10 — Antigravity
```
Implement the domain inference agent in /backend/agents/domain_agent.py.

Function signature: async def run_domain_agent(state: AgentState, db_session) -> AgentState

Steps:
1. Load the prompt from /prompts/domain.txt
2. Call Gemini 2.5 Flash (gemini-2.5-flash) with:
   - The system prompt from domain.txt
   - User message: the first 4000 characters of state["input_bundle"]["text"]
   - max_tokens: 500
3. Parse the JSON response. If parsing fails, return a default "general" domain context.
Generate structured JSON output matching the schema defined in domain.txt.
4. Respect domain_override from input_bundle: if set, override project_type with it.
5. Build a DomainContext dict from the parsed response and store it in state["domain_context"].
6. Emit a step dict using emit_step() and append it to state["agent_trace"].
7. Write the domain_context to the domain_contexts table in the DB.
8. Return the updated state.

Use the Google GenAI SDK. Load GEMINI_API_KEY from environment.
Add error handling: on any exception, set domain to "general" with confidence 0.0 and continue.
On failure:
fallback to the default general domain context.
```

---

### ✅ CHECKPOINT 2 (After Prompt 10)
**You run these checks:**

```python
# /backend/test_checkpoint2.py
import asyncio
from db.database import SessionLocal, engine
from db import models
from agents.state import AgentState
from agents.domain_agent import run_domain_agent
from agents.utils import generate_run_id

models.Base.metadata.create_all(bind=engine)

async def test():
    db = SessionLocal()
    state: AgentState = {
        "run_id": generate_run_id(),
        "input_bundle": {
            "text": open("../data/seed/software_50.txt").read(),
            "source": "text",
            "domain_override": None
        },
        "domain_context": None,
        "insights": [], "priorities": [], "spec_document": None,
        "tasks": [], "agent_trace": [], "pipeline_status": "running",
        "error_message": None
    }
    result = await run_domain_agent(state, db)
    print("Domain:", result["domain_context"]["project_type"])
    print("Confidence:", result["domain_context"]["confidence_score"])
    print("Trace steps:", len(result["agent_trace"]))
    db.close()

asyncio.run(test())
```

**Expected output:**
```
Domain: software
Confidence: (anything above 0.6)
Trace steps: 1
```

**Also test with marketing_30.txt — should return Domain: marketing**
**Pass both? Move to Prompt 11.**

---

## SPRINT 1 CONTINUED — INSIGHT AGENT
> Goal: Qdrant working, embeddings running, clustering producing themes.

---

### Prompt 11 — Antigravity
```
Create /backend/agents/insight_agent.py.

Function signature: async def run_insight_agent(state: AgentState, db_session) -> AgentState

Steps:
1. Chunk state["input_bundle"]["text"] using chunk_text() from utils.py (512 tokens max)
2. For each chunk, call OpenAI text-embedding-3-small to get a 1536-dim embedding.
   Use the openai Python SDK. Batch the calls — one API call per chunk is fine for MVP.
3. Upsert all chunk vectors to Qdrant:
   - Collection name: "input_chunks"
   - Each point has: id (uuid), vector (1536 floats), payload {run_id, text, chunk_index}
   - Create the collection if it doesn't exist (distance: Cosine, size: 1536)
4. Retrieve all vectors for this run_id from Qdrant.
5. Run KMeans clustering with scikit-learn:
   - Try k = 3 to min(8, num_chunks) and pick k with best silhouette score
   - If fewer than 6 chunks, use k=2
6. For each cluster, collect the chunk texts and call Claude to:
   - Label the theme (one short phrase)
   - Score sentiment (-1.0 to 1.0)
   Use a simple prompt: "Given these feedback items, return JSON: {theme_label: string, sentiment_score: float}"
7. Rank clusters by frequency × abs(sentiment_score) descending.
8. Build InsightReport: list of {theme_label, frequency, sentiment_score, representative_quotes (top 3 chunks), rank}
9. Store each insight in the insights table.
10. Emit step events and append to agent_trace.
11. Set state["insights"] and return state.

Load OPENAI_API_KEY and Qdrant host (default localhost:6333) from environment.
```

---

### Prompt 12 — Antigravity
```
Create /backend/agents/priority_agent.py.

Function signature: async def run_priority_agent(state: AgentState, db_session) -> AgentState

Steps:
1. Read state["insights"] and state["domain_context"]["priority_weights"]
2. For each insight theme, call Claude to score:
   - impact_score: 1.0-10.0
   - effort_score: 1.0-10.0 (higher = more effort)
   - confidence_score: 1.0-10.0
   Use a prompt that includes the theme_label, frequency, sentiment_score, and domain context.
   Return JSON: {impact_score, effort_score, confidence_score, rationale}
3. Calculate ICE score:
   weights = state["domain_context"]["priority_weights"]
   adjusted_impact = impact_score * (weights["impact"] + weights["reach"])
   adjusted_effort = effort_score * weights["effort"]
   ice_score = (adjusted_impact * confidence_score) / adjusted_effort
   
   Special multipliers:
   - If domain is "healthcare": multiply ice_score by 1.5 if compliance keyword detected
   - If domain is "marketing": multiply impact by 1.3

4. Sort all items by ice_score descending, assign rank.
5. Store each priority in the priorities table.
6. Emit step events, set state["priorities"], return state.
```

---

### Prompt 13 — Antigravity
```
Create 3 writer prompt files:

/backend/prompts/writer_software.txt
Structure a PRD with these sections:
- Problem Statement
- Target Users
- User Stories (at least 5, in "As a [user], I want [goal] so that [reason]" format)
- Acceptance Criteria
- Out of Scope
- Success Metrics
- Technical Notes

/backend/prompts/writer_marketing.txt
Structure a Campaign Brief with:
- Campaign Objective
- Target Audience
- Key Message
- Channel Strategy
- KPIs and Metrics
- Timeline
- Budget Considerations
- Creative Direction

/backend/prompts/writer_education.txt
Structure a Curriculum Plan with:
- Learning Objectives
- Module Breakdown
- Weekly Schedule
- Assessment Strategy
- Resource Requirements
- Success Indicators
- Risk Considerations

Each prompt file must:
- Use XML structure: <context>, <task>, <constraints>, <output_format>
- Instruct Claude to use the domain context vocabulary
- Output well-formatted markdown
- Return only the document, no preamble
```

---

### Prompt 14 — Antigravity
```
Create /backend/agents/writer_agent.py.

Function signature: async def run_writer_agent(state: AgentState, db_session) -> AgentState

Steps:
1. Select the correct prompt file based on state["domain_context"]["spec_format"]:
   prd → writer_software.txt
   campaign_brief → writer_marketing.txt
   curriculum_plan → writer_education.txt
   anything else → writer_software.txt (fallback)

2. Build the user message:
   - Top 5 priorities from state["priorities"] (title + rationale)
   - Domain vocabulary from state["domain_context"]["vocabulary"]
   - Top insights with sentiment context

3. Call Claude (claude-sonnet-4-20250514) with max_tokens 2000.

4. The response is the raw markdown SpecDocument.

5. Store the spec in state["spec_document"].

6. Emit step events, return state.

Do not store spec in DB — it goes into AgentState only for now.
```

---

### Prompt 15 — Antigravity
```
Create /backend/agents/task_agent.py.

Function signature: async def run_task_agent(state: AgentState, db_session) -> AgentState

Steps:
1. Call Claude with state["spec_document"] and this instruction:
   "Decompose this specification into 6-10 granular tasks.
    Return ONLY a JSON array. Each item:
    {title, description, priority_tag (P0/P1/P2/P3), effort_estimate (XS/S/M/L/XL)}"

2. For each task, attempt to create a Linear issue via GraphQL:
   Endpoint: https://api.linear.app/graphql
   Mutation:
   mutation CreateIssue($title: String!, $description: String!, $teamId: String!) {
     issueCreate(input: {title: $title, description: $description, teamId: $teamId}) {
       success
       issue { id url }
     }
   }
   Headers: {"Authorization": LINEAR_API_KEY, "Content-Type": "application/json"}

3. On success: store linear_issue_id and linear_url in task dict, status = "created"
   On failure: status = "failed", continue (do not crash the pipeline)

4. Store all tasks in the tasks table.

5. Emit step events for each task created/failed.

6. Set state["tasks"], return state.

Load LINEAR_API_KEY and LINEAR_TEAM_ID from environment.
```

---

### ✅ CHECKPOINT 3 (After Prompt 15)
**You run this end-to-end test script:**

```python
# /backend/test_checkpoint3.py
import asyncio
from agents.graph import compiled_graph
from agents.utils import generate_run_id
from db.database import SessionLocal, engine
from db import models

models.Base.metadata.create_all(bind=engine)

async def test_pipeline(filename):
    db = SessionLocal()
    text = open(f"../data/seed/{filename}").read()
    initial_state = {
        "run_id": generate_run_id(),
        "input_bundle": {"text": text, "source": "text", "domain_override": None},
        "domain_context": None, "insights": [], "priorities": [],
        "spec_document": None, "tasks": [], "agent_trace": [],
        "pipeline_status": "running", "error_message": None
    }
    result = await compiled_graph.ainvoke(initial_state)
    print(f"\n--- {filename} ---")
    print(f"Domain: {result['domain_context']['project_type']}")
    print(f"Insights: {len(result['insights'])}")
    print(f"Priorities: {len(result['priorities'])}")
    print(f"Spec length: {len(result['spec_document'] or '')} chars")
    print(f"Tasks: {len(result['tasks'])}")
    created = [t for t in result['tasks'] if t['status'] == 'created']
    print(f"Linear tickets created: {len(created)}")
    db.close()

asyncio.run(test_pipeline("software_50.txt"))
```

**Expected output (roughly):**
```
Domain: software
Insights: 4-8
Priorities: 4-8
Spec length: 1000+ chars
Tasks: 6-10
Linear tickets created: 6-10  (or 0 if Linear key not configured — check failed tasks)
```

**Pass this? Move to Prompt 16.**

---

## SPRINT 2 — FASTAPI & SSE STREAMING
> Goal: Full pipeline accessible via HTTP with real-time streaming.

---

### Prompt 16 — Antigravity
```
In /backend, create api/schemas.py with Pydantic models:

RunRequest:
- input_text: str
- input_source: Literal["text", "file", "url"] = "text"
- domain_override: str | None = None

RunResponse:
- run_id: str
- status: str
- stream_url: str
- created_at: str

ResultResponse:
- run_id: str
- status: str
- domain: str | None
- domain_confidence: float | None
- insights: list
- priorities: list
- spec_document: str | None
- tasks: list
- agent_steps: list
- completed_at: str | None

HealthResponse:
- status: str
- qdrant: str
- llm: str

Also create api/__init__.py.
```

---

### Prompt 17 — Antigravity
```
Create /backend/api/routes.py with these FastAPI endpoints:

1. POST /api/run
   - Accepts RunRequest body
   - Creates a pipeline_runs record in DB with status "pending"
   - Starts the LangGraph pipeline in a background task (asyncio.create_task)
   - Returns RunResponse immediately (run_id, status="pending", stream_url)

2. GET /api/run/{run_id}/result
   - Queries DB for the run and all related records
   - Returns ResultResponse with full assembled data
   - Returns 404 if run not found

3. GET /api/runs
   - Returns list of all pipeline runs (id, status, domain, created_at) sorted by created_at desc

4. GET /api/health
   - Pings Qdrant at localhost:6333/healthz
   - Returns HealthResponse

Include these imports: fastapi, sqlalchemy session dependency, all db models.
Register this router in main.py with prefix="" (no prefix needed, routes already have /api/).
```

---

### Prompt 18 — Antigravity
```
Implement SSE streaming in /backend/api/streaming.py.

Create a module-level dict: active_streams: dict[str, asyncio.Queue] = {}

Function: get_or_create_queue(run_id: str) -> asyncio.Queue
   Creates a new asyncio.Queue for the run_id if not present, returns it.

Function: publish_event(run_id: str, event: dict)
   Puts the event dict onto the queue for run_id.
   If no queue exists for that run_id, silently ignore.

SSE endpoint — add to routes.py:
GET /api/run/{run_id}/stream
   - Creates a StreamingResponse with media_type "text/event-stream"
   - Generator function that:
     1. Gets or creates a queue for run_id
     2. Loops: gets next item from queue with timeout=30s
     3. Yields: f"data: {json.dumps(event)}\n\n"
     4. On timeout: yields "data: {\"type\":\"keepalive\"}\n\n"
     5. On pipeline_complete or pipeline_error event type: yields final event then breaks
   - Adds headers: Cache-Control: no-cache, X-Accel-Buffering: no

Then update all 6 agents to call publish_event(run_id, step_dict) after every emit_step call.
```

---

### Prompt 19 — Antigravity
```
Update the LangGraph graph in /backend/agents/graph.py to wire in the real agent functions.

Replace the placeholder nodes with actual calls:

Each node function receives (state: AgentState) — note: db session needs to be handled.
Create a helper that wraps each agent with a fresh DB session per invocation.

Updated graph flow:
START 
→ orchestrator_node (sets pipeline_status="running", emits pipeline start event)
→ domain_node (calls run_domain_agent)
→ insight_node (calls run_insight_agent)  
→ priority_node (calls run_priority_agent)
→ writer_node (calls run_writer_agent)
→ task_node (calls run_task_agent)
→ END

After task_node, add a final step that:
- Sets pipeline_status = "complete"
- Updates pipeline_runs record in DB (status, completed_at)
- Publishes a pipeline_complete event to the SSE stream

Add error handling at orchestrator level:
- Wrap the full graph in try/except
- On exception: set pipeline_status="error", publish pipeline_error event, update DB

Export compiled_graph.
```

---

### Prompt 20 — Antigravity
```
Update /backend/api/routes.py POST /api/run to properly launch the pipeline:

1. After creating the DB record, call:
   asyncio.create_task(run_pipeline_background(run_id, request.input_text, request.input_source, request.domain_override, db))

2. Create the background function run_pipeline_background:
   - Builds initial AgentState
   - Calls compiled_graph.ainvoke(initial_state)
   - On completion: updates pipeline_runs record with final status and completed_at
   - On exception: updates status to "error", stores error_message
   - Always closes the DB session

3. Update GET /api/run/{run_id}/result to assemble the full ResultResponse from all 6 tables.

4. Add a pre-baked fallback: after the first successful run, save the result JSON to
   /data/cache/{run_id}.json for demo recovery. Do this inside run_pipeline_background.

Also update /backend/main.py to import and include the router.
```

---

### ✅ CHECKPOINT 4 (After Prompt 20)
**You test the full API with curl:**

```bash
# 1. Start a run
curl -X POST http://localhost:8000/api/run \
  -H "Content-Type: application/json" \
  -d '{"input_text": "'$(cat data/seed/software_50.txt | tr '\n' ' ')'", "input_source": "text"}'
# Save the run_id from the response

# 2. Stream the events (open in separate terminal)
curl -N http://localhost:8000/api/run/{YOUR_RUN_ID}/stream

# 3. After stream ends, get the result
curl http://localhost:8000/api/run/{YOUR_RUN_ID}/result

# 4. Check health
curl http://localhost:8000/api/health

# 5. List runs
curl http://localhost:8000/api/runs
```

**Expected:**
- POST /api/run returns immediately with run_id
- /stream produces 10+ SSE events (data: {...}) before pipeline_complete
- /result returns full JSON with insights, priorities, spec, tasks populated
- /health returns {"status":"ok","qdrant":"ok","llm":"ok"}
- /runs returns array with your run in it

**All passing? Move to Prompt 21.**

---

## SPRINT 3 — NEXT.JS FRONTEND
> Goal: Full UI with live streaming trace and all output cards rendered.

---

### Prompt 21 — Antigravity
```
In /frontend, configure the Next.js API proxy.

In next.config.ts, add rewrites:
- /api/:path* → http://localhost:8000/api/:path*

This proxies all /api calls from the frontend to FastAPI.

Then create /frontend/src/types/api.ts with TypeScript interfaces matching the backend schemas:

interface RunRequest { input_text: string; input_source: string; domain_override?: string }
interface RunResponse { run_id: string; status: string; stream_url: string; created_at: string }
interface AgentStep { type: string; agent: string; message: string; payload: any; sequence: number; timestamp: string }
interface Insight { theme_label: string; frequency: number; sentiment_score: number; representative_quotes: string[]; rank: number }
interface Priority { initiative_title: string; impact_score: number; effort_score: number; confidence_score: number; ice_score: number; rationale: string; rank: number }
interface Task { title: string; description: string; priority_tag: string; effort_estimate: string; linear_issue_id?: string; linear_url?: string; status: string }
interface PipelineResult { run_id: string; status: string; domain?: string; domain_confidence?: number; insights: Insight[]; priorities: Priority[]; spec_document?: string; tasks: Task[]; agent_steps: AgentStep[] }
```

---

### Prompt 22 — Antigravity
```
Create /frontend/src/hooks/useAgentStream.ts

This hook manages the full pipeline state:

State it tracks:
- runId: string | null
- status: "idle" | "running" | "complete" | "error"
- agentSteps: AgentStep[]
- domainContext: {project_type, confidence_score, vocabulary} | null
- insights: Insight[]
- priorities: Priority[]
- specDocument: string | null
- tasks: Task[]
- error: string | null

Functions it exposes:
- startRun(inputText: string, domainOverride?: string): void
  POST to /api/run, get run_id, then open EventSource to /api/run/{run_id}/stream
  
- On each SSE event: parse the JSON, update the correct state field based on event.type:
  - "agent_complete" where agent="domain": extract domain info from payload
  - "agent_complete" where agent="insight": set insights from payload
  - "agent_complete" where agent="priority": set priorities from payload
  - "agent_complete" where agent="writer": set specDocument from payload
  - "agent_complete" where agent="task": set tasks from payload
  - "pipeline_complete": set status="complete", close EventSource
  - "pipeline_error": set status="error", close EventSource
  - All events: append to agentSteps

- resetRun(): resets all state to initial

Return all state values and startRun, resetRun functions.
```

---

### Prompt 23 — Antigravity
```
Create the input screen at /frontend/src/app/page.tsx.

Design: dark background (#0F0F11), centered layout, maximum width 680px.

Elements:
1. Header: "UAPA" in large bold text, subtitle "Universal Autonomous PM Agent" in muted text

2. Large textarea (min-height 200px):
   placeholder: "Paste feedback, describe your project, or drop in raw notes. Any format. Any domain."
   Dark background, subtle border, monospace font
   
3. Below textarea: token count estimate ("~{n} tokens") — estimate as charCount/4, show in muted text

4. Domain override dropdown (optional, collapsed by default behind a "Set domain manually" toggle):
   Options: Auto-detect, Software, Marketing, Education, Healthcare, Legal, Operations

5. Full-width "Run Agent →" button, purple (#7C3AED), disabled when textarea is empty or status is "running"

6. When status is "running": replace button text with "Running..." and show a subtle animated border

Wire to useAgentStream hook. On button click call startRun(textareaValue, domainOverride).
When status changes to "running", navigate or scroll to the results layout (Prompt 24).
```

---

### Prompt 24 — Antigravity
```
Create the two-panel results layout at /frontend/src/app/components/ResultsLayout.tsx.

Layout:
- Full viewport width, two columns side by side
- Left panel: 38% width, fixed height, overflow-y scroll, label "Agent Reasoning"
- Right panel: 62% width, label "Output"
- On mobile (< 768px): single column, left panel collapsed behind a toggle button

Left panel — ReasoningTrace:
- Receives agentSteps: AgentStep[] as prop
- Maps each step to an AgentStepCard component (Prompt 25)
- Auto-scrolls to latest card as new steps arrive
- Shows a pulsing dot labeled with current agent name while status="running"

Right panel — OutputPanel:
- Receives {domainContext, insights, priorities, specDocument, tasks, status} as props
- Shows DomainCard at the top (always, once domain is set)
- Below: tab strip with 4 tabs: Insights / Priorities / Spec / Tasks
- Each tab is disabled (grayed out) until its data arrives
- Active tab shows its content component

Connect this layout in page.tsx: show ResultsLayout once status is "running" or "complete".
```

---

### Prompt 25 — Antigravity
```
Create these 6 UI card components in /frontend/src/app/components/:

1. AgentStepCard.tsx
   Props: step: AgentStep
   Agent colour map:
     orchestrator → #7C3AED, domain → #059669, insight → #0D9488
     priority → #DC2626, writer → #D97706, task → #2563EB
   Shows: coloured agent badge (11px pill), message text (13px), timestamp (muted, right-aligned)
   Expandable: clicking reveals pre-formatted JSON of step.payload
   Completed state: 0.7 opacity with checkmark

2. DomainCard.tsx
   Props: projectType, confidenceScore, vocabulary[]
   Shows domain name large, confidence as percentage, vocabulary as small pills
   Background: subtle green tint (#059669 at 10% opacity)

3. InsightCard.tsx
   Props: insight: Insight
   Shows: theme label (bold), horizontal frequency bar (teal fill), sentiment chip
   Sentiment: green if > 0.3, red if < -0.3, gray otherwise
   Expandable: shows representative_quotes as indented list

4. PriorityTable.tsx
   Props: priorities: Priority[]
   Sortable table: Initiative / Impact / Effort / Confidence / ICE Score
   Top row: left border accent in teal
   Expandable row: shows rationale text

5. SpecCard.tsx
   Props: specDocument: string
   Renders markdown using react-markdown
   Copy-all button (top right): copies raw markdown to clipboard
   Section headings are collapsible

6. TaskCard.tsx
   Props: task: Task
   Priority badge colours: P0 red, P1 orange, P2 blue, P3 gray
   Effort chip: XS/S/M/L/XL
   Linear link: opens in new tab if linear_url exists
   Status dot: green=created, yellow=pending, red=failed
```

---

### ✅ CHECKPOINT 5 (After Prompt 25)
**You manually test the full UI flow:**

```
1. Open http://localhost:3000
   ✓ Input screen renders with textarea, token counter, Run button

2. Paste software_50.txt content into textarea
   ✓ Token count updates (~300-400 tokens)
   ✓ Run button is active

3. Click "Run Agent →"
   ✓ Button shows "Running..."
   ✓ Results layout appears
   ✓ Left panel starts filling with AgentStepCards
   ✓ Each card has the correct colour for its agent

4. Watch domain card appear (within 5 seconds)
   ✓ Shows "Software / SaaS" or "software"
   ✓ Shows confidence score > 0.6

5. Watch tabs unlock progressively:
   ✓ Insights tab unlocks and shows frequency bars
   ✓ Priorities tab shows ICE table
   ✓ Spec tab shows formatted markdown document
   ✓ Tasks tab shows task cards

6. Check Linear (if configured)
   ✓ Tasks show "created" status with linear links
   ✓ Open one link — issue exists in Linear board

7. Run again with marketing_30.txt
   ✓ Domain switches to "Marketing"
   ✓ Spec tab shows Campaign Brief structure, not PRD
```

**All 7 passing? Move to Prompt 26.**

---

## SPRINT 3 CONTINUED — UI POLISH
> Goal: Review screen, mobile layout, edge cases.

---

### Prompt 26 — Antigravity
```
Add approve/edit/regenerate controls to each output section.

In each output card (InsightCard, PriorityTable, SpecCard, TaskCard), add a control bar at the top right:
- "✓ Approve" button: marks this section as approved (store in local state), button turns green
- "✎ Edit" button: for SpecCard only — opens an inline textarea pre-filled with specDocument markdown
  Allow editing, show "Save" button that updates local specDocument state
- "↻ Regenerate" button: shows a small text input "Add a note (optional)" and a "Re-run" button
  On re-run: POST to a new endpoint /api/run/{run_id}/regenerate with {section: string, note: string}
  (stub this endpoint for now — just return 200)

In useAgentStream, add approved: Record<string, boolean> state
and approveSection(section: string) function.
```

---

### Prompt 27 — Antigravity
```
Implement mobile layout for the results page.

At viewport width < 768px:

1. ResultsLayout switches to single column (full width)

2. Add a sticky toggle bar at the top:
   Two buttons side by side: "Agent Thinking" | "Output"
   Active button has purple underline

3. "Agent Thinking" view: shows the ReasoningTrace panel full width
   "Output" view: shows the OutputPanel full width

4. DomainCard is always visible above the toggle bar regardless of which view is active

5. Tab strip in OutputPanel wraps to 2x2 grid on mobile if all 4 tabs don't fit in one row

6. All AgentStepCards collapse their expand section by default on mobile

Use Tailwind responsive prefixes (md:) throughout. No additional libraries needed.
```

---

### Prompt 28 — Antigravity
```
Add a runs history page at /frontend/src/app/runs/page.tsx.

Fetches GET /api/runs on mount.

Shows a table with columns:
- Run ID (first 8 chars)
- Domain (with coloured badge matching agent colour)
- Status (green=complete, yellow=running, red=error)
- Created at (relative time: "2 minutes ago")
- Action: "View" button

Clicking View navigates to /runs/{run_id} which:
- Fetches GET /api/run/{run_id}/result
- Renders the full ResultsLayout in read-only mode (no streaming, data already populated)
- No approve/regenerate controls — display only

Add a "← New Run" link at the top of this page that goes back to /.
Add a "History" link in the header on the main page.
```

---

### Prompt 29 — Antigravity
```
Add the demo fallback mechanism.

In /frontend/src/hooks/useAgentStream.ts, modify startRun:

1. Add a loadCachedRun(runId: string) function:
   - Fetches GET /api/run/{runId}/result
   - Artificially streams the agent_steps array with 200ms delay between each step
   - Populates all state fields as if it were a live run
   - This makes a cached run look identical to a live run

2. In the input screen, add a hidden "Load Demo" button (visible only when URL has ?demo=true):
   - Shows a small input for cached run_id
   - Calls loadCachedRun with that ID
   - This is the demo fallback — no live API calls needed

3. The artificial streaming in loadCachedRun should use the same SSE event parsing logic
   so the UI behaves identically.

In /backend/api/routes.py, ensure GET /api/run/{run_id}/result works for cached results too
(it reads from DB, so it should already work).
```

---

### Prompt 30 — Antigravity
```
Add loading and error states throughout the UI.

1. When status="running" and no agentSteps yet (first 3 seconds):
   Show a centered spinner with text "Starting agents..." in the left panel

2. When an agent step has type="pipeline_error":
   Show a red banner at the top: "Pipeline failed: {error message}"
   Show a "Try again" button that calls resetRun()

3. When /api/run/{id}/result returns 404:
   Show a friendly error: "Run not found. It may have expired."

4. When Linear ticket creation fails for a task:
   Show a yellow warning badge on the TaskCard: "Linear unavailable — saved locally"

5. Empty states:
   If insights is empty: "No distinct themes found. Try with more feedback items."
   If priorities is empty: "Not enough data to rank priorities."
   If tasks is empty: "Spec generated — no tasks decomposed yet."

6. Add a global error boundary in layout.tsx that catches any unhandled React errors
   and shows: "Something went wrong. Refresh to try again."
```

---

### ✅ CHECKPOINT 6 (After Prompt 30)
**You test edge cases:**

```
1. Submit empty textarea — Run button should remain disabled ✓

2. Submit very short text (5 words) — pipeline should complete without crashing,
   domain should fall back to "general" ✓

3. Disconnect from internet after starting a run — should show error state gracefully ✓

4. Open http://localhost:3000/runs — should show history table ✓

5. Click View on a completed run — should load ResultsLayout with all data ✓

6. Open http://localhost:3000?demo=true — Load Demo button should appear ✓

7. Resize browser to 375px width — mobile layout should activate,
   toggle bar appears, panels switch correctly ✓
```

**All 7 passing? Move to Prompt 31.**

---

## SPRINT 4 — INTEGRATION, TESTING & DEMO PREP
> Goal: End-to-end testing, README, demo rehearsal, clean build.

---

### Prompt 31 — Antigravity
```
Write /backend/tests/test_agents.py using pytest and pytest-asyncio.

Test 1: test_domain_inference_software
- Input: software_50.txt
- Assert result["domain_context"]["project_type"] == "software"
- Assert result["domain_context"]["confidence_score"] > 0.6

Test 2: test_domain_inference_marketing
- Input: marketing_30.txt
- Assert result["domain_context"]["project_type"] == "marketing"

Test 3: test_domain_inference_education
- Input: education_20.txt
- Assert result["domain_context"]["project_type"] == "education"

Test 4: test_insight_agent_returns_clusters
- Run insight agent on software_50.txt
- Assert len(result["insights"]) >= 3
- Assert all insights have theme_label, frequency, sentiment_score

Test 5: test_priority_agent_returns_sorted_list
- Run priority agent after insight agent
- Assert len(result["priorities"]) > 0
- Assert result["priorities"] == sorted(result["priorities"], key=lambda x: x["ice_score"], reverse=True)

Use a real DB session but isolated with a unique run_id per test.
```

---

### Prompt 32 — Antigravity
```
Write /backend/tests/test_api.py using pytest and httpx (async test client).

Test 1: test_health_endpoint
- GET /api/health → 200, body has status="ok"

Test 2: test_start_run_returns_run_id
- POST /api/run with software_50.txt text
- Assert 200, response has run_id (valid UUID format)

Test 3: test_get_result_after_run
- POST /api/run, wait 90 seconds (or poll every 5s until complete)
- GET /api/run/{run_id}/result
- Assert insights, priorities, spec_document, tasks are all non-empty

Test 4: test_get_runs_list
- GET /api/runs → 200, returns array

Test 5: test_run_not_found
- GET /api/run/00000000-0000-0000-0000-000000000000/result → 404

Add a pytest fixture that sets up and tears down the DB cleanly between tests.
```

---

### Prompt 33 — Antigravity
```
Create the project README.md at the root.

Structure:
# UAPA — Universal Autonomous PM Agent

## What it does
(2-3 sentences, use the PRD one-liner)

## Demo
(Screenshot placeholder + "73% of PM work automated · 90 seconds to roadmap")

## Quick Start (3 commands)
```bash
cp .env.example .env   # fill in your API keys
docker-compose up --build
open http://localhost:3000
```

## Tech Stack
(table: Layer / Technology / Why — same as TRD table)

## Architecture
(ASCII diagram showing: Input → FastAPI → LangGraph → 6 Agents → Qdrant/SQLite → SSE → Next.js)

## Agent Pipeline
(brief description of each of the 6 agents)

## API Reference
(table of the 5 endpoints)

## Environment Variables
(table of all 5 env vars with descriptions)

## Team
(placeholder: Name / Role)

Keep it scannable — use tables and short paragraphs. No fluff.
```

---

### Prompt 34 — Antigravity
```
Do a full clean-up pass on the backend:

1. Remove all print() statements — replace any debug logging with Python's logging module at DEBUG level.

2. Ensure all .env values have a sensible fallback check at startup — if ANTHROPIC_API_KEY is missing, raise a clear error on startup: "Missing required environment variable: ANTHROPIC_API_KEY"

3. In main.py add a startup event that:
   - Verifies Qdrant is reachable (GET http://qdrant:6333/healthz)
   - Creates DB tables if not exist
   - Logs "UAPA Backend ready" with the current version

4. Remove any TODO comments from production code paths (not tests).

5. Ensure no hardcoded localhost URLs — use environment variables:
   QDRANT_HOST (default: localhost)
   QDRANT_PORT (default: 6333)

6. Check all except: pass blocks — replace with except Exception as e: logger.error(f"...{e}") at minimum.
```

---

### Prompt 35 — Antigravity
```
Do a full clean-up pass on the frontend:

1. Remove all console.log() statements from production code (keep in dev-only utils if needed).

2. Add loading="lazy" to any images.

3. Ensure all interactive elements have accessible labels:
   - Buttons: clear text or aria-label
   - Icon-only buttons: aria-label always
   - Expandable sections: aria-expanded state

4. Add a <title> tag in layout.tsx: "UAPA — Universal Autonomous PM Agent"
   And meta description: "Autonomous PM agent that reads, thinks, prioritises, and executes."

5. Set the favicon to a simple purple square (create /public/favicon.svg with a #7C3AED filled square).

6. Ensure the Run button has type="button" (not type="submit") to prevent any accidental form submission.

7. Verify next.config.ts rewrites are pointing to the correct backend URL (http://backend:8000 in Docker, http://localhost:8000 in local dev — use NEXT_PUBLIC_API_URL env var).
```

---

### ✅ CHECKPOINT 7 (After Prompt 35)
**Run the full test suite:**

```bash
# Backend tests
cd backend
pip install pytest pytest-asyncio httpx
pytest tests/ -v

# Expected: all 10 tests passing
# Acceptable: test_get_result_after_run may take 60-90s
```

**Manual checks:**
```
1. docker-compose up --build — no errors, "UAPA Backend ready" in logs ✓
2. Start a run — no console.log noise in browser console ✓
3. Tab through the UI with keyboard — all interactive elements reachable ✓
4. Page title in browser tab shows "UAPA — Universal Autonomous PM Agent" ✓
5. README renders correctly on GitHub (push to repo and check) ✓
```

**All passing? Move to Prompt 36.**

---

## SPRINT 4 CONTINUED — DEMO POLISH
> Goal: The demo looks and runs exactly right. No surprises.

---

### Prompt 36 — Antigravity
```
Polish the input screen for demo impact.

1. Add two statistics below the header (hardcoded, always visible):
   "73% of PM work automated" and "90 sec vs 3 days to roadmap"
   Style: large bold numbers (#7C3AED), small muted labels below each

2. Add 3 example chips below the textarea:
   "Try: Software feedback" | "Try: Marketing campaign" | "Try: School curriculum"
   Clicking a chip loads the corresponding seed file content into the textarea
   (Fetch /data/seed/*.txt — you'll need a backend endpoint GET /api/demo/{dataset})

3. Animate the "Run Agent →" button on hover: subtle scale(1.02) transform

4. Add a brief flash animation when the domain card first appears:
   Fade in + slide up 8px over 300ms

5. The first AgentStepCard should appear within 2 seconds of clicking Run.
   If it hasn't appeared in 3 seconds, show "Connecting to agents..." in the left panel.
```

---

### Prompt 37 — Antigravity
```
Create a GET /api/demo/{dataset} endpoint in the backend.

Accepts dataset: Literal["software", "marketing", "education"]
Maps to the corresponding seed file in /data/seed/
Returns: {"text": string, "dataset": string, "item_count": int}

Also update the health endpoint to actually verify:
1. Qdrant responds at http://{QDRANT_HOST}:{QDRANT_PORT}/healthz
2. The Anthropic API key is valid (make a minimal test call — list models or similar)
3. Return: {"status": "ok", "qdrant": "ok" | "error", "llm": "ok" | "error", "linear": "ok" | "not_configured"}
   linear is "not_configured" if LINEAR_API_KEY is not set — this is not an error for the demo.
```

---

### Prompt 38 — Antigravity
```
Add commit history guidance — create /docs/COMMIT_GUIDE.md:

Conventional commit format:
feat: add insight agent clustering logic
fix: handle empty Qdrant collection on first run
chore: add pytest configuration
docs: update README with API reference
test: add domain inference tests

Rules for this project:
- Never squash commits
- Each sub-task = one commit
- All team members commit from their own accounts
- Target: 50+ commits by demo day

Also create a GitHub Actions workflow at .github/workflows/ci.yml:
- Triggers on push to main and all PRs
- Runs: cd backend && pip install -r requirements.txt && pytest tests/ -v
- Node.js build check: cd frontend && npm install && npm run build
- If either fails, block the PR merge

This gives judges a visible CI green checkmark.
```

---

### Prompt 39 — You
```
Demo rehearsal checklist — do this 3 times before presenting:

PREP (30 min before):
□ docker-compose up — all 3 services green
□ curl http://localhost:8000/api/health — all ok
□ Next.js loaded in Chrome at 120% font size (Cmd/Ctrl + twice)
□ Linear board open in separate tab — delete all test tickets, fresh board
□ software_50.txt and marketing_30.txt text ready to paste (open in text editor)
□ Cached run ID noted down for fallback
□ All notifications off (phone on silent too)
□ Display sleep disabled (System Preferences → Battery → Screen off: Never)

RUN 1 (Software dataset — target under 90 seconds):
□ Paste software_50.txt → click Run
□ Domain card shows "software" with >80% confidence
□ Left panel shows 10+ step cards
□ All 4 tabs unlock
□ Tasks tab shows 6-10 tickets with Linear links
□ Open one Linear link — ticket exists

RUN 2 (Marketing dataset — immediately after):
□ Click New Run
□ Paste marketing_30.txt → click Run
□ Domain switches to "marketing"
□ Spec tab shows Campaign Brief (not PRD)

TIME BOTH RUNS — note the seconds.
If either run is over 2 minutes, investigate which agent is slow.
```

---

### Prompt 40 — Antigravity
```
Create the demo slide deck content (for a single HTML slide, not a pptx).

Create /frontend/src/app/slide/page.tsx — a single fullscreen page for the demo opening.

Content:
- Background: #0F0F11
- Left half: Two massive numbers stacked:
  "22 hrs" in 96px #7C3AED bold
  "per week — PM processing tasks" in 18px muted below
  
  "90 sec" in 96px #059669 bold
  "with UAPA" in 18px muted below

- Right half: UAPA logo text large, and 4 bullet lines in small text:
  "· Multi-agent · 6 industries · Linear integration · Zero config"

- Bottom: "You describe the goal. It builds the roadmap." in 20px italic muted

- Press any key or click to go to http://localhost:3000 (window.location redirect)

This page lives at /slide — use it as the opening slide before the live demo.
```

---

### ✅ CHECKPOINT 8 (After Prompt 40)
**Final integration test — simulate the exact demo:**

```
1. Open http://localhost:3000/slide — opening slide renders fullscreen ✓
2. Press any key — redirects to main input screen ✓
3. Click "Try: Software feedback" chip — textarea fills with software data ✓
4. Click "Run Agent →" — pipeline starts ✓
5. Time from click to pipeline_complete: should be under 90 seconds ✓
6. All 4 output tabs have content ✓
7. At least one Linear ticket has a working URL ✓
8. Click "Try: Marketing campaign", click Run — domain switches correctly ✓
9. Time entire 2-run demo: under 3 minutes ✓
10. Open http://localhost:3000/runs — both runs appear in history ✓
```

**If step 5 is over 90 seconds:** the insight agent embedding loop is likely the bottleneck.
Batch the OpenAI embedding calls — one API call for all chunks instead of one per chunk.

**All 10 passing? You're demo-ready. Move to Prompt 41 for hardening.**

---

## SPRINT 4 FINAL — HARDENING
> Goal: Nothing breaks on demo day. Every failure has a fallback.

---

### Prompt 41 — Antigravity
```
Add retry logic to all Claude API calls.

Create /backend/agents/llm_client.py:

async def call_claude(system_prompt: str, user_message: str, max_tokens: int = 1000) -> str:
  - Retries up to 3 times with exponential backoff: 1s, 2s, 4s
  - On RateLimitError: wait and retry
  - On APIError: retry
  - After 3 failures: raise a PipelineError with a clear message
  - Returns the text content of the first content block

Replace all direct anthropic.messages.create() calls in the agents with call_claude().

Also add to call_claude:
- Log each retry attempt with attempt number and error type
- Log total tokens used per call (from response.usage)
```

---

### Prompt 42 — Antigravity
```
Add retry logic to the OpenAI embedding calls.

In insight_agent.py, wrap the embedding call:

async def embed_texts(texts: list[str]) -> list[list[float]]:
  - Call OpenAI embeddings.create() with model="text-embedding-3-small" and input=texts (batch)
  - Retry up to 3 times with exponential backoff
  - On failure after 3 retries: return zero vectors (list of 1536 zeros) for the failed batch
    Log a warning but do not crash the pipeline
  - Returns list of embedding vectors

Replace the per-chunk embedding loop with a single batched call to embed_texts().
This also speeds up the insight agent significantly.
```

---

### Prompt 43 — Antigravity
```
Pre-bake the demo fallback more robustly.

1. Create /scripts/prebake_demo.py:
   - Runs the full pipeline on software_50.txt
   - Saves result to /data/cache/software_demo.json
   - Prints the run_id to use as the cached demo ID

2. In /backend/api/routes.py add:
   GET /api/demo/cached
   Returns: {"run_id": string, "dataset": "software"} — reads from /data/cache/software_demo.json
   Returns 404 if not baked yet.

3. In the frontend, the "Load Demo" button (visible at ?demo=true):
   - First calls GET /api/demo/cached to get the cached run_id
   - Then calls loadCachedRun(run_id)
   - So the presenter never needs to know the run_id — one button click triggers the fallback

Run /scripts/prebake_demo.py now and commit the output JSON.
```

---

### Prompt 44 — Antigravity
```
Add performance optimisation for the insight agent.

Current bottleneck: sequential KMeans + Claude call per cluster.

Optimisations:
1. Embedding: already batched from Prompt 42. Confirm batch size doesn't exceed 2048 items.

2. KMeans: run silhouette scoring only for k=3,5,7 (not every integer 3-8).
   If fewer than 20 chunks, default to k=3 without silhouette check.

3. Claude calls per cluster: run them concurrently with asyncio.gather().
   Change: for cluster in clusters: await call_claude(...)
   To: results = await asyncio.gather(*[call_claude(...) for cluster in clusters])

4. Add a timeout: if the entire insight agent takes more than 30 seconds,
   return whatever clusters are complete with a warning flag in the step event.

Log the time taken for each sub-step in the insight agent to identify any remaining bottlenecks.
```

---

### Prompt 45 — Antigravity
```
Final pre-demo checklist automation.

Create /scripts/demo_check.sh:

#!/bin/bash
echo "=== UAPA Demo Check ==="

# 1. Services
echo -n "Qdrant: "
curl -s http://localhost:6333/healthz | grep -q "ok" && echo "✓" || echo "✗ FAIL"

echo -n "Backend: "
curl -s http://localhost:8000/api/health | grep -q '"status":"ok"' && echo "✓" || echo "✗ FAIL"

echo -n "Frontend: "
curl -s http://localhost:3000 | grep -q "UAPA" && echo "✓" || echo "✗ FAIL"

# 2. Cached demo
echo -n "Demo fallback: "
curl -s http://localhost:8000/api/demo/cached | grep -q "run_id" && echo "✓" || echo "✗ NOT BAKED"

# 3. Seed data
echo -n "Seed files: "
[ $(wc -l < data/seed/software_50.txt) -eq 50 ] && echo "✓" || echo "✗ FAIL"

# 4. Linear
echo -n "Linear API key set: "
[ -n "$LINEAR_API_KEY" ] && echo "✓" || echo "✗ NOT SET (fallback will be used)"

echo "=== Run this 30 minutes before demo ==="

Run chmod +x /scripts/demo_check.sh.
Document usage in README under "Demo Preparation".
```

---

### ✅ CHECKPOINT 9 (After Prompt 45)
**Run the demo check script:**

```bash
chmod +x scripts/demo_check.sh
./scripts/demo_check.sh
```

**Expected output:**
```
=== UAPA Demo Check ===
Qdrant: ✓
Backend: ✓
Frontend: ✓
Demo fallback: ✓
Seed files: ✓
Linear API key set: ✓ (or "NOT SET" if you're using fallback — that's fine)
=== Run this 30 minutes before demo ===
```

**Also verify performance:**
```bash
# Time a full software pipeline
time curl -X POST http://localhost:8000/api/run \
  -H "Content-Type: application/json" \
  -d '{"input_text": "'$(cat data/seed/software_50.txt | tr '\n' ' ')'", "input_source": "text"}'
# Then poll /result until complete and note total time
# Target: under 90 seconds
```

**All green? You're in excellent shape. Prompts 46-100 cover advanced features.**

---

## ADVANCED FEATURES (POST-CHECKPOINT)
> Prompts 46–100: Feedback loop, multi-domain, voice, auth, and production readiness.

---

### Prompt 46 — Antigravity
```
Implement the POST /api/feedback endpoint.

Request body:
{
  "run_id": string,
  "section": "insights" | "priorities" | "spec" | "tasks",
  "action": "approve" | "edit" | "regenerate",
  "edited_content": string | null,
  "regenerate_note": string | null
}

Behaviour:
- "approve": mark section as approved in pipeline_runs (add an approved_sections JSON column)
- "edit": if section="spec", update the spec_document stored in AgentState cache
- "regenerate": re-run just the specified agent with the note appended to its prompt,
  stream the new output via SSE to the same run_id stream

For regenerate, only re-run from the specified agent forward (not the full pipeline).
Return: {"status": "ok", "run_id": string}
```

---

### Prompt 47 — Antigravity
```
Add healthcare domain support.

1. Create /backend/prompts/writer_healthcare.txt — a Care Program Plan structure:
   - Care Objective, Patient Population, Intervention Protocol,
     Compliance Requirements, Staff Assignments, Review Schedule, Success Metrics

2. In domain_agent.py, expand the domain classification to include "healthcare".
   Update domain.txt prompt to include healthcare signals:
   vocabulary signals: patient, clinical, protocol, compliance, care, diagnosis, treatment

3. In priority_agent.py add the healthcare compliance multiplier:
   If domain == "healthcare" and any priority rationale mentions compliance:
   ice_score *= 1.5

4. In domain_contexts table spec_format, add "care_plan" as a valid value.

5. Create /data/seed/healthcare_20.txt — 20 realistic healthcare admin feedback items:
   Mix of: patient feedback, protocol gaps, compliance concerns, staff workload, resource requests.

6. Test: run healthcare_20.txt through the full pipeline, verify domain="healthcare" and spec shows Care Program Plan structure.
```

---

### Prompt 48 — Antigravity
```
Add legal/NGO domain support.

1. Create /backend/prompts/writer_legal.txt — a Project Plan & Stakeholder Brief structure:
   - Project Scope, Stakeholder Map, Milestones, Risk Register,
     Compliance/Legal Requirements, Communication Plan, Budget Overview

2. Update domain.txt prompt to include legal signals:
   vocabulary: grant, compliance, litigation, stakeholder, case, regulation, advocacy, donor

3. Create /data/seed/legal_20.txt — 20 items of NGO/legal project feedback.

4. Test: run legal_20.txt → domain="legal", spec shows Project Plan structure.
```

---

### Prompt 49 — Antigravity
```
Add operations domain support.

1. Create /backend/prompts/writer_ops.txt — a Sprint Plan & Vendor Task List structure:
   - Operations Objective, Vendor Summary, Sprint Breakdown,
     Supply Chain Actions, Risk Items, KPIs, Timeline

2. Update domain.txt prompt to include ops signals:
   vocabulary: vendor, supply chain, logistics, warehouse, procurement, SKU, inventory, SLA

3. Create /data/seed/ops_20.txt — 20 items of operations/supply chain feedback.

4. Update the frontend domain override dropdown to include Healthcare, Legal, Operations.

5. Test all 6 domains in sequence — verify correct spec_format for each:
   software→prd, marketing→campaign_brief, education→curriculum_plan,
   healthcare→care_plan, legal→case_plan, ops→general_spec
```

---

### Prompt 50 — Antigravity
```
Add file upload support to the input screen.

In /frontend/src/app/page.tsx:
1. Add a file drop zone below the textarea:
   Accepts: .txt, .pdf, .md, .csv
   Shows: "Drop files here or click to browse"
   On file select: reads content with FileReader and populates the textarea

2. For .pdf files: use pdf.js to extract text (install pdfjs-dist).
   Show a "Extracting text from PDF..." loading state while parsing.

3. For .csv files: parse with Papa Parse, convert rows to one feedback item per line.

4. Show the filename and line count after loading: "Loaded: feedback.csv (47 items)"

In /backend/api/routes.py:
5. Add POST /api/run/upload endpoint that accepts multipart form data with a file field.
   Reads the file text server-side as a fallback.
   Returns same RunResponse as POST /api/run.
```

---

### ✅ CHECKPOINT 10 (After Prompt 50)
**You now have a complete, production-quality UAPA.**

**Final verification:**
```
□ All 6 domains work end-to-end with correct spec formats
□ File upload works for .txt and .csv
□ Feedback (approve/edit/regenerate) works for spec section
□ Full test suite passes: pytest tests/ -v (all green)
□ demo_check.sh runs clean
□ README is complete and accurate
□ docker-compose up --build starts cleanly from a fresh clone
□ Commit count is 50+ with meaningful messages from multiple contributors
□ Linear board shows real tickets from test runs
```

**Prompts 51–100 available on request — they cover:**
- 51-55: Voice input (Whisper API)
- 56-60: WhatsApp webhook integration
- 61-65: Multi-user team mode + auth
- 66-70: Persistent memory across sessions
- 71-75: Jira integration (alongside Linear)
- 76-80: Notion export integration
- 81-85: Analytics dashboard (token usage, run times, domain distribution)
- 86-90: Rate limiting + API key auth for production
- 91-95: PostgreSQL migration from SQLite
- 96-100: Production deployment (Railway/Render + Vercel)

---

*UAPA Build Prompts v1.0 — FAR AWAY 2026*
