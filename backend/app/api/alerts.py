from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel
from app.core.database import get_db
from app.models.alert import Alert
from app.api.deps import get_current_user

router = APIRouter(dependencies=[Depends(get_current_user)])

class AlertResponse(BaseModel):
    id: UUID
    message: str
    severity: str
    created_at: datetime
    is_resolved: bool
    device_id: Optional[UUID] = None

    class Config:
        from_attributes = True

@router.get("", response_model=List[AlertResponse])
async def get_active_alerts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Alert).where(Alert.is_resolved == False).order_by(Alert.created_at.desc()))
    return result.scalars().all()

@router.post("/{alert_id}/resolve", response_model=AlertResponse)
async def resolve_alert(alert_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalars().first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    setattr(alert, 'is_resolved', True)
    await db.commit()
    await db.refresh(alert)
    return alert
