import re
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel, EmailStr, field_validator

from app.core.database import get_supabase
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


# ---------------------------------------------------------------------------
# Request / response schemas
# ---------------------------------------------------------------------------

class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be empty")
        return v

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# ---------------------------------------------------------------------------
# POST /auth/signup  — Admin self-registration
# ---------------------------------------------------------------------------

@router.post("/signup", response_model=AuthResponse, status_code=201)
async def signup(body: SignupRequest, response: Response):
    """
    Public endpoint. Creates an admin account.
    Role is hardcoded to 'admin' — callers cannot set it.
    Returns a JWT immediately (sign-up-and-go pattern).
    """
    db = get_supabase()

    # Check for existing email — return a generic message to avoid email enumeration
    existing = (
        db.table("users")
        .select("id")
        .eq("email", body.email.lower())
        .execute()
    )
    if existing.data:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists."
        )

    # Hash password and create user
    password_hash = hash_password(body.password)
    insert_result = (
        db.table("users")
        .insert({
            "email": body.email.lower(),
            "name": body.name.strip(),
            "role": "admin",       # Hardcoded — never from request body
            "status": "active",
            "password_hash": password_hash,
            "invited_by": None,
        })
        .execute()
    )

    if not insert_result.data:
        raise HTTPException(status_code=500, detail="Failed to create account. Please try again.")

    user = insert_result.data[0]

    # Issue JWT
    token = create_access_token({
        "sub": user["id"],
        "email": user["email"],
        "role": user["role"],
        "name": user["name"],
    })

    # Refresh token in httpOnly cookie (short-lived stub — full refresh flow in Phase 1.6)
    refresh_token = create_access_token(
        {"sub": user["id"], "type": "refresh"},
        expires_delta=timedelta(days=30)
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,   # Set to True in production (HTTPS only)
        samesite="lax",
        max_age=60 * 60 * 24 * 30,
    )

    return AuthResponse(
        access_token=token,
        user={
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
        },
    )


# ---------------------------------------------------------------------------
# POST /auth/login  — Universal login for admins and clinicians
# ---------------------------------------------------------------------------

@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest, response: Response):
    """
    Public endpoint. Authenticates any active user.
    Rejects if password_hash is NULL or status != 'active'.
    """
    db = get_supabase()

    result = (
        db.table("users")
        .select("id, email, name, role, status, password_hash")
        .eq("email", body.email.lower())
        .execute()
    )

    # Generic error — do not reveal whether the email exists
    GENERIC_ERROR = HTTPException(
        status_code=401,
        detail="Incorrect email or password."
    )

    if not result.data:
        raise GENERIC_ERROR

    user = result.data[0]

    # Guard: account not yet activated (invite not accepted) or deactivated
    if user["status"] != "active":
        raise GENERIC_ERROR

    # Guard: password not set (invite sent but not yet accepted)
    if not user["password_hash"]:
        raise GENERIC_ERROR

    # Verify password
    if not verify_password(body.password, user["password_hash"]):
        raise GENERIC_ERROR

    # Update last_active_at
    db.table("users").update(
        {"last_active_at": datetime.now(timezone.utc).isoformat()}
    ).eq("id", user["id"]).execute()

    # Issue access token
    token = create_access_token({
        "sub": user["id"],
        "email": user["email"],
        "role": user["role"],
        "name": user["name"],
    })

    # Refresh token in httpOnly cookie
    refresh_token = create_access_token(
        {"sub": user["id"], "type": "refresh"},
        expires_delta=timedelta(days=30)
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,   # True in production
        samesite="lax",
        max_age=60 * 60 * 24 * 30,
    )

    return AuthResponse(
        access_token=token,
        user={
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
        },
    )

# ---------------------------------------------------------------------------
# GET /auth/accept-invite  — Validate invite token, return email
# ---------------------------------------------------------------------------

class AcceptInviteResponse(BaseModel):
    email: str
    name: str


@router.get("/accept-invite", response_model=AcceptInviteResponse)
async def accept_invite(token: str):
    """
    Public endpoint. Validates an invite token.
    Returns the associated email so the frontend can display
    "You are setting up your account for dr.james@hospital.com."
    """
    if not token or not token.strip():
        raise HTTPException(status_code=400, detail="Token is required.")

    db = get_supabase()
    result = (
        db.table("users")
        .select("id, email, name, status, invite_token, invite_expires_at")
        .eq("invite_token", token.strip())
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Invalid or expired invite link.")

    user = result.data[0]

    # Guard: account already activated
    if user["status"] != "pending":
        raise HTTPException(
            status_code=400,
            detail="This invite has already been used. Please log in instead."
        )

    # Guard: token expired
    if user["invite_expires_at"]:
        expires = datetime.fromisoformat(user["invite_expires_at"].replace("Z", "+00:00"))
        if datetime.now(timezone.utc) > expires:
            raise HTTPException(
                status_code=410,
                detail="This invite link has expired. Please ask your admin to send a new invite."
            )

    return AcceptInviteResponse(
        email=user["email"],
        name=user["name"],
    )


# ---------------------------------------------------------------------------
# POST /auth/set-password  — Activate account with password
# ---------------------------------------------------------------------------

class SetPasswordRequest(BaseModel):
    token: str
    password: str
    name: str = ""  # Optional — let the user update their name during setup

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        return v


class SetPasswordResponse(BaseModel):
    message: str


@router.post("/set-password", response_model=SetPasswordResponse)
async def set_password(body: SetPasswordRequest):
    """
    Public endpoint. Activates a pending account.
    - Validates the token exists, is not expired, and account is pending.
    - Hashes the password with bcrypt (12 rounds).
    - Sets status = 'active'.
    - Deletes the invite token (one-time use).
    """
    if not body.token or not body.token.strip():
        raise HTTPException(status_code=400, detail="Token is required.")

    db = get_supabase()
    result = (
        db.table("users")
        .select("id, email, name, status, invite_token, invite_expires_at")
        .eq("invite_token", body.token.strip())
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Invalid or expired invite link.")

    user = result.data[0]

    if user["status"] != "pending":
        raise HTTPException(
            status_code=400,
            detail="This invite has already been used. Please log in instead."
        )

    # Check token expiry
    if user["invite_expires_at"]:
        expires = datetime.fromisoformat(user["invite_expires_at"].replace("Z", "+00:00"))
        if datetime.now(timezone.utc) > expires:
            raise HTTPException(
                status_code=410,
                detail="This invite link has expired. Please ask your admin to send a new invite."
            )

    # Hash password and activate
    password_hash = hash_password(body.password)
    update_data: dict = {
        "password_hash": password_hash,
        "status": "active",
        "invite_token": None,      # Delete token — one-time use
        "invite_expires_at": None,
    }

    # Update name if the user provided one
    if body.name and body.name.strip():
        update_data["name"] = body.name.strip()

    db.table("users").update(update_data).eq("id", user["id"]).execute()

    return SetPasswordResponse(
        message="Account activated. You can now log in."
    )


# ---------------------------------------------------------------------------
# GET /health  — Uptime check
# ---------------------------------------------------------------------------

@router.get("/health", include_in_schema=False)
async def health():
    return {"status": "ok"}
