-- ==============================================================================
-- Migration: Enable Row Level Security (RLS) on public.interview_rounds & core tables
-- Resolves Supabase Security Advisor Linter: "RLS Disabled in Public"
-- ==============================================================================

-- 1. Enable Row Level Security on interview_rounds
ALTER TABLE "public"."interview_rounds" ENABLE ROW LEVEL SECURITY;

-- 2. Allow authenticated users to manage their own interview rounds
-- Linked via interview_rounds.application_id -> applications.id -> applications.user_id = auth.uid()
DROP POLICY IF EXISTS "Users can view own interview rounds" ON "public"."interview_rounds";
CREATE POLICY "Users can view own interview rounds"
ON "public"."interview_rounds"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "public"."applications"
    WHERE "applications"."id" = "interview_rounds"."application_id"
      AND "applications"."user_id" = (auth.uid())::text
  )
);

DROP POLICY IF EXISTS "Users can insert own interview rounds" ON "public"."interview_rounds";
CREATE POLICY "Users can insert own interview rounds"
ON "public"."interview_rounds"
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "public"."applications"
    WHERE "applications"."id" = "interview_rounds"."application_id"
      AND "applications"."user_id" = (auth.uid())::text
  )
);

DROP POLICY IF EXISTS "Users can update own interview rounds" ON "public"."interview_rounds";
CREATE POLICY "Users can update own interview rounds"
ON "public"."interview_rounds"
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "public"."applications"
    WHERE "applications"."id" = "interview_rounds"."application_id"
      AND "applications"."user_id" = (auth.uid())::text
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "public"."applications"
    WHERE "applications"."id" = "interview_rounds"."application_id"
      AND "applications"."user_id" = (auth.uid())::text
  )
);

DROP POLICY IF EXISTS "Users can delete own interview rounds" ON "public"."interview_rounds";
CREATE POLICY "Users can delete own interview rounds"
ON "public"."interview_rounds"
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "public"."applications"
    WHERE "applications"."id" = "interview_rounds"."application_id"
      AND "applications"."user_id" = (auth.uid())::text
  )
);

-- Service role bypasses RLS automatically in Supabase, 
-- ensuring the Node.js backend using postgres connection or service role key has full access.
