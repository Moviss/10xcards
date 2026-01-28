-- Migration: restore_rls_policies
-- Description: Restore RLS policies for flashcards and generation_logs tables
--
-- This migration recreates the Row Level Security policies that were removed
-- in the previous migration (20260127134220_disable_rls_policies.sql).
--
-- Tables affected: flashcards, generation_logs
-- Policies created:
--   - flashcards: select, insert, update, delete (for authenticated users)
--   - generation_logs: select, insert, update (for authenticated users)
--
-- Note: Added UPDATE policy for generation_logs which was missing in the original
-- schema. This is required for updating generated_count after AI generation.

-- ============================================================================
-- GENERATION_LOGS POLICIES
-- ============================================================================

-- SELECT policy: Users can only view their own generation logs
-- Rationale: Generation history is personal and contains usage metrics
create policy generation_logs_select_policy on generation_logs
    for select
    to authenticated
    using (auth.uid() = user_id);

-- INSERT policy: Users can only create logs for themselves
-- Rationale: Ensures accurate attribution of AI generation sessions
create policy generation_logs_insert_policy on generation_logs
    for insert
    to authenticated
    with check (auth.uid() = user_id);

-- UPDATE policy: Users can only update their own generation logs
-- Rationale: Required for updating generated_count after AI generation completes
-- Note: This policy was not present in the original schema but is needed
-- for the generation workflow to function correctly
create policy generation_logs_update_policy on generation_logs
    for update
    to authenticated
    using (auth.uid() = user_id);

-- ============================================================================
-- FLASHCARDS POLICIES
-- ============================================================================

-- SELECT policy: Users can only read their own flashcards
-- Rationale: Flashcard content is personal learning material
create policy flashcards_select_policy on flashcards
    for select
    to authenticated
    using (auth.uid() = user_id);

-- INSERT policy: Users can only create flashcards for themselves
-- Rationale: Prevents data injection into other users' accounts
create policy flashcards_insert_policy on flashcards
    for insert
    to authenticated
    with check (auth.uid() = user_id);

-- UPDATE policy: Users can only modify their own flashcards
-- Rationale: Protects flashcard content and SM-2 parameters from tampering
create policy flashcards_update_policy on flashcards
    for update
    to authenticated
    using (auth.uid() = user_id);

-- DELETE policy: Users can only delete their own flashcards
-- Rationale: Prevents malicious deletion of other users' learning data
create policy flashcards_delete_policy on flashcards
    for delete
    to authenticated
    using (auth.uid() = user_id);
