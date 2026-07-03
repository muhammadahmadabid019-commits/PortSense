import uuid
from sqlalchemy import Column, String, Boolean, BigInteger, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
from sqlalchemy.orm import relationship

class Interface(Base):
    __tablename__ = "interfaces"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    device_id = Column(UUID(as_uuid=True), ForeignKey("devices.id", ondelete="CASCADE"))
    if_index = Column(Integer, nullable=False)
    if_name = Column(String, nullable=True)
    if_alias = Column(String, nullable=True)
    if_speed = Column(BigInteger, nullable=True)
    is_monitored = Column(Boolean, default=False)
    
    device = relationship("Device", back_populates="interfaces")
