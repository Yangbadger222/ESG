from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum as SAEnum
import enum
from sqlalchemy.orm import relationship
from app.core.database import Base


class AlertSeverity(str, enum.Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class ComplianceAlert(Base):
    __tablename__ = "compliance_alerts"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    standard_id = Column(Integer, ForeignKey("compliance_standards.id"), nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)

    alert_type = Column(String(100), nullable=False)
    severity = Column(SAEnum(AlertSeverity), default=AlertSeverity.WARNING)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    is_resolved = Column(String(10), default="false")
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    supplier = relationship("Supplier")
    standard = relationship("ComplianceStandard")
