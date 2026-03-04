"""
Compliance Alert Service

Scans suppliers for potential compliance risks:
- Missing or expired certifications
- High-risk ESG indicators
- Absence of key green certifications (GOTS, OEKO-TEX, Bluesign, etc.)
"""
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.supplier import Supplier, ESGRecord, Certification, RiskLevel
from app.models.compliance import ComplianceAlert, AlertSeverity

GREEN_CERTIFICATIONS = ["GOTS", "OEKO-TEX", "Bluesign", "GRS", "BSCI", "SA8000", "ISO 14001"]

RISK_THRESHOLDS = {
    "carbon_emissions": {"critical": 20000, "warning": 10000},
    "safety_incidents": {"critical": 5, "warning": 2},
    "waste_generated": {"critical": 10000, "warning": 5000},
}


def scan_compliance_alerts(db: Session, organization_id: int) -> int:
    suppliers = db.query(Supplier).filter(Supplier.organization_id == organization_id).all()
    new_alerts = 0

    for supplier in suppliers:
        alerts_to_create = []

        cert_names = {c.name.upper() for c in supplier.certifications}
        has_green_cert = any(gc.upper() in cert_names for gc in GREEN_CERTIFICATIONS)

        if not has_green_cert:
            alerts_to_create.append({
                "alert_type": "missing_green_certification",
                "severity": AlertSeverity.WARNING,
                "title": f"No green certification found for {supplier.name}",
                "description": f"Supplier lacks internationally recognized green certifications ({', '.join(GREEN_CERTIFICATIONS[:3])}...).",
            })

        now = datetime.now(timezone.utc)
        for cert in supplier.certifications:
            if cert.expiry_date and cert.expiry_date < now:
                alerts_to_create.append({
                    "alert_type": "expired_certification",
                    "severity": AlertSeverity.CRITICAL,
                    "title": f"Expired certification: {cert.name}",
                    "description": f"Certification '{cert.name}' for {supplier.name} expired on {cert.expiry_date.strftime('%Y-%m-%d')}.",
                })

        latest_esg = (
            db.query(ESGRecord)
            .filter(ESGRecord.supplier_id == supplier.id)
            .order_by(ESGRecord.reporting_year.desc())
            .first()
        )

        if not latest_esg:
            alerts_to_create.append({
                "alert_type": "no_esg_data",
                "severity": AlertSeverity.WARNING,
                "title": f"No ESG data for {supplier.name}",
                "description": "Supplier has not submitted any ESG records.",
            })
        else:
            for field, thresholds in RISK_THRESHOLDS.items():
                value = getattr(latest_esg, field, None)
                if value is None:
                    continue
                if value >= thresholds["critical"]:
                    alerts_to_create.append({
                        "alert_type": f"high_{field}",
                        "severity": AlertSeverity.CRITICAL,
                        "title": f"Critical {field.replace('_', ' ')} level",
                        "description": f"{supplier.name}: {field} = {value} (critical threshold: {thresholds['critical']})",
                    })
                elif value >= thresholds["warning"]:
                    alerts_to_create.append({
                        "alert_type": f"elevated_{field}",
                        "severity": AlertSeverity.WARNING,
                        "title": f"Elevated {field.replace('_', ' ')} level",
                        "description": f"{supplier.name}: {field} = {value} (warning threshold: {thresholds['warning']})",
                    })

        for alert_data in alerts_to_create:
            existing = db.query(ComplianceAlert).filter(
                ComplianceAlert.supplier_id == supplier.id,
                ComplianceAlert.organization_id == organization_id,
                ComplianceAlert.alert_type == alert_data["alert_type"],
                ComplianceAlert.is_resolved == "false",
            ).first()

            if not existing:
                alert = ComplianceAlert(
                    supplier_id=supplier.id,
                    organization_id=organization_id,
                    **alert_data,
                )
                db.add(alert)
                new_alerts += 1

        new_risk = _compute_risk_level(supplier, latest_esg, has_green_cert)
        if supplier.risk_level != new_risk:
            supplier.risk_level = new_risk

    db.commit()
    return new_alerts


def _compute_risk_level(supplier: Supplier, esg: ESGRecord | None, has_green_cert: bool) -> RiskLevel:
    if not esg:
        return RiskLevel.HIGH

    risk_points = 0
    if esg.carbon_emissions and esg.carbon_emissions > 10000:
        risk_points += 2
    if esg.safety_incidents and esg.safety_incidents > 2:
        risk_points += 2
    if not has_green_cert:
        risk_points += 1
    if esg.renewable_energy_pct and esg.renewable_energy_pct < 10:
        risk_points += 1

    if risk_points >= 5:
        return RiskLevel.CRITICAL
    elif risk_points >= 3:
        return RiskLevel.HIGH
    elif risk_points >= 1:
        return RiskLevel.MEDIUM
    return RiskLevel.LOW
