"""
Document ingestion service — the core Phase 2 pipeline.

Flow:
  upload_file → extract text → chunk → embed (MiniLM) → upsert Pinecone → save Supabase
"""
from __future__ import annotations

import hashlib
import re
import uuid
from dataclasses import dataclass, field
from typing import Optional

from app.core.database import get_supabase
from app.core.pinecone_client import get_pinecone_index
from app.core.config import get_settings

settings = get_settings()

# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class PageText:
    """Raw text extracted from a single page or paragraph block."""
    text: str
    page_number: int            # 1-indexed; 0 for DOCX (no page concept)
    heading_context: str = ""   # Nearest heading above this block


@dataclass
class Chunk:
    """A text chunk ready for embedding."""
    raw_text: str
    chunk_index: int
    page_number: int
    heading_context: str
    token_count: int
    content_hash: str


@dataclass
class EmbeddedChunk(Chunk):
    """A chunk with its embedding vector attached."""
    vector: list[float] = field(default_factory=list)


# ---------------------------------------------------------------------------
# 2.2 — PDF text extraction (digital only; OCR deferred)
# ---------------------------------------------------------------------------

def extract_text_from_pdf(file_bytes: bytes) -> tuple[list[PageText], bool]:
    """
    Extract text from a digital PDF using PyMuPDF.
    Returns (pages, ocr_used). ocr_used is always False until OCR is added.
    Pages with < 50 meaningful characters are skipped.
    """
    import fitz  # PyMuPDF

    pages: list[PageText] = []
    doc = fitz.open(stream=file_bytes, filetype="pdf")

    for page_num in range(len(doc)):
        page = doc[page_num]
        raw = page.get_text()
        cleaned = raw.strip()

        if len(cleaned) >= 50:
            pages.append(PageText(
                text=cleaned,
                page_number=page_num + 1,  # 1-indexed
            ))
        else:
            # Scanned page — OCR would go here. Skip for now.
            print(f"  ⚠️  Page {page_num + 1}: low text ({len(cleaned)} chars), skipping (OCR deferred).")

    doc.close()
    return pages, False  # ocr_used = False


# ---------------------------------------------------------------------------
# 2.4 — DOCX extraction with heading context
# ---------------------------------------------------------------------------

def extract_text_from_docx(file_bytes: bytes) -> list[PageText]:
    """
    Extract paragraphs and tables from a DOCX file.
    Heading 1 / Heading 2 paragraphs update heading_context for subsequent chunks.
    Tables are flattened to pipe-delimited rows.
    """
    import io
    from docx import Document
    from docx.oxml.ns import qn

    doc = Document(io.BytesIO(file_bytes))
    pages: list[PageText] = []
    current_heading = ""
    chunk_index = 0

    for element in doc.element.body:
        tag = element.tag.split("}")[-1]  # strip namespace

        if tag == "p":
            # Paragraph
            para_text = "".join(r.text for r in element.iter(qn("w:t")))
            style_name = ""
            pPr = element.find(qn("w:pPr"))
            if pPr is not None:
                pStyle = pPr.find(qn("w:pStyle"))
                if pStyle is not None:
                    style_name = pStyle.get(qn("w:val"), "")

            if "Heading1" in style_name or style_name == "1":
                current_heading = para_text.strip()
                continue  # Don't add headings as content chunks
            elif "Heading2" in style_name or style_name == "2":
                current_heading = para_text.strip()
                continue

            stripped = para_text.strip()
            if stripped:
                pages.append(PageText(
                    text=stripped,
                    page_number=0,  # DOCX has no page concept
                    heading_context=current_heading,
                ))

        elif tag == "tbl":
            # Table — flatten each row to pipe-delimited
            for row in element.iter(qn("w:tr")):
                cells = []
                for cell in row.iter(qn("w:tc")):
                    cell_text = "".join(t.text for t in cell.iter(qn("w:t"))).strip()
                    if cell_text:
                        cells.append(cell_text)
                if cells:
                    pages.append(PageText(
                        text=" | ".join(cells),
                        page_number=0,
                        heading_context=current_heading,
                    ))

    return pages


# ---------------------------------------------------------------------------
# 2.5 — Chunking with LangChain RecursiveCharacterTextSplitter
# ---------------------------------------------------------------------------

def chunk_pages(pages: list[PageText], document_id: str) -> list[Chunk]:
    """
    Split extracted pages/paragraphs into overlapping chunks.
    chunk_size=512, overlap=64 (in approximate token count via character proxy).
    Each chunk carries page_number and heading_context from its source page.
    """
    from langchain_text_splitters import RecursiveCharacterTextSplitter

    # ~4 chars per token is a reasonable proxy for character-based splitting
    CHARS_PER_TOKEN = 4
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=512 * CHARS_PER_TOKEN,    # 2048 chars ≈ 512 tokens
        chunk_overlap=64 * CHARS_PER_TOKEN,  # 256 chars ≈ 64 token overlap
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    chunks: list[Chunk] = []
    chunk_index = 0

    for page in pages:
        splits = splitter.split_text(page.text)
        for split_text in splits:
            stripped = split_text.strip()
            if not stripped:
                continue
            content_hash = hashlib.sha256(stripped.encode()).hexdigest()
            # Rough token estimate: characters / 4
            token_count = max(1, len(stripped) // CHARS_PER_TOKEN)

            chunks.append(Chunk(
                raw_text=stripped,
                chunk_index=chunk_index,
                page_number=page.page_number,
                heading_context=page.heading_context,
                token_count=token_count,
                content_hash=content_hash,
            ))
            chunk_index += 1

    return chunks


# ---------------------------------------------------------------------------
# 2.6 — Embedding with all-MiniLM-L6-v2
# ---------------------------------------------------------------------------

_embedding_model = None  # lazy-loaded singleton

def _get_model():
    global _embedding_model
    if _embedding_model is None:
        from sentence_transformers import SentenceTransformer
        print("🔧 Loading all-MiniLM-L6-v2 embedding model…")
        _embedding_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        print("✓ Embedding model loaded.")
    return _embedding_model


def embed_chunks(chunks: list[Chunk], batch_size: int = 64) -> list[EmbeddedChunk]:
    """
    Encode all chunks using all-MiniLM-L6-v2 in batches.
    Returns EmbeddedChunk objects with .vector populated.
    """
    model = _get_model()
    texts = [c.raw_text for c in chunks]
    all_vectors: list = []

    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        vecs = model.encode(batch, show_progress_bar=False, normalize_embeddings=True)
        all_vectors.extend(vecs.tolist())

    embedded: list[EmbeddedChunk] = []
    for chunk, vector in zip(chunks, all_vectors):
        ec = EmbeddedChunk(**chunk.__dict__, vector=vector)
        embedded.append(ec)

    return embedded


# ---------------------------------------------------------------------------
# 2.7 — Upsert to Pinecone
# ---------------------------------------------------------------------------

def upsert_to_pinecone(
    embedded_chunks: list[EmbeddedChunk],
    document_id: str,
    document_title: str,
    batch_size: int = 100,
) -> list[str]:
    """
    Upsert embedded chunks into Pinecone.
    Returns the list of pinecone_vector_ids assigned.
    Uses document_id + chunk_index as the stable vector ID
    so re-ingestion replaces rather than duplicates.
    """
    index = get_pinecone_index()
    if index is None:
        print("⚠️  Pinecone not configured — skipping vector upsert.")
        # Return dummy IDs so the pipeline can still save chunks to Supabase
        return [f"local_{document_id}_{c.chunk_index}" for c in embedded_chunks]

    vectors = []
    pinecone_ids = []

    for chunk in embedded_chunks:
        vector_id = f"{document_id}_{chunk.chunk_index}"
        pinecone_ids.append(vector_id)
        vectors.append({
            "id": vector_id,
            "values": chunk.vector,
            "metadata": {
                "document_id": document_id,
                "document_title": document_title,
                "page_number": chunk.page_number,
                "heading_context": chunk.heading_context,
                "chunk_index": chunk.chunk_index,
            },
        })

    # Upsert in batches of 100
    for i in range(0, len(vectors), batch_size):
        batch = vectors[i:i + batch_size]
        index.upsert(vectors=batch)

    print(f"✓ Upserted {len(vectors)} vectors to Pinecone.")
    return pinecone_ids


# ---------------------------------------------------------------------------
# 2.8 — Mirror chunks in Supabase document_chunks
# ---------------------------------------------------------------------------

def save_chunks_to_supabase(
    document_id: str,
    embedded_chunks: list[EmbeddedChunk],
    pinecone_ids: list[str],
) -> None:
    """Insert all chunks into the document_chunks table."""
    db = get_supabase()

    rows = []
    for chunk, pinecone_id in zip(embedded_chunks, pinecone_ids):
        rows.append({
            "document_id": document_id,
            "pinecone_vector_id": pinecone_id,
            "raw_text": chunk.raw_text,
            "chunk_index": chunk.chunk_index,
            "page_number": chunk.page_number if chunk.page_number > 0 else None,
            "heading_context": chunk.heading_context or None,
            "content_hash": chunk.content_hash,
            "token_count": chunk.token_count,
        })

    # Insert in batches of 200 to avoid payload limits
    BATCH = 200
    for i in range(0, len(rows), BATCH):
        db.table("document_chunks").insert(rows[i:i + BATCH]).execute()

    print(f"✓ Saved {len(rows)} chunks to Supabase document_chunks.")


# ---------------------------------------------------------------------------
# Orchestrator — ties everything together
# ---------------------------------------------------------------------------

def _update_document_status(document_id: str, status: str, extra: dict | None = None) -> None:
    db = get_supabase()
    update = {"status": status}
    if extra:
        update.update(extra)
    db.table("documents").update(update).eq("id", document_id).execute()


def process_document(document_id: str, file_bytes: bytes, file_type: str, title: str) -> None:
    """
    Full ingestion pipeline orchestrator.
    Called synchronously for now (Celery will wrap this in Phase 5).

    Stages:
      1. Extract text (PDF or DOCX)
      2. Chunk text
      3. Embed chunks
      4. Upsert to Pinecone
      5. Save to Supabase document_chunks
      6. Mark document as 'ready'
    """
    try:
        print(f"\n{'─'*50}")
        print(f"  Processing document: {title} ({document_id})")

        # Stage 1: Extract
        _update_document_status(document_id, "processing", {"status": "processing"})
        ocr_used = False

        if file_type == "pdf":
            pages, ocr_used = extract_text_from_pdf(file_bytes)
        elif file_type == "docx":
            pages = extract_text_from_docx(file_bytes)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")

        if not pages:
            raise ValueError("No extractable text found in the document.")

        print(f"  ✓ Extracted text from {len(pages)} pages/blocks.")

        # Stage 2: Chunk
        chunks = chunk_pages(pages, document_id)
        print(f"  ✓ Created {len(chunks)} chunks.")

        # Stage 3: Embed
        embedded = embed_chunks(chunks)
        print(f"  ✓ Embedded {len(embedded)} chunks.")

        # Stage 4: Pinecone
        pinecone_ids = upsert_to_pinecone(embedded, document_id, title)

        # Stage 5: Supabase chunks
        save_chunks_to_supabase(document_id, embedded, pinecone_ids)

        # Stage 6: Mark ready
        from datetime import datetime, timezone
        _update_document_status(document_id, "ready", {
            "ocr_used": ocr_used,
            "last_ingested_at": datetime.now(timezone.utc).isoformat(),
        })
        print(f"  ✓ Document '{title}' processing complete.\n{'─'*50}\n")

    except Exception as e:
        print(f"  ✗ Document processing failed: {e}")
        _update_document_status(document_id, "failed")
        raise
