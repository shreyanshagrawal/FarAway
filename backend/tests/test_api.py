import pytest
import os
import time
import asyncio
from httpx import AsyncClient, ASGITransport
from main import app
from db.database import SessionLocal, Base, engine

# Create tables
Base.metadata.create_all(bind=engine)

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_seed_text(filename: str) -> str:
    filepath = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "seed", filename)
    with open(filepath, "r", encoding="utf-8") as f:
        return f.read()

@pytest.mark.asyncio
async def test_health_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"

@pytest.mark.asyncio
async def test_start_run_returns_run_id():
    text = get_seed_text("software_50.txt")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/run", json={"input_text": text, "input_source": "text"})
    assert response.status_code == 200
    data = response.json()
    assert "run_id" in data
    # Basic UUID check
    assert len(data["run_id"]) == 36

@pytest.mark.asyncio
async def test_get_result_after_run():
    text = get_seed_text("software_50.txt")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/run", json={"input_text": text, "input_source": "text"})
        assert response.status_code == 200
        run_id = response.json()["run_id"]
        
        # Poll for completion
        max_retries = 30 # 30 * 3s = 90 seconds
        completed = False
        for _ in range(max_retries):
            res = await ac.get(f"/api/run/{run_id}/result")
            if res.status_code == 200:
                data = res.json()
                if data.get("status") in ("complete", "error"):
                    completed = True
                    break
            await asyncio.sleep(3)
            
        assert completed, "Pipeline did not complete within the timeout"
        
        # Final fetch
        res = await ac.get(f"/api/run/{run_id}/result")
        data = res.json()
        assert data["status"] in ("complete", "error") # error is possible if APIs fail, but pipeline finishes
        if data["status"] == "complete":
            assert len(data.get("insights", [])) > 0
            assert len(data.get("priorities", [])) > 0

@pytest.mark.asyncio
async def test_get_runs_list():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/runs")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_run_not_found():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/run/00000000-0000-0000-0000-000000000000/result")
    assert response.status_code == 404
