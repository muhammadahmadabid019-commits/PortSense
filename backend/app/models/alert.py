from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, timezone
from app.core.database import Base
from sqlalchemy.orm import relationship

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message = Column(String, nullable=False)
    severity = Column(String, nullable=False) # "critical", "warning", "info"
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    is_resolved = Column(Boolean, default=False)
    
    device_id = Column(UUID(as_uuid=True), ForeignKey("devices.id", ondelete="CASCADE"), nullable=True)
    device = relationship("Device")
