from sqlalchemy import Column, DateTime, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

class MetricTS(Base):
    __tablename__ = "metrics_ts"
    
    time = Column(DateTime(timezone=True), primary_key=True, nullable=False)
    interface_id = Column(UUID(as_uuid=True), ForeignKey("interfaces.id", ondelete="CASCADE"), primary_key=True, nullable=False)
    in_bps = Column(Float, nullable=False, default=0.0)
    out_bps = Column(Float, nullable=False, default=0.0)
