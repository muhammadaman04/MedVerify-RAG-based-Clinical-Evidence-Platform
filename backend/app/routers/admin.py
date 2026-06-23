"""
Admin-only routes: invite users, list users, manage users.
All endpoints require require_admin() dependency.
"""

import uuid
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr

from app.core.config import get_settings
from app.core.database import get_supabase
from app.core.deps import require_admin

router = APIRouter(prefix="/admin", tags=["admin"])
settings = get_settings()


# ---------------------------------------------------------------------------
# Request / response schemas
# ---------------------------------------------------------------------------

class InviteRequest(BaseModel):
    email: EmailStr
    role: str = "clinician"  # 'clinician' or 'admin'


class InviteResponse(BaseModel):
    message: str
    user_id: str
    email: str
    invite_link: str


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str
    status: str
    created_at: str


# ---------------------------------------------------------------------------
# POST /admin/invite  — Send invite email to a new user
# ---------------------------------------------------------------------------

@router.post("/invite", response_model=InviteResponse, status_code=201)
async def invite_user(body: InviteRequest, admin: dict = Depends(require_admin)):
    """
    Admin-only. Creates a pending user and sends an invite email via Resend.
    - Generates a UUID invite token (48-hour expiry).
    - Sends the invite email with a link to /accept-invite?token=xyz.
    """
    # Validate role
    if body.role not in ("clinician", "admin"):
        raise HTTPException(status_code=422, detail="Role must be 'clinician' or 'admin'.")

    db = get_supabase()

    # Check if email already exists
    existing = (
        db.table("users")
        .select("id, status")
        .eq("email", body.email.lower())
        .execute()
    )
    if existing.data:
        existing_user = existing.data[0]
        if existing_user["status"] == "active":
            raise HTTPException(
                status_code=409,
                detail="A user with this email already exists and is active."
            )
        # If pending, allow re-invite (regenerate token)
        if existing_user["status"] == "pending":
            return await _resend_invite(existing_user["id"], body.email.lower(), admin)

    # Generate invite token
    invite_token = str(uuid.uuid4())
    invite_expires_at = datetime.now(timezone.utc) + timedelta(hours=48)

    # Create user record with status='pending'
    insert_result = (
        db.table("users")
        .insert({
            "email": body.email.lower(),
            "name": body.email.split("@")[0],  # Placeholder — set by user on accept
            "role": body.role,
            "status": "pending",
            "invited_by": admin["sub"],  # admin's user_id from JWT
            "invite_token": invite_token,
            "invite_expires_at": invite_expires_at.isoformat(),
            "password_hash": None,
        })
        .execute()
    )

    if not insert_result.data:
        raise HTTPException(status_code=500, detail="Failed to create invite. Please try again.")

    user = insert_result.data[0]
    invite_link = f"{settings.frontend_url}/accept-invite?token={invite_token}"

    # Send invite email
    await _send_invite_email(body.email.lower(), invite_link, admin.get("name", "Admin"))

    return InviteResponse(
        message="Invite sent successfully.",
        user_id=user["id"],
        email=user["email"],
        invite_link=invite_link,
    )


async def _resend_invite(user_id: str, email: str, admin: dict) -> InviteResponse:
    """Re-generate token for an existing pending user and resend the email."""
    db = get_supabase()

    invite_token = str(uuid.uuid4())
    invite_expires_at = datetime.now(timezone.utc) + timedelta(hours=48)

    db.table("users").update({
        "invite_token": invite_token,
        "invite_expires_at": invite_expires_at.isoformat(),
    }).eq("id", user_id).execute()

    invite_link = f"{settings.frontend_url}/accept-invite?token={invite_token}"
    await _send_invite_email(email, invite_link, admin.get("name", "Admin"))

    return InviteResponse(
        message="Invite re-sent successfully.",
        user_id=user_id,
        email=email,
        invite_link=invite_link,
    )


async def _send_invite_email(to_email: str, invite_link: str, inviter_name: str):
    """
    Send the invite email via the Resend API.
    If the Resend API key is not configured, log instead of failing.
    """
    if not settings.resend_api_key:
        # Dev mode — just print the link
        print(f"\n{'='*60}")
        print(f"  INVITE EMAIL (Resend not configured)")
        print(f"  To: {to_email}")
        print(f"  Link: {invite_link}")
        print(f"{'='*60}\n")
        return

    try:
        import resend
        resend.api_key = settings.resend_api_key.strip()

        # resend Python SDK v2.x uses lowercase .emails.send()
        resend.Emails.send({
            "from": settings.resend_from_email,
            "to": [to_email],
            "subject": f"{inviter_name} invited you to MedVerify",
            "html": f"""
            <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
                <div style="margin-bottom: 24px;">
                    <strong style="font-size: 18px; color: #0f172a;">MedVerify</strong>
                </div>
                <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                    <strong>{inviter_name}</strong> has invited you to join MedVerify — an AI-powered clinical evidence platform.
                </p>
                <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                    Click the button below to set your password and activate your account. This link expires in 48 hours.
                </p>
                <div style="margin: 28px 0;">
                    <a href="{invite_link}"
                       style="display: inline-block; padding: 12px 28px; background: #0f172a; color: #ffffff;
                              text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
                        Accept Invite
                    </a>
                </div>
                <p style="color: #94a3b8; font-size: 13px;">
                    If the button doesn't work, copy and paste this URL into your browser:<br/>
                    <a href="{invite_link}" style="color: #2563eb; word-break: break-all;">{invite_link}</a>
                </p>
            </div>
            """,
        })
        print(f"✓ Invite email sent to {to_email}")
    except Exception as e:
        # Don't crash the invite flow if email fails — the link is still returned in the response
        print(f"✗ Failed to send invite email to {to_email}: {e}")



# ---------------------------------------------------------------------------
# GET /admin/users  — List all users
# ---------------------------------------------------------------------------

@router.get("/users")
async def list_users(admin: dict = Depends(require_admin)):
    """List all users with their role and status."""
    db = get_supabase()
    result = (
        db.table("users")
        .select("id, email, name, role, status, created_at, last_active_at")
        .order("created_at", desc=True)
        .execute()
    )
    return {"users": result.data}


# ---------------------------------------------------------------------------
# PATCH /admin/users/:id  — Update user role or deactivate
# ---------------------------------------------------------------------------

class UpdateUserRequest(BaseModel):
    role: str | None = None
    status: str | None = None


@router.patch("/users/{user_id}")
async def update_user(user_id: str, body: UpdateUserRequest, admin: dict = Depends(require_admin)):
    """Change a user's role or deactivate them."""
    db = get_supabase()

    updates = {}
    if body.role is not None:
        if body.role not in ("clinician", "admin"):
            raise HTTPException(status_code=422, detail="Role must be 'clinician' or 'admin'.")
        updates["role"] = body.role
    if body.status is not None:
        if body.status not in ("active", "deactivated"):
            raise HTTPException(status_code=422, detail="Status must be 'active' or 'deactivated'.")
        updates["status"] = body.status

    if not updates:
        raise HTTPException(status_code=422, detail="Nothing to update.")

    # Don't let admin deactivate themselves
    if body.status == "deactivated" and user_id == admin["sub"]:
        raise HTTPException(status_code=422, detail="You cannot deactivate yourself.")

    result = db.table("users").update(updates).eq("id", user_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="User not found.")

    return {"message": "User updated.", "user": result.data[0]}
