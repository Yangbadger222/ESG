"""
Supply Chain Transparency Service

Provides deep supply chain analysis with multi-tier penetration,
geographic mapping, and risk propagation.
"""
from sqlalchemy.orm import Session, joinedload
from app.models.supplier import Supplier


def get_full_supply_chain(db: Session, organization_id: int) -> list[dict]:
    """Get all top-level suppliers and their full sub-supplier trees."""
    root_suppliers = (
        db.query(Supplier)
        .options(joinedload(Supplier.certifications))
        .filter(
            Supplier.organization_id == organization_id,
            Supplier.parent_supplier_id.is_(None),
        )
        .all()
    )

    return [_build_node(db, s) for s in root_suppliers]


def _build_node(db: Session, supplier: Supplier) -> dict:
    children = (
        db.query(Supplier)
        .options(joinedload(Supplier.certifications))
        .filter(Supplier.parent_supplier_id == supplier.id)
        .all()
    )

    return {
        "id": supplier.id,
        "name": supplier.name,
        "tier": supplier.tier.value if hasattr(supplier.tier, "value") else supplier.tier,
        "category": supplier.category,
        "country": supplier.country,
        "city": supplier.city,
        "latitude": supplier.latitude,
        "longitude": supplier.longitude,
        "risk_level": supplier.risk_level.value if hasattr(supplier.risk_level, "value") else supplier.risk_level,
        "certifications": [c.name for c in supplier.certifications],
        "children": [_build_node(db, child) for child in children],
    }


def get_supply_chain_stats(db: Session, organization_id: int) -> dict:
    """Get aggregate stats for the organization's supply chain."""
    all_suppliers = db.query(Supplier).filter(Supplier.organization_id == organization_id).all()

    tier_counts = {}
    country_counts = {}
    risk_counts = {}

    for s in all_suppliers:
        tier_val = s.tier.value if hasattr(s.tier, "value") else s.tier
        risk_val = s.risk_level.value if hasattr(s.risk_level, "value") else s.risk_level
        tier_counts[tier_val] = tier_counts.get(tier_val, 0) + 1
        if s.country:
            country_counts[s.country] = country_counts.get(s.country, 0) + 1
        risk_counts[risk_val] = risk_counts.get(risk_val, 0) + 1

    return {
        "total_suppliers": len(all_suppliers),
        "by_tier": tier_counts,
        "by_country": country_counts,
        "by_risk_level": risk_counts,
    }
