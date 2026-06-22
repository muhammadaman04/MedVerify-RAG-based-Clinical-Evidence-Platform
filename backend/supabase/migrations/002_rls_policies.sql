-- =============================================================================
-- MedVerify — Migration 002: Row Level Security Policies
-- Run this AFTER 001_create_schema.sql
-- =============================================================================
-- Strategy:
--   • Clinicians  → their own data only (queries they asked, their profile)
--   • Admins      → full read/write on everything
--   • Backend service role (FastAPI) → bypasses RLS via service_role key
-- =============================================================================

-- Helper: returns the role of the authenticated user from the JWT claim
-- The JWT issued by FastAPI includes a "role" field in its payload.
-- We store a mirror of this in the users table so RLS can reference it.
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- Helper: returns true if the current JWT belongs to an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
  );
$$;

-- Helper: returns true if the current JWT belongs to an active clinician
CREATE OR REPLACE FUNCTION public.is_clinician()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'clinician' AND status = 'active'
  );
$$;

-- =============================================================================
-- ENABLE RLS ON ALL TABLES
-- Must be done before any policies take effect.
-- =============================================================================

ALTER TABLE public.users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queries             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_gaps      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_queue        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doc_freshness_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings            ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- TABLE: users
-- =============================================================================

-- Admins can read all users (for the user management page)
CREATE POLICY "admins_select_all_users"
ON public.users FOR SELECT
USING (public.is_admin());

-- Clinicians can only read their own profile
CREATE POLICY "clinicians_select_own_profile"
ON public.users FOR SELECT
USING (id = auth.uid() AND public.is_clinician());

-- Admins can update any user (role changes, deactivation)
CREATE POLICY "admins_update_users"
ON public.users FOR UPDATE
USING (public.is_admin());

-- Admins can insert new users (the invite flow creates user records)
CREATE POLICY "admins_insert_users"
ON public.users FOR INSERT
WITH CHECK (public.is_admin());

-- NOTE: DELETE is intentionally not granted. Users are deactivated, not deleted.
-- The FastAPI service_role key bypasses these policies for system-level operations
-- (e.g., creating the very first admin seed, accepting invites before login).

-- =============================================================================
-- TABLE: documents
-- Clinicians have ZERO access. This table is admin-only.
-- =============================================================================

-- Admins can do everything on documents
CREATE POLICY "admins_all_on_documents"
ON public.documents FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- No clinician policy = clinicians are blocked entirely (RLS default-deny)

-- =============================================================================
-- TABLE: document_chunks
-- Clinicians have ZERO direct access. Chunks are accessed only via the
-- FastAPI query pipeline (which uses the service_role key).
-- =============================================================================

CREATE POLICY "admins_all_on_document_chunks"
ON public.document_chunks FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- =============================================================================
-- TABLE: queries
-- Clinicians see only their own rows. Admins see everything.
-- =============================================================================

-- Clinicians can read only queries they asked
CREATE POLICY "clinicians_select_own_queries"
ON public.queries FOR SELECT
USING (user_id = auth.uid() AND public.is_clinician());

-- Clinicians can insert their own queries
CREATE POLICY "clinicians_insert_own_queries"
ON public.queries FOR INSERT
WITH CHECK (user_id = auth.uid() AND public.is_clinician());

-- Admins can read all queries (for dashboard analytics)
CREATE POLICY "admins_select_all_queries"
ON public.queries FOR SELECT
USING (public.is_admin());

-- Admins can update queries (e.g., change route from 'review' to 'answered' after approval)
CREATE POLICY "admins_update_queries"
ON public.queries FOR UPDATE
USING (public.is_admin());

-- =============================================================================
-- TABLE: knowledge_gaps
-- Clinicians have no access (they get a generic "insufficient evidence" message).
-- Admins can read and update gap statuses.
-- =============================================================================

CREATE POLICY "admins_all_on_knowledge_gaps"
ON public.knowledge_gaps FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- =============================================================================
-- TABLE: review_queue
-- Clinicians have no access. Admins manage the full queue.
-- =============================================================================

CREATE POLICY "admins_all_on_review_queue"
ON public.review_queue FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- =============================================================================
-- TABLE: doc_freshness_checks
-- Read-only for admins (written by the Celery freshness agent via service_role).
-- =============================================================================

CREATE POLICY "admins_select_freshness_checks"
ON public.doc_freshness_checks FOR SELECT
USING (public.is_admin());

-- =============================================================================
-- TABLE: settings
-- Admins can read and update. Clinicians have no access.
-- =============================================================================

CREATE POLICY "admins_all_on_settings"
ON public.settings FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- =============================================================================
-- VERIFICATION QUERIES
-- Run these after applying the policies to confirm everything is locked down.
-- Execute each block with a test JWT to validate.
-- =============================================================================

-- TEST 1: As a clinician JWT, this should return ONLY their own rows (not all users)
-- SELECT * FROM public.users;

-- TEST 2: As a clinician JWT, this should return ZERO rows (clinicians blocked)
-- SELECT * FROM public.documents;

-- TEST 3: As a clinician JWT, this should return ONLY rows where user_id = their id
-- SELECT * FROM public.queries;

-- TEST 4: As a clinician JWT, this should return ZERO rows
-- SELECT * FROM public.knowledge_gaps;

-- TEST 5: As an admin JWT, this should return ALL rows from every table
-- SELECT COUNT(*) FROM public.users;
-- SELECT COUNT(*) FROM public.documents;
-- SELECT COUNT(*) FROM public.queries;

-- =============================================================================
-- SEED: First admin user
-- Replace the values below with your actual first admin details.
-- Run this manually ONCE after migrations are applied.
-- The password hash is set by FastAPI — insert a placeholder here so the row
-- exists, then immediately use the accept-invite flow to set a real password.
-- =============================================================================

-- INSERT INTO public.users (email, name, role, status)
-- VALUES ('admin@medverify.com', 'System Admin', 'admin', 'active')
-- ON CONFLICT (email) DO NOTHING;
