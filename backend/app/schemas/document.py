# Pydantic schemas for document endpoints
from pydantic import BaseModel
from typing import Optional


class DocumentUploadResponse(BaseModel):
    message: str
    document_id: str
    status: str


class DocumentStatusResponse(BaseModel):
    document_id: str
    status: str          # processing | ready | failed
    ocr_used: bool
    chunk_count: int


class DocumentListItem(BaseModel):
    id: str
    title: str
    file_type: str
    status: str
    ocr_used: bool
    freshness_status: str
    created_at: str
    last_ingested_at: Optional[str] = None
    chunk_count: int = 0


class DocumentOut(BaseModel):
    id: str
    title: str
    file_type: str
    status: str
    ocr_used: bool
    freshness_status: str
    created_at: str
    last_ingested_at: Optional[str] = None
