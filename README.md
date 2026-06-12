# UAPA — Universal Autonomous PM Agent

## What it does
The Universal Autonomous PM Agent (UAPA) transforms raw, unstructured user feedback or project briefs into a structured, prioritized product roadmap in under 90 seconds. It autonomously clusters insights, scores initiatives using the ICE framework, drafts a full specification document, and generates actionable Linear tickets.

## Demo
![App Screenshot Placeholder](./frontend/public/favicon.svg)
*73% of PM work automated · 90 seconds to roadmap*

## Quick Start
```bash
cp .env.example .env   # fill in your API keys
docker-compose up --build
open http://localhost:3000
```

## Tech Stack
| Layer | Technology | Why |
|-------|------------|-----|
| **Frontend** | Next.js 14, TailwindCSS | Fast, reactive UI with responsive layouts and streaming SSE support. |
| **Backend API** | FastAPI | High performance asynchronous python backend suitable for Server-Sent Events. |
| **Orchestration** | LangGraph | State-machine based routing for multi-agent workflows. |
| **LLM** | Gemini Flash | Highly cost-effective and low latency generative model. |
| **Vector DB** | Qdrant | Fast, local dense vector similarity search for clustering feedback. |
| **Database** | SQLite & SQLAlchemy | Lightweight relational persistence for storing run histories and state. |

## Architecture

```text
       Input Text
           │
           ▼
      [ FastAPI ]
           │
           ▼
     [ LangGraph ] ───────┐
           │              │
           ▼              │
    ┌─ 6 AGENTS ─┐        ▼
    │  Domain    │    [ Qdrant ]
    │  Insight   │    [ SQLite ]
    │  Priority  │        │
    │  Writer    │        │
    │  Task      │        │
    └────────────┘        │
           │              │
           ▼              ▼
       [ SSE ] ◄──── State Updates
           │
           ▼
      [ Next.js ]
      (Frontend)
```

## Agent Pipeline
1. **Orchestrator Agent**: Manages the LangGraph state machine, routes data between agents, and emits Server-Sent Events to the frontend.
2. **Domain Agent**: Analyzes the raw input to determine the project context (Software, Marketing, etc.) and sets the appropriate scoring weights.
3. **Insight Agent**: Chunks the input text, generates dense vector embeddings, and uses KMeans clustering to group raw feedback into coherent themes.
4. **Priority Agent**: Scores each cluster based on Impact, Effort, and Confidence (ICE) using the inferred domain weights, returning a sorted priority list.
5. **Writer Agent**: Consumes the insights and priorities to draft a comprehensive, formatted specification document (e.g., PRD, Campaign Brief).
6. **Task Agent**: Decomposes the final specification into granular tickets and optionally pushes them to Linear.

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/run` | `POST` | Initializes a new pipeline run with the provided input text. |
| `/api/run/{id}/stream` | `GET` | Streams Server-Sent Events (SSE) for real-time UI updates. |
| `/api/run/{id}/result` | `GET` | Fetches the final, aggregated result data for a specific run. |
| `/api/runs` | `GET` | Retrieves a historical list of all past runs. |
| `/api/health` | `GET` | System health check (validates LLM, Qdrant, and Linear API states). |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Your Google GenAI API key used for all LLM calls. |
| `LINEAR_API_KEY` | Optional API token for pushing generated tasks to Linear. |
| `LINEAR_TEAM_ID` | Optional Linear Team UUID to assign tasks to. |
| `LINEAR_PROJECT_ID` | Optional Linear Project UUID for grouping created tickets. |
| `QDRANT_HOST` | Hostname for the Qdrant vector DB container (defaults to `qdrant`). |

## Team
- **Your Name** / Lead Developer & PM
