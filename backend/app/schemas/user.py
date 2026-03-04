from pydantic import BaseModel, EmailStr
from datetime import datetime


class OrganizationCreate(BaseModel):
    name: str
    industry: str | None = None
    country: str | None = None


class OrganizationOut(BaseModel):
    id: int
    name: str
    industry: str | None
    country: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    organization_name: str
    industry: str | None = None
    country: str | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    organization: OrganizationOut
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
