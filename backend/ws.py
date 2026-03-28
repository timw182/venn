from typing import Dict, Set
from fastapi import WebSocket
import asyncio
import logging

logger = logging.getLogger("venn.ws")

class ConnectionManager:
    def __init__(self):
        # couple_id -> set of active WebSocket connections
        self.rooms: Dict[int, Set[WebSocket]] = {}
        self._cleanup_task = None

    async def connect(self, websocket: WebSocket, couple_id: int):
        await websocket.accept()
        self.rooms.setdefault(couple_id, set()).add(websocket)
        # Start cleanup loop on first connection
        if self._cleanup_task is None or self._cleanup_task.done():
            self._cleanup_task = asyncio.ensure_future(self._periodic_cleanup())

    def disconnect(self, websocket: WebSocket, couple_id: int):
        if couple_id in self.rooms:
            self.rooms[couple_id].discard(websocket)
            if not self.rooms[couple_id]:
                del self.rooms[couple_id]

    async def broadcast(self, couple_id: int, message: dict):
        if couple_id not in self.rooms:
            return
        dead = set()
        for ws in list(self.rooms[couple_id]):
            try:
                await ws.send_json(message)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self.rooms[couple_id].discard(ws)
        if couple_id in self.rooms and not self.rooms[couple_id]:
            del self.rooms[couple_id]

    async def _periodic_cleanup(self):
        """Remove stale/dead connections every 60 seconds."""
        while True:
            await asyncio.sleep(60)
            try:
                for couple_id in list(self.rooms):
                    dead = set()
                    for ws in list(self.rooms.get(couple_id, set())):
                        try:
                            # Check if the connection is still alive
                            if ws.client_state.name != "CONNECTED":
                                dead.add(ws)
                        except Exception:
                            dead.add(ws)
                    for ws in dead:
                        self.rooms[couple_id].discard(ws)
                    if couple_id in self.rooms and not self.rooms[couple_id]:
                        del self.rooms[couple_id]
            except Exception as e:
                logger.warning("WS cleanup error: %s", e)

manager = ConnectionManager()
