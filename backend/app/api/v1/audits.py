from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.audit import AuditTask, AuditItem, AuditStatus, ComplianceStandard
from app.models.supplier import Supplier
from app.schemas.audit import AuditTaskCreate, AuditTaskOut, AuditTaskBrief
from app.services.audit_engine import run_compliance_check

router = APIRouter()


@router.get("/", response_model=list[AuditTaskBrief])
def list_audits(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(AuditTask)
        .filter(AuditTask.organization_id == current_user.organization_id)
        .order_by(AuditTask.created_at.desc())
        .all()
    )


@router.post("/", response_model=AuditTaskOut, status_code=201)
def create_audit(
    payload: AuditTaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = AuditTask(
        title=payload.title,
        description=payload.description,
        status=AuditStatus.DRAFT,
        organization_id=current_user.organization_id,
        created_by=current_user.id,
    )
    db.add(task)
    db.flush()

    standards = db.query(ComplianceStandard).filter(ComplianceStandard.code.in_(payload.standard_codes)).all()
    if not standards:
        raise HTTPException(status_code=400, detail="No valid compliance standards found")

    suppliers = (
        db.query(Supplier)
        .filter(Supplier.id.in_(payload.supplier_ids), Supplier.organization_id == current_user.organization_id)
        .all()
    )
    if not suppliers:
        raise HTTPException(status_code=400, detail="No valid suppliers found")

    for supplier in suppliers:
        for standard in standards:
            item = AuditItem(
                audit_task_id=task.id,
                supplier_id=supplier.id,
                standard_id=standard.id,
            )
            db.add(item)

    db.commit()
    db.refresh(task)
    return task


@router.post("/{audit_id}/run", response_model=AuditTaskOut)
def run_audit(
    audit_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(AuditTask).filter(
        AuditTask.id == audit_id, AuditTask.organization_id == current_user.organization_id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Audit task not found")

    run_compliance_check(db, task)
    db.refresh(task)
    return task


@router.get("/{audit_id}", response_model=AuditTaskOut)
def get_audit(
    audit_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(AuditTask).filter(
        AuditTask.id == audit_id, AuditTask.organization_id == current_user.organization_id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Audit task not found")
    return task
