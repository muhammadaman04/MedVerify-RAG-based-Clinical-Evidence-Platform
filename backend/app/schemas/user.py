# Pydantic schemas for user/admin endpoints
from pydantic import BaseModel, EmailStr


class InviteRequest(BaseModel):
    email: EmailStr
    role: str = "clinician"  # 'clinician' or 'admin'


class InviteResponse(BaseModel):
    message: str
    user_id: str
    email: str
    invite_link: str


class UpdateUserRequest(BaseModel):
    role: str | None = None
    status: str | None = None


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str
    status: str
    created_at: str
    last_active_at: str | None = None
