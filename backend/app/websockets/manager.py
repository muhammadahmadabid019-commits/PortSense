import asyncio
import json
import redis.asyncio as redis
from fastapi import WebSocket
from typing import Dict, List
from app.core.config import settings

class ConnectionManager:
    def __init__(self):
        # interface_id -> list of websockets
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.redis_client = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=0)
        self.pubsub = self.redis_client.pubsub()
        self._listener_task = None

    async def connect(self, websocket: WebSocket, interface_id: str):
        await websocket.accept()
        if interface_id not in self.active_connections:
            self.active_connections[interface_id] = []
            await self.pubsub.subscribe(f"metrics:{interface_id}")
            
            if not self._listener_task or self._listener_task.done():
                self._listener_task = asyncio.create_task(self.listen_to_redis())
                
        self.active_connections[interface_id].append(websocket)

    def disconnect(self, websocket: WebSocket, interface_id: str):
        if interface_id in self.active_connections:
            if websocket in self.active_connections[interface_id]:
                self.active_connections[interface_id].remove(websocket)
            if not self.active_connections[interface_id]:
                del self.active_connections[interface_id]
                asyncio.create_task(self.pubsub.unsubscribe(f"metrics:{interface_id}"))

    async def listen_to_redis(self):
        while True:
            try:
                message = await self.pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                if message and message['type'] == 'message':
                    channel = message['channel'].decode('utf-8')
                    data = message['data'].decode('utf-8')
                    
                    interface_id = channel.split(':')[1]
                    if interface_id in self.active_connections:
                        dead_sockets = []
                        for connection in self.active_connections[interface_id]:
                            try:
                                await connection.send_text(data)
                            except Exception:
                                dead_sockets.append(connection)
                        
                        for dead in dead_sockets:
                            self.disconnect(dead, interface_id)
            except Exception as e:
                print(f"Redis listen error: {e}")
                await asyncio.sleep(1)

manager = ConnectionManager()
