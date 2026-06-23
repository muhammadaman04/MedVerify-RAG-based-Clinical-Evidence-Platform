"""
FastAPI dependencies for JWT-based authentication and role guarding.

Usage in routes:
    @router.get("/admin/users")
    async def list_users(user: dict = Depends(require_admin)):
        ...
"""

from fastapi import Depends, HTTPException, Request, Header

from app.core.security import decode_token


def _get_current_user(request: Request) -> dict:
    """
    Extract and decode the JWT from the Authorization header.
    Returns the decoded payload or raises 401.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated.")

    token = auth_header.split(" ", 1)[1]
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")

    return payload


async def require_admin(request: Request) -> dict:
    """
    Dependency: caller must have role = 'admin'.
    Returns 403 (not 401) on wrong role — hides route existence from attackers.
    """
    user = _get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden.")
    return user


async def require_clinician(request: Request) -> dict:
    """
    Dependency: caller must have role = 'clinician'.
    """
    user = _get_current_user(request)
    if user.get("role") != "clinician":
        raise HTTPException(status_code=403, detail="Forbidden.")
    return user


async def require_any_role(request: Request) -> dict:
    """
    Dependency: any authenticated user (admin or clinician).
    """
    return _get_current_user(request)
