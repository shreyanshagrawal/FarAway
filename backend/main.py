import os
import logging
from contextlib import asynccontextmanager
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.database import engine, Base
from db import models
from api import routes

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

if not os.environ.get("GEMINI_API_KEY"):
    raise RuntimeError("Missing required environment variable: GEMINI_API_KEY")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    qdrant_host = os.environ.get("QDRANT_HOST", "localhost")
    qdrant_port = os.environ.get("QDRANT_PORT", "6333")
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(f"http://{qdrant_host}:{qdrant_port}/healthz", timeout=3.0)
            if res.status_code == 200:
                logger.info("Qdrant is reachable.")
            else:
                logger.warning(f"Qdrant health check returned {res.status_code}")
    except Exception as e:
        logger.warning(f"Could not reach Qdrant at startup: {e}")
        
    logger.info("UAPA Backend ready (v1.0.0)")
    yield
    # Shutdown
    pass

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes.router)

@app.get("/")
def read_root():
    return {"service": "UAPA Backend", "version": "1.0.0"}
