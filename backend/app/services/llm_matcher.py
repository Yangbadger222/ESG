"""
LLM-Powered Supplier Matching Service

Uses LLM to parse natural language procurement requirements
into structured tags, then matches against supplier database.
"""
import json
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.supplier import Supplier, Certification

settings = get_settings()

SYSTEM_PROMPT = """You are an ESG supply chain expert. Given a procurement requirement,
extract structured tags in JSON format:
{
  "materials": ["cotton", "polyester"],
  "certifications": ["GOTS", "OEKO-TEX"],
  "countries": ["China", "Vietnam"],
  "capacity_min": 10000,
  "categories": ["fabric", "dyeing"],
  "sustainability_priority": "high"
}
Only include fields that are mentioned or implied. Return valid JSON only."""


async def parse_requirements(requirement_text: str) -> dict:
    """Parse natural language requirements into structured tags using LLM."""
    try:
        from langchain_openai import ChatOpenAI

        llm = ChatOpenAI(
            model=settings.OPENAI_MODEL,
            api_key=settings.OPENAI_API_KEY,
            temperature=0,
        )
        response = await llm.ainvoke([
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": requirement_text},
        ])
        return json.loads(response.content)
    except Exception:
        return _fallback_parse(requirement_text)


def _fallback_parse(text: str) -> dict:
    """Simple keyword-based fallback when LLM is unavailable."""
    text_lower = text.lower()
    tags = {"materials": [], "certifications": [], "countries": [], "categories": []}

    material_keywords = {
        "cotton": "cotton", "polyester": "polyester", "silk": "silk",
        "wool": "wool", "linen": "linen", "nylon": "nylon",
        "棉": "cotton", "涤纶": "polyester", "丝绸": "silk",
    }
    for kw, mat in material_keywords.items():
        if kw in text_lower:
            tags["materials"].append(mat)

    cert_keywords = ["gots", "oeko-tex", "bluesign", "grs", "bsci", "iso 14001"]
    for cert in cert_keywords:
        if cert in text_lower:
            tags["certifications"].append(cert.upper())

    country_keywords = {
        "china": "China", "中国": "China", "vietnam": "Vietnam", "越南": "Vietnam",
        "india": "India", "印度": "India", "bangladesh": "Bangladesh",
        "turkey": "Turkey", "italy": "Italy",
    }
    for kw, country in country_keywords.items():
        if kw in text_lower:
            tags["countries"].append(country)

    return tags


def match_suppliers(db: Session, tags: dict, organization_id: int, limit: int = 10) -> list[dict]:
    """Match suppliers based on structured tags extracted from requirements."""
    query = db.query(Supplier).filter(Supplier.organization_id == organization_id)

    if tags.get("countries"):
        query = query.filter(Supplier.country.in_(tags["countries"]))

    if tags.get("categories"):
        query = query.filter(Supplier.category.in_(tags["categories"]))

    candidates = query.all()

    scored = []
    for supplier in candidates:
        score = _score_supplier(supplier, tags, db)
        scored.append({
            "supplier_id": supplier.id,
            "name": supplier.name,
            "country": supplier.country,
            "category": supplier.category,
            "tier": supplier.tier.value if hasattr(supplier.tier, "value") else supplier.tier,
            "risk_level": supplier.risk_level.value if hasattr(supplier.risk_level, "value") else supplier.risk_level,
            "match_score": score,
            "certifications": [c.name for c in supplier.certifications],
        })

    scored.sort(key=lambda x: x["match_score"], reverse=True)
    return scored[:limit]


def _score_supplier(supplier: Supplier, tags: dict, db: Session) -> float:
    score = 50.0

    if tags.get("certifications"):
        supplier_certs = {c.name.upper() for c in supplier.certifications}
        required_certs = {c.upper() for c in tags["certifications"]}
        matched = supplier_certs & required_certs
        if required_certs:
            score += 30 * (len(matched) / len(required_certs))

    from app.models.supplier import ESGRecord
    latest_esg = (
        db.query(ESGRecord)
        .filter(ESGRecord.supplier_id == supplier.id)
        .order_by(ESGRecord.reporting_year.desc())
        .first()
    )
    if latest_esg:
        if latest_esg.renewable_energy_pct and latest_esg.renewable_energy_pct > 50:
            score += 10
        if latest_esg.safety_incidents is not None and latest_esg.safety_incidents == 0:
            score += 5
        if latest_esg.carbon_emissions and latest_esg.carbon_emissions < 5000:
            score += 5

    return min(round(score, 1), 100.0)
