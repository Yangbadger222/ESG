from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.compliance import ComplianceAlert
from app.schemas.audit import ComplianceAlertOut
from app.services.compliance_alert import scan_compliance_alerts

router = APIRouter()


@router.get("/", response_model=list[ComplianceAlertOut])
def list_alerts(
    severity: str | None = None,
    is_resolved: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(ComplianceAlert).filter(ComplianceAlert.organization_id == current_user.organization_id)
    if severity:
        q = q.filter(ComplianceAlert.severity == severity)
    if is_resolved:
        q = q.filter(ComplianceAlert.is_resolved == is_resolved)
    return q.order_by(ComplianceAlert.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/scan", response_model=dict)
def trigger_scan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    count = scan_compliance_alerts(db, current_user.organization_id)
    return {"new_alerts": count}


@router.put("/{alert_id}/resolve", response_model=ComplianceAlertOut)
def resolve_alert(
    alert_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from datetime import datetime, timezone

    alert = db.query(ComplianceAlert).filter(
        ComplianceAlert.id == alert_id,
        ComplianceAlert.organization_id == current_user.organization_id,
    ).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_resolved = "true"
    alert.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(alert)
    return alert
