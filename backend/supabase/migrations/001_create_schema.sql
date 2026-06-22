-- =============================================================================
-- MedVerify — Migration 001: Full Schema
-- Run this in the Supabase SQL Editor (Database > SQL Editor > New Query)
-- =============================================================================

-- Enable pgcrypto for gen_random_uuid() (already available in Supabase)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- TABLE: users
-- All platform users. No public self-registration — admins invite everyone.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    email               TEXT            NOT NULL UNIQUE CHECK (email = lower(email)),
    name                TEXT            NOT NULL,
    role                TEXT            NOT NULL CHECK (role IN ('clinician', 'admin')),
    status              TEXT            NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'deactivated')),
    invited_by          UUID            REFERENCES public.users(id) ON DELETE SET NULL,
    invite_token        TEXT            UNIQUE,
    invite_expires_at   TIMESTAMPTZ,
    password_hash       TEXT,           -- bcrypt hash (12 rounds). NULL while status = 'pending'. Set by POST /auth/set-password.
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    last_active_at      TIMESTAMPTZ
);

COMMENT ON TABLE  public.users IS 'All MedVerify platform users. Created by admin invite only.';
COMMENT ON COLUMN public.users.role IS 'clinician = ask questions only | admin = full system access';
COMMENT ON COLUMN public.users.status IS 'pending = invite sent, not accepted | active = can log in | deactivated = blocked';
COMMENT ON COLUMN public.users.invite_token IS 'One-time UUID token sent in the invite email. Deleted after use.';
COMMENT ON COLUMN public.users.invite_expires_at IS '48 hours after invite was sent. Token is invalid after this time.';

-- =============================================================================
-- TABLE: documents
-- Every PDF or DOCX uploaded by an admin.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.documents (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    title               TEXT            NOT NULL,
    file_type           TEXT            NOT NULL CHECK (file_type IN ('pdf', 'docx')),
    file_url            TEXT            NOT NULL,
    uploaded_by         UUID            NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    status              TEXT            NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
    ocr_used            BOOLEAN         NOT NULL DEFAULT FALSE,
    freshness_status    TEXT            NOT NULL DEFAULT 'fresh' CHECK (freshness_status IN ('fresh', 'stale', 'critical')),
    last_ingested_at    TIMESTAMPTZ,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.documents IS 'Admin-uploaded medical documents (PDF/DOCX). Source of all RAG evidence.';
COMMENT ON COLUMN public.documents.status IS 'processing = Celery task running | ready = embedded & searchable | failed = pipeline error';
COMMENT ON COLUMN public.documents.ocr_used IS 'True if any page required Tesseract OCR (i.e., was a scanned image page).';
COMMENT ON COLUMN public.documents.freshness_status IS 'Set by nightly freshness agent. fresh/stale/critical based on days since last_ingested_at.';

CREATE INDEX IF NOT EXISTS idx_documents_status          ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_freshness_status ON public.documents(freshness_status);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by     ON public.documents(uploaded_by);

-- =============================================================================
-- TABLE: document_chunks
-- Each document split into overlapping text chunks for BM25 and vector search.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id         UUID            NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    pinecone_vector_id  TEXT            NOT NULL UNIQUE,
    raw_text            TEXT            NOT NULL,
    chunk_index         INTEGER         NOT NULL,
    page_number         INTEGER,
    heading_context     TEXT,
    content_hash        TEXT            NOT NULL,  -- SHA-256 of raw_text, used for change detection on re-ingest
    token_count         INTEGER
);

COMMENT ON TABLE  public.document_chunks IS 'Chunked text extracted from documents. raw_text powers BM25; pinecone_vector_id links to the embedding in Pinecone.';
COMMENT ON COLUMN public.document_chunks.content_hash IS 'SHA-256 hash of raw_text. If hash matches on re-ingest, skip re-embedding to save compute.';
COMMENT ON COLUMN public.document_chunks.heading_context IS 'The nearest H1/H2 heading above this chunk. Gives the reranker section context.';

CREATE INDEX IF NOT EXISTS idx_chunks_document_id    ON public.document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_content_hash   ON public.document_chunks(content_hash);

-- Full-text search index on raw_text for supplementary Postgres FTS (BM25 runs in Python)
CREATE INDEX IF NOT EXISTS idx_chunks_fts ON public.document_chunks USING gin(to_tsvector('english', raw_text));

-- =============================================================================
-- TABLE: queries
-- Every clinical question asked by a clinician, with its answer and routing outcome.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.queries (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID            NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    query_text          TEXT            NOT NULL,
    answer_text         TEXT,           -- NULL if route = 'review' or 'gap'
    confidence_score    FLOAT           CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
    route               TEXT            CHECK (route IN ('answered', 'review', 'gap')),
    citations           JSONB           DEFAULT '[]'::jsonb,  -- [{document_title, page_number, document_id}]
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.queries IS 'All questions asked by clinicians. Route determines outcome: answered/review/gap.';
COMMENT ON COLUMN public.queries.citations IS 'JSON array: [{document_title: string, page_number: int, document_id: uuid}]';
COMMENT ON COLUMN public.queries.route IS 'answered = confident response returned | review = held for admin | gap = insufficient evidence';

CREATE INDEX IF NOT EXISTS idx_queries_user_id    ON public.queries(user_id);
CREATE INDEX IF NOT EXISTS idx_queries_route      ON public.queries(route);
CREATE INDEX IF NOT EXISTS idx_queries_created_at ON public.queries(created_at DESC);

-- =============================================================================
-- TABLE: knowledge_gaps
-- Questions the system could not answer, tracked by frequency.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.knowledge_gaps (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    query_text      TEXT            NOT NULL,
    asked_count     INTEGER         NOT NULL DEFAULT 1,
    specialty_tag   TEXT,           -- Auto-detected: 'Cardiology', 'Paediatrics', etc.
    status          TEXT            NOT NULL DEFAULT 'unaddressed' CHECK (status IN ('unaddressed', 'in_progress', 'resolved')),
    first_asked_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    last_asked_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.knowledge_gaps IS 'Unanswered queries logged by the gap logger node. Sorted by asked_count to prioritise document uploads.';
COMMENT ON COLUMN public.knowledge_gaps.specialty_tag IS 'Auto-tagged from keywords in query_text. e.g. paediatric/child → Paediatrics.';

CREATE INDEX IF NOT EXISTS idx_gaps_status      ON public.knowledge_gaps(status);
CREATE INDEX IF NOT EXISTS idx_gaps_asked_count ON public.knowledge_gaps(asked_count DESC);

-- =============================================================================
-- TABLE: review_queue
-- Answers held for admin approval (confidence 0.50–0.74 or conflict detected).
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.review_queue (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    query_id            UUID            NOT NULL REFERENCES public.queries(id) ON DELETE CASCADE,
    query_text          TEXT            NOT NULL,
    retrieved_context   JSONB           NOT NULL DEFAULT '[]'::jsonb,  -- Top chunks used: [{chunk_id, raw_text, page_number, document_title}]
    proposed_answer     TEXT            NOT NULL,
    confidence_score    FLOAT           NOT NULL CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
    reason              TEXT            NOT NULL CHECK (reason IN ('low_confidence', 'conflict')),
    status              TEXT            NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by         UUID            REFERENCES public.users(id) ON DELETE SET NULL,
    reviewed_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.review_queue IS 'Held answers awaiting admin review before being returned to the clinician.';
COMMENT ON COLUMN public.review_queue.retrieved_context IS 'Snapshot of the top 5 reranked chunks at query time. Stored here so admins see exactly what evidence was used.';
COMMENT ON COLUMN public.review_queue.reason IS 'low_confidence = score 0.50-0.74 | conflict = contradictory evidence detected';

CREATE INDEX IF NOT EXISTS idx_review_status     ON public.review_queue(status);
CREATE INDEX IF NOT EXISTS idx_review_created_at ON public.review_queue(created_at DESC);

-- =============================================================================
-- TABLE: doc_freshness_checks
-- Append-only log of every nightly freshness agent run per document.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.doc_freshness_checks (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id             UUID            NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    checked_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    days_since_ingestion    INTEGER         NOT NULL,
    flagged_stale           BOOLEAN         NOT NULL DEFAULT FALSE
);

COMMENT ON TABLE  public.doc_freshness_checks IS 'Append-only audit log of freshness checks. One row per document per nightly run.';

CREATE INDEX IF NOT EXISTS idx_freshness_document_id ON public.doc_freshness_checks(document_id);
CREATE INDEX IF NOT EXISTS idx_freshness_checked_at  ON public.doc_freshness_checks(checked_at DESC);

-- =============================================================================
-- TABLE: settings
-- Single-row system configuration managed by admins.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.settings (
    id                              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    confidence_threshold            FLOAT       NOT NULL DEFAULT 0.75 CHECK (confidence_threshold >= 0.50 AND confidence_threshold <= 0.90),
    freshness_threshold_months      INTEGER     NOT NULL DEFAULT 12 CHECK (freshness_threshold_months IN (6, 12, 18, 24)),
    auto_escalate_high_risk         BOOLEAN     NOT NULL DEFAULT TRUE,
    gap_email_alerts                BOOLEAN     NOT NULL DEFAULT TRUE,
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.settings IS 'Global system configuration. Always contains exactly one row.';
COMMENT ON COLUMN public.settings.confidence_threshold IS 'Score >= this → answer directly. Score 0.50 to threshold → review. Below 0.50 → gap.';

-- Seed the single settings row
INSERT INTO public.settings (confidence_threshold, freshness_threshold_months)
VALUES (0.75, 12)
ON CONFLICT DO NOTHING;
