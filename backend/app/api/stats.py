from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func
from sqlalchemy.future import select
from pydantic import BaseModel
from app.core.database import get_db
from app.models.device import Device
from app.models.interface import Interface
from app.models.alert import Alert
from app.api.deps import get_current_user

router = APIRouter(dependencies=[Depends(get_current_user)])

class StatsResponse(BaseModel):
    total_devices: int
    total_interfaces: int
    monitored_interfaces: int
    active_alerts: int

@router.get("", response_model=StatsResponse)
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    devices_count = await db.scalar(select(func.count()).select_from(Device))
    interfaces_count = await db.scalar(select(func.count()).select_from(Interface))
    monitored_count = await db.scalar(select(func.count()).select_from(Interface).where(Interface.is_monitored == True))
    alerts_count = await db.scalar(select(func.count()).select_from(Alert).where(Alert.is_resolved == False))
    
    return StatsResponse(
        total_devices=devices_count or 0,
        total_interfaces=interfaces_count or 0,
        monitored_interfaces=monitored_count or 0,
        active_alerts=alerts_count or 0
    )
