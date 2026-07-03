from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional

class DeviceBase(BaseModel):
    name: str
    ip_address: str
    snmp_version: str = "2c"
    snmp_community: Optional[str] = None
    snmp_user: Optional[str] = None

class DeviceCreate(DeviceBase):
    pass

class DeviceUpdate(DeviceBase):
    pass

class DeviceResponse(DeviceBase):
    id: UUID
    status: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
