"""
Seed script: populates the database with demo data for development.

Usage:
    cd backend
    python -m app.seed
"""
from app.core.database import engine, SessionLocal, Base
from app.models.user import Organization, User
from app.models.supplier import Supplier, ESGRecord, Certification, SupplierTier, RiskLevel
from app.models.audit import ComplianceStandard
from app.models.compliance import ComplianceAlert  # noqa: F401
from app.core.security import get_password_hash
from datetime import datetime, timezone, timedelta


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    if db.query(ComplianceStandard).first():
        print("Database already seeded. Skipping.")
        db.close()
        return

    # Compliance Standards
    csrd = ComplianceStandard(
        code="CSRD",
        name="Corporate Sustainability Reporting Directive",
        description="EU directive requiring companies to report on environmental and social impact.",
        version="2024",
        category="environmental,social,governance",
        rules_schema=None,
    )
    cbam = ComplianceStandard(
        code="CBAM",
        name="Carbon Border Adjustment Mechanism",
        description="EU mechanism to put a fair price on carbon emitted during production of carbon-intensive goods.",
        version="2026",
        category="environmental",
        rules_schema=None,
    )
    db.add_all([csrd, cbam])
    db.flush()

    # Demo Organization + User
    org = Organization(name="GlobalFashion Inc.", industry="Apparel & Textiles", country="Germany")
    db.add(org)
    db.flush()

    admin = User(
        email="demo@esgplatform.com",
        hashed_password=get_password_hash("demo123456"),
        full_name="Demo Admin",
        role="admin",
        organization_id=org.id,
    )
    db.add(admin)
    db.flush()

    # Suppliers - multi-tier supply chain
    s1 = Supplier(name="TextileCo Shanghai", tier=SupplierTier.TIER_1, category="fabric",
                  country="China", city="Shanghai", latitude=31.2304, longitude=121.4737,
                  contact_email="info@textileco.cn", risk_level=RiskLevel.LOW, organization_id=org.id)
    s2 = Supplier(name="DyeWorks Vietnam", tier=SupplierTier.TIER_2, category="dyeing",
                  country="Vietnam", city="Ho Chi Minh City", latitude=10.8231, longitude=106.6297,
                  contact_email="contact@dyeworks.vn", risk_level=RiskLevel.HIGH, organization_id=org.id)
    s3 = Supplier(name="SpinTech Bangladesh", tier=SupplierTier.TIER_2, category="spinning",
                  country="Bangladesh", city="Dhaka", latitude=23.8103, longitude=90.4125,
                  contact_email="info@spintech.bd", risk_level=RiskLevel.MEDIUM, organization_id=org.id)
    s4 = Supplier(name="FabricMill India", tier=SupplierTier.TIER_1, category="fabric",
                  country="India", city="Mumbai", latitude=19.0760, longitude=72.8777,
                  contact_email="sales@fabricmill.in", risk_level=RiskLevel.MEDIUM, organization_id=org.id)
    s5 = Supplier(name="EcoFiber Turkey", tier=SupplierTier.TIER_3, category="raw_material",
                  country="Turkey", city="Istanbul", latitude=41.0082, longitude=28.9784,
                  contact_email="eco@ecofiber.tr", risk_level=RiskLevel.LOW, organization_id=org.id)
    s6 = Supplier(name="ChemDye Jiangsu", tier=SupplierTier.TIER_2, category="dyeing",
                  country="China", city="Suzhou", latitude=31.2990, longitude=120.5853,
                  contact_email="info@chemdye.cn", risk_level=RiskLevel.CRITICAL, organization_id=org.id)

    db.add_all([s1, s2, s3, s4, s5, s6])
    db.flush()

    # Supply chain relationships
    s2.parent_supplier_id = s1.id
    s3.parent_supplier_id = s1.id
    s5.parent_supplier_id = s2.id
    s6.parent_supplier_id = s4.id

    # ESG Records
    esg_data = [
        (s1.id, {"carbon_emissions": 5000, "water_usage": 20000, "waste_generated": 2000,
                  "energy_consumption": 50000, "renewable_energy_pct": 40, "worker_count": 500,
                  "female_worker_pct": 55, "safety_incidents": 0, "has_esg_committee": "yes",
                  "transparency_score": 85, "child_labor_policy": "yes", "reporting_year": 2025}),
        (s2.id, {"carbon_emissions": 18000, "water_usage": 80000, "waste_generated": 8000,
                  "energy_consumption": 120000, "renewable_energy_pct": 5, "worker_count": 200,
                  "female_worker_pct": 40, "safety_incidents": 4, "has_esg_committee": "no",
                  "transparency_score": 30, "child_labor_policy": "no", "reporting_year": 2025}),
        (s3.id, {"carbon_emissions": 9000, "water_usage": 35000, "waste_generated": 4000,
                  "energy_consumption": 70000, "renewable_energy_pct": 15, "worker_count": 350,
                  "female_worker_pct": 65, "safety_incidents": 3, "has_esg_committee": "yes",
                  "transparency_score": 55, "child_labor_policy": "yes", "reporting_year": 2025}),
        (s5.id, {"carbon_emissions": 3000, "water_usage": 10000, "waste_generated": 1000,
                  "energy_consumption": 25000, "renewable_energy_pct": 60, "worker_count": 100,
                  "female_worker_pct": 50, "safety_incidents": 0, "has_esg_committee": "yes",
                  "transparency_score": 90, "child_labor_policy": "yes", "reporting_year": 2025}),
        (s6.id, {"carbon_emissions": 25000, "water_usage": 100000, "waste_generated": 12000,
                  "energy_consumption": 150000, "renewable_energy_pct": 2, "worker_count": 150,
                  "female_worker_pct": 30, "safety_incidents": 6, "has_esg_committee": "no",
                  "transparency_score": 20, "child_labor_policy": "no", "reporting_year": 2025}),
    ]
    for supplier_id, data in esg_data:
        record = ESGRecord(supplier_id=supplier_id, **data)
        db.add(record)

    # Certifications
    now = datetime.now(timezone.utc)
    certs = [
        (s1.id, "GOTS", "Global Organic Textile Standard", now - timedelta(days=365), now + timedelta(days=365)),
        (s1.id, "ISO 14001", "ISO", now - timedelta(days=200), now + timedelta(days=500)),
        (s3.id, "BSCI", "amfori", now - timedelta(days=300), now + timedelta(days=65)),
        (s4.id, "OEKO-TEX", "OEKO-TEX Association", now - timedelta(days=180), now + timedelta(days=185)),
        (s5.id, "GRS", "Textile Exchange", now - timedelta(days=100), now + timedelta(days=265)),
        (s5.id, "GOTS", "Global Organic Textile Standard", now - timedelta(days=50), now + timedelta(days=315)),
    ]
    for sid, name, issuer, issued, expiry in certs:
        db.add(Certification(supplier_id=sid, name=name, issuing_body=issuer,
                             issued_date=issued, expiry_date=expiry, status="active"))

    db.commit()
    db.close()
    print("Database seeded successfully!")
    print("Demo login: demo@esgplatform.com / demo123456")


if __name__ == "__main__":
    seed()
