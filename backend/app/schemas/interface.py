from pydantic import BaseModel, ConfigDict
from uuid import UUID
from typing import Optional

class InterfaceBase(BaseModel):
    if_index: int
    if_name: Optional[str] = None
    if_alias: Optional[str] = None
    if_speed: Optional[int] = None
    is_monitored: bool = False

class InterfaceUpdate(BaseModel):
    is_monitored: bool

class InterfaceResponse(InterfaceBase):
    id: UUID
    device_id: UUID
    
    model_config = ConfigDict(from_attributes=True)
