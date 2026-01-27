-- Migration: disable_rls_policies
-- Description: Disable all RLS policies on flashcards and generation_logs tables
--
-- WARNING: This migration removes security policies from the database.
-- After this migration, RLS will still be enabled on tables but no policies
-- will be in place, effectively blocking all access until new policies are created.
--
-- Tables affected: flashcards, generation_logs
-- Policies dropped:
--   - flashcards: flashcards_select_policy, flashcards_insert_policy,
--                 flashcards_update_policy, flashcards_delete_policy
--   - generation_logs: generation_logs_select_policy, generation_logs_insert_policy

-- ============================================================================
-- DROP FLASHCARDS POLICIES
-- ============================================================================

-- Drop SELECT policy for flashcards
-- Previously allowed: authenticated users could read their own flashcards
drop policy if exists flashcards_select_policy on flashcards;

-- Drop INSERT policy for flashcards
-- Previously allowed: authenticated users could create flashcards for themselves
drop policy if exists flashcards_insert_policy on flashcards;

-- Drop UPDATE policy for flashcards
-- Previously allowed: authenticated users could modify their own flashcards
drop policy if exists flashcards_update_policy on flashcards;

-- Drop DELETE policy for flashcards
-- Previously allowed: authenticated users could delete their own flashcards
drop policy if exists flashcards_delete_policy on flashcards;

-- ============================================================================
-- DROP GENERATION_LOGS POLICIES
-- ============================================================================

-- Drop SELECT policy for generation_logs
-- Previously allowed: authenticated users could view their own generation logs
drop policy if exists generation_logs_select_policy on generation_logs;

-- Drop INSERT policy for generation_logs
-- Previously allowed: authenticated users could create logs for themselves
drop policy if exists generation_logs_insert_policy on generation_logs;
