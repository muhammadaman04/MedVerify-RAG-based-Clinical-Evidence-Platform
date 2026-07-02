"""
Auth router — thin controller layer.
All business logic and DB calls live in app.services.user_service.
"""
from datetime import timedelta

from fastapi import APIRouter, HTTPException, Response

from app.core.security import hash_password, verify_password, create_access_token
from app.schemas.auth import (
    SignupRequest, LoginRequest, AuthResponse,
    AcceptInviteResponse, SetPasswordRequest, SetPasswordResponse,
)
from app.services.user_service import (
    get_user_by_email,
    create_admin_user,
    touch_last_active,
    validate_invite_token,
    activate_user,
)

router = APIRouter(prefix="/auth", tags=["auth"])

GENERIC_LOGIN_ERROR = HTTPException(
    status_code=401,
    detail="Incorrect email or password."
)


def _issue_tokens(user: dict, response: Response) -> AuthResponse:
    """Issue access + refresh tokens and set the cookie."""
    access_token = create_access_token({
        "sub": user["id"],
        "email": user["email"],
        "role": user["role"],
        "name": user["name"],
        "org_id": user.get("organization_id"),   # ← tenant scope
    })
    refresh_token = create_access_token(
        {"sub": user["id"], "type": "refresh"},
        expires_delta=timedelta(days=30)
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,   # True in production (HTTPS)
        samesite="lax",
        max_age=60 * 60 * 24 * 30,
    )
    return AuthResponse(
        access_token=access_token,
        user={
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "organization_id": user.get("organization_id"),
        },
    )


# ---------------------------------------------------------------------------
# POST /auth/signup  — Admin self-registration (sign-up-and-go pattern)
# ---------------------------------------------------------------------------

@router.post("/signup", response_model=AuthResponse, status_code=201)
async def signup(body: SignupRequest, response: Response):
    """Public. Creates an admin account and returns a JWT immediately."""
    existing = get_user_by_email(body.email)
    if existing:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists."
        )

    password_hash = hash_password(body.password)
    user = create_admin_user(body.name, body.email, password_hash)
    return _issue_tokens(user, response)


# ---------------------------------------------------------------------------
# POST /auth/login  — Universal login
# ---------------------------------------------------------------------------

@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest, response: Response):
    """Public. Authenticates any active user (admin or clinician)."""
    user = get_user_by_email(body.email)

    if not user:
        raise GENERIC_LOGIN_ERROR
    if user["status"] != "active":
        raise GENERIC_LOGIN_ERROR
    if not user["password_hash"]:
        raise GENERIC_LOGIN_ERROR
    if not verify_password(body.password, user["password_hash"]):
        raise GENERIC_LOGIN_ERROR

    touch_last_active(user["id"])
    return _issue_tokens(user, response)


# ---------------------------------------------------------------------------
# GET /auth/accept-invite  — Validate invite token, return email for display
# ---------------------------------------------------------------------------

@router.get("/accept-invite", response_model=AcceptInviteResponse)
async def accept_invite(token: str):
    """
    Public. Validates an invite token.
    Returns the email so the frontend can display:
    'Setting up account for dr.james@hospital.com'
    """
    if not token or not token.strip():
        raise HTTPException(status_code=400, detail="Token is required.")

    user = validate_invite_token(token)
    return AcceptInviteResponse(email=user["email"], name=user["name"])


# ---------------------------------------------------------------------------
# POST /auth/set-password  — Activate pending account
# ---------------------------------------------------------------------------

@router.post("/set-password", response_model=SetPasswordResponse)
async def set_password(body: SetPasswordRequest):
    """
    Public. Hashes the password, sets status=active, deletes the invite token.
    """
    if not body.token or not body.token.strip():
        raise HTTPException(status_code=400, detail="Token is required.")

    user = validate_invite_token(body.token)
    password_hash = hash_password(body.password)
    activate_user(user["id"], password_hash, body.name)

    return SetPasswordResponse(message="Account activated. You can now log in.")


# ---------------------------------------------------------------------------
# GET /auth/health
# ---------------------------------------------------------------------------

@router.get("/health", include_in_schema=False)
async def health():
    return {"status": "ok"}
