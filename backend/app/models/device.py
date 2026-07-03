import uuid
from sqlalchemy import Column, String, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
from datetime import datetime, timezone
from sqlalchemy.orm import relationship

class Device(Base):
    __tablename__ = "devices"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, index=True, nullable=False)
    ip_address = Column(String, unique=True, index=True, nullable=False)
    snmp_version = Column(String, default="2c")
    snmp_community = Column(String, nullable=True)
    snmp_user = Column(String, nullable=True)
    status = Column(String, default="unknown")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    interfaces = relationship("Interface", back_populates="device", cascade="all, delete-orphan")
