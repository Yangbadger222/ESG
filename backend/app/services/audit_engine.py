"""
ESG Compliance Audit Engine

Evaluates suppliers against compliance standards (CSRD, CBAM, etc.)
using configurable rule schemas stored in ComplianceStandard.rules_schema.
"""
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.audit import AuditTask, AuditItem, AuditStatus, ComplianceStatus
from app.models.supplier import Supplier, ESGRecord

CSRD_RULES = {
    "environmental": {
        "carbon_emissions": {"max": 10000, "weight": 0.3},
        "renewable_energy_pct": {"min": 20, "weight": 0.2},
        "waste_generated": {"max": 5000, "weight": 0.15},
        "water_usage": {"max": 50000, "weight": 0.15},
    },
    "social": {
        "safety_incidents": {"max": 2, "weight": 0.1},
        "child_labor_policy": {"required": "yes", "weight": 0.05},
    },
    "governance": {
        "has_esg_committee": {"required": "yes", "weight": 0.05},
    },
}

CBAM_RULES = {
    "environmental": {
        "carbon_emissions": {"max": 8000, "weight": 0.6},
        "energy_consumption": {"max": 100000, "weight": 0.2},
    },
    "governance": {
        "transparency_score": {"min": 60, "weight": 0.2},
    },
}

BUILTIN_RULES = {
    "CSRD": CSRD_RULES,
    "CBAM": CBAM_RULES,
}


def _evaluate_supplier(esg_record: ESGRecord | None, rules: dict) -> tuple[float, dict, str]:
    if not esg_record:
        return 0.0, {"error": "No ESG data available"}, ComplianceStatus.NON_COMPLIANT

    total_score = 0.0
    total_weight = 0.0
    findings = {}

    for dimension, checks in rules.items():
        dim_findings = []
        for field, rule in checks.items():
            value = getattr(esg_record, field, None)
            weight = rule.get("weight", 0.1)
            total_weight += weight

            if value is None:
                dim_findings.append({"field": field, "status": "missing", "detail": "Data not provided"})
                continue

            passed = True
            if "max" in rule and value > rule["max"]:
                passed = False
                dim_findings.append({
                    "field": field, "status": "fail",
                    "detail": f"Value {value} exceeds max {rule['max']}",
                })
            elif "min" in rule and value < rule["min"]:
                passed = False
                dim_findings.append({
                    "field": field, "status": "fail",
                    "detail": f"Value {value} below min {rule['min']}",
                })
            elif "required" in rule and str(value).lower() != rule["required"]:
                passed = False
                dim_findings.append({
                    "field": field, "status": "fail",
                    "detail": f"Expected '{rule['required']}', got '{value}'",
                })

            if passed:
                total_score += weight
                dim_findings.append({"field": field, "status": "pass"})

        findings[dimension] = dim_findings

    score = (total_score / total_weight * 100) if total_weight > 0 else 0.0

    if score >= 80:
        status = ComplianceStatus.COMPLIANT
    elif score >= 50:
        status = ComplianceStatus.PARTIAL
    else:
        status = ComplianceStatus.NON_COMPLIANT

    return round(score, 2), findings, status


def run_compliance_check(db: Session, task: AuditTask):
    task.status = AuditStatus.IN_PROGRESS
    scores = []

    for item in task.audit_items:
        supplier = db.query(Supplier).filter(Supplier.id == item.supplier_id).first()
        standard = item.standard

        rules = BUILTIN_RULES.get(standard.code, standard.rules_schema or {})

        latest_record = (
            db.query(ESGRecord)
            .filter(ESGRecord.supplier_id == supplier.id)
            .order_by(ESGRecord.reporting_year.desc())
            .first()
        )

        score, findings, status = _evaluate_supplier(latest_record, rules)

        item.score = score
        item.findings = findings
        item.compliance_status = status
        item.checked_at = datetime.now(timezone.utc)

        recommendations = []
        for dim, dim_findings in findings.items():
            for f in dim_findings:
                if f["status"] == "fail":
                    recommendations.append(f"[{dim}] {f['field']}: {f['detail']}")
                elif f["status"] == "missing":
                    recommendations.append(f"[{dim}] {f['field']}: Please provide data")

        item.recommendations = "\n".join(recommendations) if recommendations else None
        scores.append(score)

    task.overall_score = round(sum(scores) / len(scores), 2) if scores else 0.0
    task.status = AuditStatus.COMPLETED
    task.completed_at = datetime.now(timezone.utc)
    db.commit()
