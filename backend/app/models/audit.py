from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON, Enum as SAEnum
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base


class AuditStatus(str, enum.Enum):
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class ComplianceStatus(str, enum.Enum):
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    PARTIAL = "partial"
    PENDING = "pending"


class ComplianceStandard(Base):
    __tablename__ = "compliance_standards"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    version = Column(String(50))
    category = Column(String(100))
    rules_schema = Column(JSON)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    audit_items = relationship("AuditItem", back_populates="standard")


class AuditTask(Base):
    __tablename__ = "audit_tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(SAEnum(AuditStatus), default=AuditStatus.DRAFT)
    overall_score = Column(Float)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)

    organization = relationship("Organization", back_populates="audit_tasks")
    creator = relationship("User")
    audit_items = relationship("AuditItem", back_populates="audit_task", cascade="all, delete-orphan")
    reports = relationship("AuditReport", back_populates="audit_task", cascade="all, delete-orphan")


class AuditItem(Base):
    __tablename__ = "audit_items"

    id = Column(Integer, primary_key=True, index=True)
    audit_task_id = Column(Integer, ForeignKey("audit_tasks.id"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    standard_id = Column(Integer, ForeignKey("compliance_standards.id"), nullable=False)

    compliance_status = Column(SAEnum(ComplianceStatus), default=ComplianceStatus.PENDING)
    score = Column(Float)
    findings = Column(JSON)
    recommendations = Column(Text)
    checked_at = Column(DateTime, nullable=True)

    audit_task = relationship("AuditTask", back_populates="audit_items")
    supplier = relationship("Supplier")
    standard = relationship("ComplianceStandard", back_populates="audit_items")


class AuditReport(Base):
    __tablename__ = "audit_reports"

    id = Column(Integer, primary_key=True, index=True)
    audit_task_id = Column(Integer, ForeignKey("audit_tasks.id"), nullable=False)
    report_type = Column(String(50), nullable=False)
    file_path = Column(String(500))
    file_size = Column(Integer)
    generated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    status = Column(String(50), default="generating")

    audit_task = relationship("AuditTask", back_populates="reports")
