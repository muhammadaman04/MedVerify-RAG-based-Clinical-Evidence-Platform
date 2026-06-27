"""
Storage service — uploads raw document files to Supabase Storage.
Bucket: 'documents' (auto-created on first use).
"""
import mimetypes
from pathlib import Path

from app.core.database import get_supabase
from app.core.config import get_settings

settings = get_settings()


def ensure_bucket_exists() -> None:
    """Create the Supabase Storage bucket if it doesn't already exist."""
    db = get_supabase()
    bucket_name = settings.supabase_storage_bucket
    try:
        existing = db.storage.list_buckets()
        existing_names = [b.name for b in existing]
        if bucket_name not in existing_names:
            db.storage.create_bucket(
                bucket_name,
                options={"public": False},
            )
            print(f"✓ Storage bucket '{bucket_name}' created.")
        else:
            print(f"✓ Storage bucket '{bucket_name}' already exists.")
    except Exception as e:
        print(f"⚠️  Could not ensure storage bucket exists: {e}")


_bucket_checked = False


def upload_file(file_bytes: bytes, filename: str, content_type: str) -> str:
    """
    Upload a file to Supabase Storage.
    Returns the storage path (used to construct a signed URL later).

    Path format: documents/{filename}
    """
    global _bucket_checked
    if not _bucket_checked:
        ensure_bucket_exists()
        _bucket_checked = True

    db = get_supabase()
    bucket = settings.supabase_storage_bucket
    storage_path = filename  # e.g. "abc123_myguideline.pdf"

    try:
        db.storage.from_(bucket).upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": content_type, "upsert": "true"},
        )
        # Return the storage path so we can generate signed URLs later
        return storage_path
    except Exception as e:
        raise RuntimeError(f"Failed to upload file to Supabase Storage: {e}") from e


def get_signed_url(storage_path: str, expires_in: int = 3600) -> str:
    """Generate a time-limited signed download URL for a stored file."""
    db = get_supabase()
    bucket = settings.supabase_storage_bucket
    result = db.storage.from_(bucket).create_signed_url(storage_path, expires_in)
    return result.get("signedURL", "")
