import asyncio

active_streams: dict[str, asyncio.Queue] = {}

def get_or_create_queue(run_id: str) -> asyncio.Queue:
    if run_id not in active_streams:
        active_streams[run_id] = asyncio.Queue()
    return active_streams[run_id]

def publish_event(run_id: str, event: dict):
    if run_id in active_streams:
        active_streams[run_id].put_nowait(event)
