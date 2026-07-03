from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.websockets.manager import manager

router = APIRouter()

@router.websocket("/metrics/{interface_id}")
async def websocket_endpoint(websocket: WebSocket, interface_id: str):
    await manager.connect(websocket, interface_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, interface_id)
