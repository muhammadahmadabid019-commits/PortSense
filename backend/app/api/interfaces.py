from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from uuid import UUID
from app.core.database import get_db
from app.models.interface import Interface
from app.schemas.interface import InterfaceUpdate, InterfaceResponse
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(dependencies=[Depends(get_current_user)])

@router.put("/{interface_id}", response_model=InterfaceResponse)
async def update_interface(interface_id: UUID, iface_update: InterfaceUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Interface).where(Interface.id == interface_id))
    interface = result.scalars().first()
    if not interface:
        raise HTTPException(status_code=404, detail="Interface not found")
        
    interface.is_monitored = iface_update.is_monitored
    await db.commit()
    await db.refresh(interface)
    return interface

@router.get("/device/{device_id}", response_model=List[InterfaceResponse])
async def get_device_interfaces(device_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Interface).where(Interface.device_id == device_id).order_by(Interface.if_index))
    return result.scalars().all()
