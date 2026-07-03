from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from uuid import UUID
from app.core.database import get_db
from app.models.device import Device
from app.models.interface import Interface
from app.schemas.interface import InterfaceResponse
from app.services.snmp import discover_interfaces
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.device import DeviceCreate, DeviceUpdate, DeviceResponse

router = APIRouter(dependencies=[Depends(get_current_user)])

@router.get("", response_model=List[DeviceResponse])
async def read_devices(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Device).offset(skip).limit(limit))
    return result.scalars().all()

@router.post("", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
async def create_device(device_in: DeviceCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Device).where(Device.ip_address == device_in.ip_address))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Device with this IP already exists")
        
    db_device = Device(**device_in.model_dump())
    db.add(db_device)
    await db.commit()
    await db.refresh(db_device)
    
    from app.workers.polling import discover_device_interfaces
    discover_device_interfaces.delay(str(db_device.id))
    return db_device

@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_device(device_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Device).where(Device.id == device_id))
    device = result.scalars().first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
        
    await db.delete(device)
    await db.commit()
    return None

@router.post("/{device_id}/discover", response_model=List[InterfaceResponse])
async def trigger_discovery(device_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Device).where(Device.id == device_id))
    device = result.scalars().first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
        
    discovered_interfaces = await discover_interfaces(device, db)
    if not discovered_interfaces:
        raise HTTPException(status_code=400, detail="Failed to discover interfaces via SNMP")
        
    existing_interfaces_result = await db.execute(select(Interface).where(Interface.device_id == device_id))
    existing_interfaces = existing_interfaces_result.scalars().all()
    existing_map = {iface.if_index: iface for iface in existing_interfaces}
    
    updated_interfaces = []
    for new_iface in discovered_interfaces:
        if new_iface.if_index in existing_map:
            db_iface = existing_map[new_iface.if_index]
            db_iface.if_name = new_iface.if_name
            db_iface.if_alias = new_iface.if_alias
            db_iface.if_speed = new_iface.if_speed
            updated_interfaces.append(db_iface)
        else:
            db.add(new_iface)
            updated_interfaces.append(new_iface)
            
    await db.commit()
    return updated_interfaces
