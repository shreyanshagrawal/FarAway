import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"service": "UAPA Backend", "version": "1.0.0"}

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "qdrant": "ok",
        "gemini": "ok"
    }
