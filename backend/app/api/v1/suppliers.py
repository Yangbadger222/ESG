from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session, joinedload
import csv
import io

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.supplier import Supplier, ESGRecord, Certification
from app.schemas.supplier import (
    SupplierCreate, SupplierUpdate, SupplierOut, SupplierBrief,
    ESGRecordCreate, ESGRecordOut, CertificationCreate, CertificationOut,
    SupplyChainNode,
)

router = APIRouter()


@router.get("/", response_model=list[SupplierBrief])
def list_suppliers(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    tier: str | None = None,
    risk_level: str | None = None,
    country: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Supplier).filter(Supplier.organization_id == current_user.organization_id)
    if tier:
        q = q.filter(Supplier.tier == tier)
    if risk_level:
        q = q.filter(Supplier.risk_level == risk_level)
    if country:
        q = q.filter(Supplier.country == country)
    return q.offset(skip).limit(limit).all()


@router.post("/", response_model=SupplierOut, status_code=201)
def create_supplier(
    payload: SupplierCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    supplier = Supplier(**payload.model_dump(), organization_id=current_user.organization_id)
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier


@router.get("/{supplier_id}", response_model=SupplierOut)
def get_supplier(
    supplier_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    supplier = (
        db.query(Supplier)
        .options(joinedload(Supplier.certifications), joinedload(Supplier.esg_records))
        .filter(Supplier.id == supplier_id, Supplier.organization_id == current_user.organization_id)
        .first()
    )
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier


@router.put("/{supplier_id}", response_model=SupplierOut)
def update_supplier(
    supplier_id: int,
    payload: SupplierUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id, Supplier.organization_id == current_user.organization_id
    ).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(supplier, field, value)
    db.commit()
    db.refresh(supplier)
    return supplier


@router.delete("/{supplier_id}", status_code=204)
def delete_supplier(
    supplier_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id, Supplier.organization_id == current_user.organization_id
    ).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    db.delete(supplier)
    db.commit()


@router.post("/import-csv", response_model=dict)
async def import_suppliers_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    content = await file.read()
    decoded = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(decoded))
    created = 0
    for row in reader:
        supplier = Supplier(
            name=row.get("name", ""),
            tier=row.get("tier", "tier_1"),
            category=row.get("category"),
            country=row.get("country"),
            city=row.get("city"),
            address=row.get("address"),
            contact_email=row.get("contact_email"),
            organization_id=current_user.organization_id,
        )
        db.add(supplier)
        created += 1
    db.commit()
    return {"imported": created}


# --- ESG Records ---

@router.post("/{supplier_id}/esg-records", response_model=ESGRecordOut, status_code=201)
def add_esg_record(
    supplier_id: int,
    payload: ESGRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id, Supplier.organization_id == current_user.organization_id
    ).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    record = ESGRecord(supplier_id=supplier_id, **payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


# --- Certifications ---

@router.post("/{supplier_id}/certifications", response_model=CertificationOut, status_code=201)
def add_certification(
    supplier_id: int,
    payload: CertificationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id, Supplier.organization_id == current_user.organization_id
    ).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    cert = Certification(supplier_id=supplier_id, **payload.model_dump())
    db.add(cert)
    db.commit()
    db.refresh(cert)
    return cert


# --- Supply Chain Graph ---

def _build_supply_chain_tree(db: Session, supplier: Supplier) -> SupplyChainNode:
    children = db.query(Supplier).filter(Supplier.parent_supplier_id == supplier.id).all()
    cert_names = [c.name for c in supplier.certifications]
    return SupplyChainNode(
        id=supplier.id,
        name=supplier.name,
        tier=supplier.tier.value if hasattr(supplier.tier, "value") else supplier.tier,
        country=supplier.country,
        city=supplier.city,
        latitude=supplier.latitude,
        longitude=supplier.longitude,
        risk_level=supplier.risk_level.value if hasattr(supplier.risk_level, "value") else supplier.risk_level,
        certifications=cert_names,
        children=[_build_supply_chain_tree(db, child) for child in children],
    )


@router.get("/{supplier_id}/supply-chain", response_model=SupplyChainNode)
def get_supply_chain(
    supplier_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    supplier = (
        db.query(Supplier)
        .options(joinedload(Supplier.certifications))
        .filter(Supplier.id == supplier_id, Supplier.organization_id == current_user.organization_id)
        .first()
    )
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return _build_supply_chain_tree(db, supplier)
