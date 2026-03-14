from typing import Dict, Set
from fastapi import WebSocket
import asyncio

class ConnectionManager:
    def __init__(self):
        # couple_id -> set of active WebSocket connections
        self.rooms: Dict[int, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, couple_id: int):
        await websocket.accept()
        self.rooms.setdefault(couple_id, set()).add(websocket)

    def disconnect(self, websocket: WebSocket, couple_id: int):
        if couple_id in self.rooms:
            self.rooms[couple_id].discard(websocket)

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

manager = ConnectionManager()
