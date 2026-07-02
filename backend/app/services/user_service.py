"""
User service — all user-related database operations and business logic.
No FastAPI imports. Pure Python functions that can be unit-tested independently.

Multitenancy model:
  - Every admin self-signup creates a new Organization.
  - The admin's organization_id is stored on their user row.
  - Clinicians invited by that admin inherit the same organization_id.
  - All queries are scoped to organization_id so tenants are fully isolated.
"""
import uuid
from datetime import datetime, timezone, timedelta

from fastapi import HTTPException

from app.core.database import get_supabase
from app.core.config import get_settings
from app.services.email_service import send_invite_email

settings = get_settings()


# ---------------------------------------------------------------------------
# Organization helpers
# ---------------------------------------------------------------------------

def create_organization(name: str) -> dict:
    """Create a new organization row. Returns the created row."""
    db = get_supabase()
    result = (
        db.table("organizations")
        .insert({"name": name})
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create organization.")
    return result.data[0]


# ---------------------------------------------------------------------------
# Auth operations
# ---------------------------------------------------------------------------

def get_user_by_email(email: str) -> dict | None:
    """Return a user row by email, or None if not found."""
    db = get_supabase()
    result = (
        db.table("users")
        .select("id, email, name, role, status, password_hash, last_active_at, organization_id")
        .eq("email", email.lower())
        .execute()
    )
    return result.data[0] if result.data else None


def create_admin_user(name: str, email: str, password_hash: str) -> dict:
    """
    Insert a new admin user row AND create an organization for them.
    The organization name defaults to '<name>'s Organization'.
    Returns the created user row (includes organization_id).
    """
    db = get_supabase()

    # 1. Create the organization first
    org = create_organization(f"{name}'s Organization")
    org_id = org["id"]

    # 2. Create the user linked to that org
    result = (
        db.table("users")
        .insert({
            "email": email.lower(),
            "name": name.strip(),
            "role": "admin",
            "status": "active",
            "password_hash": password_hash,
            "invited_by": None,
            "organization_id": org_id,
        })
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create account. Please try again.")
    return result.data[0]


def touch_last_active(user_id: str) -> None:
    """Update last_active_at to now."""
    db = get_supabase()
    db.table("users").update(
        {"last_active_at": datetime.now(timezone.utc).isoformat()}
    ).eq("id", user_id).execute()


# ---------------------------------------------------------------------------
# Invite operations
# ---------------------------------------------------------------------------

def get_user_by_invite_token(token: str) -> dict | None:
    """Return a user row matching the invite token, or None."""
    db = get_supabase()
    result = (
        db.table("users")
        .select("id, email, name, status, invite_token, invite_expires_at, organization_id")
        .eq("invite_token", token.strip())
        .execute()
    )
    return result.data[0] if result.data else None


def validate_invite_token(token: str) -> dict:
    """
    Validate an invite token and return the user row.
    Raises HTTPException on invalid, already-used, or expired tokens.
    """
    user = get_user_by_invite_token(token)
    if not user:
        raise HTTPException(status_code=404, detail="Invalid or expired invite link.")

    if user["status"] != "pending":
        raise HTTPException(
            status_code=400,
            detail="This invite has already been used. Please log in instead."
        )

    if user["invite_expires_at"]:
        expires = datetime.fromisoformat(user["invite_expires_at"].replace("Z", "+00:00"))
        if datetime.now(timezone.utc) > expires:
            raise HTTPException(
                status_code=410,
                detail="This invite link has expired. Please ask your admin to send a new invite."
            )
    return user


def create_invite(email: str, role: str, invited_by_id: str, organization_id: str) -> tuple[dict, str]:
    """
    Insert a pending user with a fresh invite token, scoped to the same org
    as the inviting admin.
    Returns (user_row, invite_link).
    """
    db = get_supabase()
    invite_token = str(uuid.uuid4())
    invite_expires_at = datetime.now(timezone.utc) + timedelta(hours=48)

    result = (
        db.table("users")
        .insert({
            "email": email.lower(),
            "name": email.split("@")[0],  # Placeholder — user sets real name on accept
            "role": role,
            "status": "pending",
            "invited_by": invited_by_id,
            "invite_token": invite_token,
            "invite_expires_at": invite_expires_at.isoformat(),
            "password_hash": None,
            "organization_id": organization_id,   # ← inherit admin's org
        })
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create invite. Please try again.")

    invite_link = f"{settings.frontend_url}/accept-invite?token={invite_token}"
    return result.data[0], invite_link


def refresh_invite_token(user_id: str) -> str:
    """Generate a new token for an existing pending user. Returns the new invite_link."""
    db = get_supabase()
    invite_token = str(uuid.uuid4())
    invite_expires_at = datetime.now(timezone.utc) + timedelta(hours=48)

    db.table("users").update({
        "invite_token": invite_token,
        "invite_expires_at": invite_expires_at.isoformat(),
    }).eq("id", user_id).execute()

    return f"{settings.frontend_url}/accept-invite?token={invite_token}"


def activate_user(user_id: str, password_hash: str, name: str | None = None) -> None:
    """Set password, mark active, and delete the invite token."""
    db = get_supabase()
    update_data: dict = {
        "password_hash": password_hash,
        "status": "active",
        "invite_token": None,
        "invite_expires_at": None,
    }
    if name and name.strip():
        update_data["name"] = name.strip()

    db.table("users").update(update_data).eq("id", user_id).execute()


# ---------------------------------------------------------------------------
# Admin user management — all scoped to the caller's organization
# ---------------------------------------------------------------------------

def list_org_users(organization_id: str) -> list[dict]:
    """Return all users in a specific organization, ordered by creation date."""
    db = get_supabase()
    result = (
        db.table("users")
        .select("id, email, name, role, status, created_at, last_active_at")
        .eq("organization_id", organization_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


def update_user_by_id(user_id: str, updates: dict) -> dict:
    """Apply updates dict to a user row. Returns the updated row."""
    db = get_supabase()
    result = db.table("users").update(updates).eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found.")
    return result.data[0]
