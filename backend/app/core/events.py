"""Pub/sub event bus for real-time job progress over WebSocket."""

import asyncio
from collections import defaultdict
from typing import Any


class EventBus:
    def __init__(self) -> None:
        self._subscribers: dict[str, list[asyncio.Queue]] = defaultdict(list)
        self._history: dict[str, list[dict[str, Any]]] = defaultdict(list)

    def subscribe(self, channel: str) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue()
        self._subscribers[channel].append(q)
        for event in self._history[channel]:
            q.put_nowait(event)
        return q

    def unsubscribe(self, channel: str, q: asyncio.Queue) -> None:
        if q in self._subscribers[channel]:
            self._subscribers[channel].remove(q)

    async def publish(self, channel: str, event: dict[str, Any]) -> None:
        self._history[channel].append(event)
        if len(self._history[channel]) > 200:
            self._history[channel] = self._history[channel][-200:]
        for q in list(self._subscribers[channel]):
            await q.put(event)


bus = EventBus()
