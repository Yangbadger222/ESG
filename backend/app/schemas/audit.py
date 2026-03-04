from pydantic import BaseModel
from datetime import datetime


class AuditTaskCreate(BaseModel):
    title: str
    description: str | None = None
    supplier_ids: list[int]
    standard_codes: list[str]


class AuditItemOut(BaseModel):
    id: int
    supplier_id: int
    standard_id: int
    compliance_status: str
    score: float | None
    findings: dict | None
    recommendations: str | None
    checked_at: datetime | None

    model_config = {"from_attributes": True}


class AuditTaskOut(BaseModel):
    id: int
    title: str
    description: str | None
    status: str
    overall_score: float | None
    created_by: int
    audit_items: list[AuditItemOut] = []
    created_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}


class AuditTaskBrief(BaseModel):
    id: int
    title: str
    status: str
    overall_score: float | None
    created_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}


class ReportOut(BaseModel):
    id: int
    audit_task_id: int
    report_type: str
    file_path: str | None
    file_size: int | None
    generated_at: datetime
    status: str

    model_config = {"from_attributes": True}


class ComplianceAlertOut(BaseModel):
    id: int
    supplier_id: int
    alert_type: str
    severity: str
    title: str
    description: str | None
    is_resolved: str
    created_at: datetime

    model_config = {"from_attributes": True}
