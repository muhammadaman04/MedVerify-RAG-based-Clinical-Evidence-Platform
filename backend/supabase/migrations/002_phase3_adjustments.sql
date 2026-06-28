-- =============================================================================
-- MedVerify — Migration 002: Phase 3 table adjustments
-- Run this in the Supabase SQL Editor if not already applied.
-- Safe to run multiple times (IF NOT EXISTS guards).
-- =============================================================================

-- review_queue: make query_id nullable so the RAG node can insert before query logging
ALTER TABLE public.review_queue
    ALTER COLUMN query_id DROP NOT NULL;

-- knowledge_gaps: add last_asked_at column if it doesn't exist
-- (column may already be present from migration 001)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'knowledge_gaps' AND column_name = 'last_asked_at'
    ) THEN
        ALTER TABLE public.knowledge_gaps ADD COLUMN last_asked_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    END IF;
END $$;

-- queries: ensure citations column is JSONB and can store a JSON string
-- (already defined as JSONB in migration 001 — this is a no-op safety check)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'queries' AND column_name = 'citations'
    ) THEN
        ALTER TABLE public.queries ADD COLUMN citations JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;
