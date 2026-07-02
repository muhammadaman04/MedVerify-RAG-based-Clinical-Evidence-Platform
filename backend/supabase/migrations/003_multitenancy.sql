-- =============================================================================
-- MedVerify — Migration 003: Multitenancy (Organization Isolation)
-- Run this in the Supabase SQL Editor AFTER migrations 001 and 002.
-- Safe to run multiple times — all statements use IF NOT EXISTS guards.
-- =============================================================================

-- =============================================================================
-- TABLE: organizations
-- Created automatically when an admin signs up. All data is scoped to an org.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.organizations (
    id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT    NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.organizations IS 'One org per admin sign-up. All data (users, docs, queries) is scoped to an org.';

-- =============================================================================
-- Add organization_id to users
-- =============================================================================
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE public.users
            ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_org ON public.users(organization_id);

-- =============================================================================
-- Add organization_id to documents
-- =============================================================================
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'documents' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE public.documents
            ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_documents_org ON public.documents(organization_id);

-- =============================================================================
-- Add organization_id to document_chunks
-- =============================================================================
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'document_chunks' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE public.document_chunks
            ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_chunks_org ON public.document_chunks(organization_id);

-- =============================================================================
-- Add organization_id to queries
-- =============================================================================
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'queries' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE public.queries
            ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_queries_org ON public.queries(organization_id);

-- =============================================================================
-- Add organization_id to knowledge_gaps
-- =============================================================================
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'knowledge_gaps' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE public.knowledge_gaps
            ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_gaps_org ON public.knowledge_gaps(organization_id);

-- =============================================================================
-- Add organization_id to review_queue
-- =============================================================================
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'review_queue' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE public.review_queue
            ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_review_org ON public.review_queue(organization_id);
