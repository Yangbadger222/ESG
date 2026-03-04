from pydantic import BaseModel
from datetime import datetime


class SupplierCreate(BaseModel):
    name: str
    tier: str = "tier_1"
    category: str | None = None
    country: str | None = None
    city: str | None = None
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    description: str | None = None
    parent_supplier_id: int | None = None


class SupplierUpdate(BaseModel):
    name: str | None = None
    tier: str | None = None
    category: str | None = None
    country: str | None = None
    city: str | None = None
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    description: str | None = None
    risk_level: str | None = None
    parent_supplier_id: int | None = None


class CertificationOut(BaseModel):
    id: int
    name: str
    issuing_body: str | None
    certificate_number: str | None
    issued_date: datetime | None
    expiry_date: datetime | None
    status: str

    model_config = {"from_attributes": True}


class ESGRecordOut(BaseModel):
    id: int
    carbon_emissions: float | None
    water_usage: float | None
    waste_generated: float | None
    energy_consumption: float | None
    renewable_energy_pct: float | None
    worker_count: int | None
    female_worker_pct: float | None
    safety_incidents: int | None
    reporting_year: int
    data_source: str | None

    model_config = {"from_attributes": True}


class SupplierOut(BaseModel):
    id: int
    name: str
    tier: str
    category: str | None
    country: str | None
    city: str | None
    address: str | None
    latitude: float | None
    longitude: float | None
    contact_email: str | None
    risk_level: str
    parent_supplier_id: int | None
    certifications: list[CertificationOut] = []
    esg_records: list[ESGRecordOut] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class SupplierBrief(BaseModel):
    id: int
    name: str
    tier: str
    category: str | None
    country: str | None
    city: str | None
    risk_level: str
    parent_supplier_id: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ESGRecordCreate(BaseModel):
    carbon_emissions: float | None = None
    water_usage: float | None = None
    waste_generated: float | None = None
    energy_consumption: float | None = None
    renewable_energy_pct: float | None = None
    worker_count: int | None = None
    female_worker_pct: float | None = None
    safety_incidents: int | None = None
    avg_wage_ratio: float | None = None
    child_labor_policy: str | None = None
    has_esg_committee: str | None = None
    transparency_score: float | None = None
    anti_corruption_policy: str | None = None
    reporting_year: int
    data_source: str | None = None


class CertificationCreate(BaseModel):
    name: str
    issuing_body: str | None = None
    certificate_number: str | None = None
    issued_date: datetime | None = None
    expiry_date: datetime | None = None


class SupplyChainNode(BaseModel):
    id: int
    name: str
    tier: str
    country: str | None
    city: str | None
    latitude: float | None
    longitude: float | None
    risk_level: str
    certifications: list[str] = []
    children: list["SupplyChainNode"] = []

    model_config = {"from_attributes": True}
