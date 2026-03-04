from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.audit import AuditTask, AuditReport
from app.schemas.audit import ReportOut
from app.services.report_generator import generate_csrd_report

router = APIRouter()


@router.post("/{audit_id}/generate", response_model=ReportOut, status_code=201)
def generate_report(
    audit_id: int,
    report_type: str = "csrd",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(AuditTask).filter(
        AuditTask.id == audit_id, AuditTask.organization_id == current_user.organization_id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Audit task not found")

    report = generate_csrd_report(db, task)
    return report


@router.get("/{report_id}/download")
def download_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = (
        db.query(AuditReport)
        .join(AuditTask)
        .filter(AuditReport.id == report_id, AuditTask.organization_id == current_user.organization_id)
        .first()
    )
    if not report or not report.file_path:
        raise HTTPException(status_code=404, detail="Report not found")

    return FileResponse(
        path=report.file_path,
        filename=f"esg_report_{report.audit_task_id}.pdf",
        media_type="application/pdf",
    )


@router.get("/", response_model=list[ReportOut])
def list_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(AuditReport)
        .join(AuditTask)
        .filter(AuditTask.organization_id == current_user.organization_id)
        .order_by(AuditReport.generated_at.desc())
        .all()
    )
