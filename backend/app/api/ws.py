"""WebSocket endpoint for real-time progress / live updates."""

import asyncio
import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.events import bus


router = APIRouter()


@router.websocket("/ws/videos/{video_id}")
async def video_socket(ws: WebSocket, video_id: str) -> None:
    await ws.accept()
    channel = f"video:{video_id}"
    q = bus.subscribe(channel)
    try:
        # initial hello
        await ws.send_text(json.dumps({"type": "hello", "video_id": video_id}))
        while True:
            event = await q.get()
            await ws.send_text(json.dumps(event, default=str))
    except WebSocketDisconnect:
        pass
    except asyncio.CancelledError:
        pass
    finally:
        bus.unsubscribe(channel, q)
