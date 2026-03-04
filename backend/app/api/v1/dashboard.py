from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.supplier import Supplier
from app.models.audit import AuditTask, AuditStatus
from app.models.compliance import ComplianceAlert
from app.services.supply_chain import get_full_supply_chain, get_supply_chain_stats

router = APIRouter()


@router.get("/stats")
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org_id = current_user.organization_id

    total_suppliers = db.query(Supplier).filter(Supplier.organization_id == org_id).count()

    active_audits = (
        db.query(AuditTask)
        .filter(
            AuditTask.organization_id == org_id,
            AuditTask.status.in_([AuditStatus.DRAFT, AuditStatus.IN_PROGRESS]),
        )
        .count()
    )

    critical_alerts = (
        db.query(ComplianceAlert)
        .filter(
            ComplianceAlert.organization_id == org_id,
            ComplianceAlert.severity == "critical",
            ComplianceAlert.is_resolved == "false",
        )
        .count()
    )

    completed_audits = (
        db.query(AuditTask)
        .filter(
            AuditTask.organization_id == org_id,
            AuditTask.status == AuditStatus.COMPLETED,
            AuditTask.overall_score.isnot(None),
        )
        .all()
    )
    avg_score = 0.0
    if completed_audits:
        avg_score = round(sum(a.overall_score for a in completed_audits) / len(completed_audits), 1)

    chain_stats = get_supply_chain_stats(db, org_id)

    recent_alerts = (
        db.query(ComplianceAlert)
        .filter(ComplianceAlert.organization_id == org_id)
        .order_by(ComplianceAlert.created_at.desc())
        .limit(10)
        .all()
    )

    return {
        "totalSuppliers": total_suppliers,
        "activeAudits": active_audits,
        "criticalAlerts": critical_alerts,
        "avgComplianceScore": avg_score,
        "riskDistribution": chain_stats.get("by_risk_level", {}),
        "recentAlerts": [
            {
                "id": a.id,
                "title": a.title,
                "severity": a.severity.value if hasattr(a.severity, "value") else a.severity,
                "created_at": a.created_at.isoformat() if a.created_at else "",
            }
            for a in recent_alerts
        ],
    }


@router.get("/supply-chain")
def get_full_chain(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_full_supply_chain(db, current_user.organization_id)
