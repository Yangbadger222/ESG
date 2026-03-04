from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.services.llm_matcher import parse_requirements, match_suppliers, _fallback_parse

router = APIRouter()


class MatchRequest(BaseModel):
    requirement: str


@router.post("/")
async def ai_match(
    payload: MatchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not payload.requirement.strip():
        return []

    try:
        tags = await parse_requirements(payload.requirement)
    except Exception:
        tags = _fallback_parse(payload.requirement)

    return match_suppliers(db, tags, current_user.organization_id)
