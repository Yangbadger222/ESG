from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base


class SupplierTier(str, enum.Enum):
    TIER_1 = "tier_1"
    TIER_2 = "tier_2"
    TIER_3 = "tier_3"
    RAW_MATERIAL = "raw_material"


class RiskLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    tier = Column(SAEnum(SupplierTier), default=SupplierTier.TIER_1)
    category = Column(String(100))
    country = Column(String(100))
    city = Column(String(100))
    address = Column(Text)
    latitude = Column(Float)
    longitude = Column(Float)
    contact_email = Column(String(255))
    contact_phone = Column(String(50))
    description = Column(Text)
    risk_level = Column(SAEnum(RiskLevel), default=RiskLevel.LOW)

    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    parent_supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    organization = relationship("Organization", back_populates="suppliers")
    parent_supplier = relationship("Supplier", remote_side=[id], backref="sub_suppliers")
    esg_records = relationship("ESGRecord", back_populates="supplier", cascade="all, delete-orphan")
    certifications = relationship("Certification", back_populates="supplier", cascade="all, delete-orphan")


class ESGRecord(Base):
    __tablename__ = "esg_records"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)

    # Environmental
    carbon_emissions = Column(Float)
    water_usage = Column(Float)
    waste_generated = Column(Float)
    energy_consumption = Column(Float)
    renewable_energy_pct = Column(Float)

    # Social
    worker_count = Column(Integer)
    female_worker_pct = Column(Float)
    safety_incidents = Column(Integer)
    avg_wage_ratio = Column(Float)
    child_labor_policy = Column(String(50))

    # Governance
    has_esg_committee = Column(String(10))
    transparency_score = Column(Float)
    anti_corruption_policy = Column(String(50))

    reporting_year = Column(Integer, nullable=False)
    data_source = Column(String(100))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    supplier = relationship("Supplier", back_populates="esg_records")


class Certification(Base):
    __tablename__ = "certifications"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    name = Column(String(100), nullable=False)
    issuing_body = Column(String(255))
    certificate_number = Column(String(100))
    issued_date = Column(DateTime)
    expiry_date = Column(DateTime)
    status = Column(String(50), default="active")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    supplier = relationship("Supplier", back_populates="certifications")
