-- Migration: create_flashcards_schema
-- Description: Initial database schema for 10xCards application
--
-- This migration creates:
--   - pg_trgm extension for full-text search capabilities
--   - generation_logs table for AI generation session tracking
--   - flashcards table with SM-2 algorithm parameters
--   - All necessary indexes for performance optimization
--   - Row Level Security (RLS) policies for data isolation
--   - Trigger for automatic updated_at timestamp management
--
-- Tables affected: generation_logs, flashcards
-- Dependencies: auth.users (Supabase Auth)

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

-- Enable pg_trgm extension for trigram-based full-text search
-- This allows efficient LIKE '%query%' searches on flashcard content
create extension if not exists pg_trgm;

-- ============================================================================
-- TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: generation_logs
-- Purpose: Track AI generation sessions for analytics and metrics calculation
-- Note: Created first because flashcards table references it via FK
-- ----------------------------------------------------------------------------
create table generation_logs (
    -- Primary identifier
    id uuid primary key default gen_random_uuid(),

    -- User ownership - cascade delete ensures logs are removed when user is deleted
    user_id uuid not null references auth.users(id) on delete cascade,

    -- Generation session metrics
    source_text_length integer not null,                    -- Length of input text in characters
    generated_count integer not null default 0,             -- Number of flashcard proposals generated
    accepted_unedited_count integer not null default 0,     -- Accepted without modifications
    accepted_edited_count integer not null default 0,       -- Accepted after user edits
    rejected_count integer not null default 0,              -- Rejected by user

    -- AI model information
    model_used varchar(100) not null,                       -- e.g., 'gpt-4o-mini'

    -- Timestamp
    created_at timestamptz not null default now()
);

-- Add comment for documentation
comment on table generation_logs is 'Stores AI generation session logs for analytics and AI Acceptance Rate calculation';

-- ----------------------------------------------------------------------------
-- Table: flashcards
-- Purpose: Main table storing user flashcards with SM-2 spaced repetition data
-- ----------------------------------------------------------------------------
create table flashcards (
    -- Primary identifier
    id uuid primary key default gen_random_uuid(),

    -- User ownership - cascade delete ensures flashcards are removed when user is deleted
    user_id uuid not null references auth.users(id) on delete cascade,

    -- Flashcard content with non-empty validation
    front text not null check (char_length(trim(front)) > 0),  -- Question side
    back text not null check (char_length(trim(back)) > 0),    -- Answer side

    -- AI generation tracking
    -- These columns store original AI-generated content for comparison after user edits
    original_front text null,                               -- Original AI question (null if manually created or not edited)
    original_back text null,                                -- Original AI answer (null if manually created or not edited)
    is_ai_generated boolean not null default false,         -- Flag indicating AI origin
    generation_log_id uuid null references generation_logs(id) on delete set null, -- Link to generation session

    -- SM-2 Algorithm parameters
    -- See: https://en.wikipedia.org/wiki/SuperMemo#Description_of_SM-2_algorithm
    interval integer not null default 0,                    -- Days until next review
    ease_factor decimal(3,2) not null default 2.5,          -- Difficulty multiplier (typically 1.3-2.5)
    repetitions integer not null default 0,                 -- Consecutive successful reviews
    next_review_date date not null default current_date,    -- Scheduled review date
    last_reviewed_at timestamptz null,                      -- Last review timestamp (null = never reviewed = new card)

    -- Timestamps
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Add comments for documentation
comment on table flashcards is 'Main table storing user flashcards with SM-2 spaced repetition algorithm parameters';
comment on column flashcards.original_front is 'Original AI-generated question before user edits (null if manually created)';
comment on column flashcards.original_back is 'Original AI-generated answer before user edits (null if manually created)';
comment on column flashcards.last_reviewed_at is 'Null indicates a new card that has never been reviewed';
comment on column flashcards.ease_factor is 'SM-2 ease factor, typically ranges from 1.30 to 2.50';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Indexes for flashcards table
-- ----------------------------------------------------------------------------

-- Primary index for RLS policy evaluation and user filtering
create index idx_flashcards_user_id on flashcards(user_id);

-- Composite index for study session queries
-- Optimizes: SELECT * FROM flashcards WHERE user_id = ? AND next_review_date <= ?
create index idx_flashcards_user_next_review on flashcards(user_id, next_review_date);

-- Trigram indexes for full-text search on flashcard content
-- Enables efficient ILIKE '%search_term%' queries
create index idx_flashcards_front_trgm on flashcards using gin (front gin_trgm_ops);
create index idx_flashcards_back_trgm on flashcards using gin (back gin_trgm_ops);

-- ----------------------------------------------------------------------------
-- Indexes for generation_logs table
-- ----------------------------------------------------------------------------

-- Index for user filtering
create index idx_generation_logs_user_id on generation_logs(user_id);

-- Index for date-based sorting and filtering
create index idx_generation_logs_created_at on generation_logs(created_at);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: update_updated_at_column
-- Purpose: Automatically update the updated_at timestamp on row modification
-- ----------------------------------------------------------------------------
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

comment on function update_updated_at_column() is 'Trigger function to automatically update updated_at timestamp';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Automatically update updated_at on flashcards modification
create trigger trigger_flashcards_updated_at
    before update on flashcards
    for each row
    execute function update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
-- This ensures that even if policies are misconfigured, no data is exposed by default
alter table flashcards enable row level security;
alter table generation_logs enable row level security;

-- ----------------------------------------------------------------------------
-- RLS Policies for flashcards table
-- All policies enforce strict user isolation - users can only access their own data
-- ----------------------------------------------------------------------------

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

-- ----------------------------------------------------------------------------
-- RLS Policies for generation_logs table
-- Users can only view and create their own generation logs
-- Note: No update/delete policies as logs are append-only for audit purposes
-- ----------------------------------------------------------------------------

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
