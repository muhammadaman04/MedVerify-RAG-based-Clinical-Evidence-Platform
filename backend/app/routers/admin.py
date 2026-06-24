"""
Admin router — thin controller layer.
All business logic and DB calls live in app.services.*
"""
import threading
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form

from app.core.deps import require_admin
from app.core.database import get_supabase
from app.schemas.user import InviteRequest, InviteResponse, UpdateUserRequest
from app.schemas.document import DocumentUploadResponse, DocumentStatusResponse, DocumentListItem
from app.services.user_service import (
    get_user_by_email,
    create_invite,
    refresh_invite_token,
    list_all_users,
    update_user_by_id,
)
from app.services.email_service import send_invite_email
from app.services.storage_service import upload_file
from app.services.document_service import process_document

router = APIRouter(prefix="/admin", tags=["admin"])


# ---------------------------------------------------------------------------
# POST /admin/invite  — Send invite email to a new team member
# ---------------------------------------------------------------------------

@router.post("/invite", response_model=InviteResponse, status_code=201)
async def invite_user(body: InviteRequest, admin: dict = Depends(require_admin)):
    """
    Admin-only. Creates a pending user and sends an invite email.
    If the user already exists as pending, regenerates the token and resends.
    """
    if body.role not in ("clinician", "admin"):
        raise HTTPException(status_code=422, detail="Role must be 'clinician' or 'admin'.")

    existing = get_user_by_email(body.email)

    if existing:
        if existing["status"] == "active":
            raise HTTPException(
                status_code=409,
                detail="A user with this email already exists and is active."
            )
        # Re-invite a pending user: regenerate token and resend
        if existing["status"] == "pending":
            invite_link = refresh_invite_token(existing["id"])
            send_invite_email(body.email.lower(), invite_link, admin.get("name", "Admin"))
            return InviteResponse(
                message="Invite re-sent successfully.",
                user_id=existing["id"],
                email=body.email.lower(),
                invite_link=invite_link,
            )

    user, invite_link = create_invite(
        email=body.email,
        role=body.role,
        invited_by_id=admin["sub"],
    )
    send_invite_email(body.email.lower(), invite_link, admin.get("name", "Admin"))

    return InviteResponse(
        message="Invite sent successfully.",
        user_id=user["id"],
        email=user["email"],
        invite_link=invite_link,
    )


# ---------------------------------------------------------------------------
# GET /admin/users  — List all users
# ---------------------------------------------------------------------------

@router.get("/users")
async def get_users(admin: dict = Depends(require_admin)):
    """List all users ordered by creation date."""
    users = list_all_users()
    return {"users": users}


# ---------------------------------------------------------------------------
# PATCH /admin/users/:id  — Update role or status
# ---------------------------------------------------------------------------

@router.patch("/users/{user_id}")
async def patch_user(
    user_id: str,
    body: UpdateUserRequest,
    admin: dict = Depends(require_admin)
):
    """Change a user's role or deactivate/reactivate them."""
    updates: dict = {}

    if body.role is not None:
        if body.role not in ("clinician", "admin"):
            raise HTTPException(status_code=422, detail="Role must be 'clinician' or 'admin'.")
        updates["role"] = body.role

    if body.status is not None:
        if body.status not in ("active", "deactivated"):
            raise HTTPException(status_code=422, detail="Status must be 'active' or 'deactivated'.")
        if body.status == "deactivated" and user_id == admin["sub"]:
            raise HTTPException(status_code=422, detail="You cannot deactivate yourself.")
        updates["status"] = body.status

    if not updates:
        raise HTTPException(status_code=422, detail="Nothing to update.")

    updated = update_user_by_id(user_id, updates)
    return {"message": "User updated.", "user": updated}


# ===========================================================================
# DOCUMENT ENDPOINTS (Phase 2)
# ===========================================================================

# Allowed MIME types — checked on the server, not just the extension
ALLOWED_MIME_TYPES = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
}


# ---------------------------------------------------------------------------
# POST /admin/documents/upload
# ---------------------------------------------------------------------------

@router.post("/documents/upload", response_model=DocumentUploadResponse, status_code=202)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    admin: dict = Depends(require_admin),
):
    """
    Admin-only. Accepts a PDF or DOCX multipart upload.
    - Validates MIME type server-side.
    - Saves the raw file to Supabase Storage.
    - Creates a document record in Supabase (status=processing).
    - Kicks off ingestion in a background thread.
    - Returns the document_id immediately for frontend polling.
    """
    if not title or not title.strip():
        raise HTTPException(status_code=422, detail="Title is required.")

    content_type = file.content_type or ""
    file_type = ALLOWED_MIME_TYPES.get(content_type)
    if not file_type:
        raise HTTPException(
            status_code=415,
            detail="Invalid file type. Only PDF and DOCX files are accepted."
        )

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=422, detail="Uploaded file is empty.")

    db = get_supabase()
    document_id = str(uuid.uuid4())
    safe_name = f"{document_id}_{file.filename or 'document'}"

    # Upload raw file to Supabase Storage
    try:
        storage_path = upload_file(file_bytes, safe_name, content_type)
        file_url = storage_path
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File storage failed: {e}")

    # Create document record with status='processing'
    insert_result = db.table("documents").insert({
        "id": document_id,
        "title": title.strip(),
        "file_type": file_type,
        "file_url": file_url,
        "uploaded_by": admin["sub"],
        "status": "processing",
        "ocr_used": False,
        "freshness_status": "fresh",
    }).execute()

    if not insert_result.data:
        raise HTTPException(status_code=500, detail="Failed to create document record.")

    # Run ingestion in a background thread so we can return immediately
    thread = threading.Thread(
        target=process_document,
        args=(document_id, file_bytes, file_type, title.strip()),
        daemon=True,
    )
    thread.start()

    return DocumentUploadResponse(
        message="Document uploaded. Processing started.",
        document_id=document_id,
        status="processing",
    )


# ---------------------------------------------------------------------------
# GET /admin/documents/:id/status  — Poll for processing progress
# ---------------------------------------------------------------------------

@router.get("/documents/{document_id}/status", response_model=DocumentStatusResponse)
async def get_document_status(
    document_id: str,
    admin: dict = Depends(require_admin),
):
    """Returns the current processing status of a document."""
    db = get_supabase()
    result = (
        db.table("documents")
        .select("id, status, ocr_used")
        .eq("id", document_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Document not found.")

    doc = result.data[0]
    # Count chunks
    chunk_count_result = (
        db.table("document_chunks")
        .select("id", count="exact")
        .eq("document_id", document_id)
        .execute()
    )
    chunk_count = chunk_count_result.count or 0

    return DocumentStatusResponse(
        document_id=doc["id"],
        status=doc["status"],
        ocr_used=doc["ocr_used"],
        chunk_count=chunk_count,
    )


# ---------------------------------------------------------------------------
# GET /admin/documents  — List all documents
# ---------------------------------------------------------------------------

@router.get("/documents")
async def list_documents(admin: dict = Depends(require_admin)):
    """Returns all documents with chunk count."""
    db = get_supabase()
    result = (
        db.table("documents")
        .select("id, title, file_type, status, ocr_used, freshness_status, created_at, last_ingested_at")
        .order("created_at", desc=True)
        .execute()
    )

    documents = []
    for doc in result.data:
        chunk_count_result = (
            db.table("document_chunks")
            .select("id", count="exact")
            .eq("document_id", doc["id"])
            .execute()
        )
        documents.append({
            **doc,
            "chunk_count": chunk_count_result.count or 0,
        })

    return {"documents": documents}
