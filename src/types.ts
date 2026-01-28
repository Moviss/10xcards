import type { Database } from "./db/database.types";

// =============================================================================
// Base Types - derived from database schema
// =============================================================================

/**
 * Base flashcard type from database Row
 */
type FlashcardRow = Database["public"]["Tables"]["flashcards"]["Row"];

/**
 * Base generation log type from database Row
 */
type GenerationLogRow = Database["public"]["Tables"]["generation_logs"]["Row"];

// =============================================================================
// Pagination Types
// =============================================================================

/**
 * Pagination metadata included in paginated responses
 */
export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

/**
 * Query parameters for paginated requests
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// =============================================================================
// Flashcard DTOs
// =============================================================================

/**
 * Flashcard DTO for list view (GET /api/flashcards)
 * Excludes original_front, original_back, and generation_log_id for brevity
 */
export type FlashcardListItemDTO = Pick<
  FlashcardRow,
  | "id"
  | "front"
  | "back"
  | "is_ai_generated"
  | "interval"
  | "ease_factor"
  | "repetitions"
  | "next_review_date"
  | "last_reviewed_at"
  | "created_at"
  | "updated_at"
>;

/**
 * Full flashcard DTO (GET /api/flashcards/:id)
 * Includes all fields including original content and generation reference
 */
export type FlashcardDetailDTO = Pick<
  FlashcardRow,
  | "id"
  | "front"
  | "back"
  | "original_front"
  | "original_back"
  | "is_ai_generated"
  | "generation_log_id"
  | "interval"
  | "ease_factor"
  | "repetitions"
  | "next_review_date"
  | "last_reviewed_at"
  | "created_at"
  | "updated_at"
>;

/**
 * Flashcard DTO returned after creation (POST /api/flashcards)
 */
export type FlashcardCreateResponseDTO = Pick<
  FlashcardRow,
  | "id"
  | "front"
  | "back"
  | "is_ai_generated"
  | "interval"
  | "ease_factor"
  | "repetitions"
  | "next_review_date"
  | "last_reviewed_at"
  | "created_at"
  | "updated_at"
>;

/**
 * Flashcard DTO returned after update (PUT /api/flashcards/:id)
 */
export type FlashcardUpdateResponseDTO = Pick<FlashcardRow, "id" | "front" | "back" | "is_ai_generated" | "updated_at">;

/**
 * Flashcard DTO for batch create response (POST /api/flashcards/batch)
 */
export type FlashcardBatchItemDTO = Pick<FlashcardRow, "id" | "front" | "back" | "is_ai_generated" | "created_at">;

/**
 * Flashcard DTO for progress reset response (POST /api/flashcards/:id/reset-progress)
 */
export interface FlashcardResetProgressResponseDTO {
  id: FlashcardRow["id"];
  interval: FlashcardRow["interval"];
  ease_factor: FlashcardRow["ease_factor"];
  repetitions: FlashcardRow["repetitions"];
  next_review_date: FlashcardRow["next_review_date"];
  last_reviewed_at: FlashcardRow["last_reviewed_at"];
  message: string;
}

/**
 * Paginated flashcards response (GET /api/flashcards)
 */
export interface FlashcardsListResponseDTO {
  data: FlashcardListItemDTO[];
  pagination: PaginationDTO;
}

// =============================================================================
// Flashcard Command Models (Request Bodies)
// =============================================================================

/**
 * Command for creating a single flashcard (POST /api/flashcards)
 */
export interface CreateFlashcardCommand {
  front: string;
  back: string;
}

/**
 * Command for updating a flashcard (PUT /api/flashcards/:id)
 * Both fields are optional but at least one should be provided
 */
export interface UpdateFlashcardCommand {
  front?: string;
  back?: string;
}

/**
 * Single flashcard item in batch create command
 */
export interface BatchFlashcardItem {
  front: string;
  back: string;
  original_front: string;
  original_back: string;
  is_edited: boolean;
}

/**
 * Command for batch creating flashcards from AI generation (POST /api/flashcards/batch)
 */
export interface CreateFlashcardsBatchCommand {
  generation_log_id: string;
  flashcards: BatchFlashcardItem[];
  rejected_count: number;
}

/**
 * Response for batch flashcard creation (POST /api/flashcards/batch)
 */
export interface FlashcardsBatchResponseDTO {
  created_count: number;
  flashcards: FlashcardBatchItemDTO[];
}

// =============================================================================
// Flashcard Query Parameters
// =============================================================================

/**
 * Query parameters for GET /api/flashcards
 */
export interface FlashcardsQueryParams extends PaginationParams {
  search?: string;
  sort?: "created_at" | "updated_at" | "next_review_date";
  order?: "asc" | "desc";
}

// =============================================================================
// Study Session DTOs
// =============================================================================

/**
 * Flashcard DTO for study session (GET /api/study/session)
 */
export interface StudyCardDTO {
  id: FlashcardRow["id"];
  front: FlashcardRow["front"];
  back: FlashcardRow["back"];
  is_new: boolean;
}

/**
 * Study session statistics
 */
export interface StudySessionStatisticsDTO {
  total_cards: number;
  new_cards: number;
  review_cards: number;
}

/**
 * Full study session response (GET /api/study/session)
 */
export interface StudySessionResponseDTO {
  cards: StudyCardDTO[];
  statistics: StudySessionStatisticsDTO;
}

/**
 * Review result DTO (POST /api/study/review)
 */
export interface StudyReviewResponseDTO {
  flashcard_id: FlashcardRow["id"];
  interval: FlashcardRow["interval"];
  ease_factor: FlashcardRow["ease_factor"];
  repetitions: FlashcardRow["repetitions"];
  next_review_date: FlashcardRow["next_review_date"];
  last_reviewed_at: FlashcardRow["last_reviewed_at"];
}

// =============================================================================
// Study Session Command Models
// =============================================================================

/**
 * Command for submitting a flashcard review (POST /api/study/review)
 */
export interface SubmitReviewCommand {
  flashcard_id: string;
  remembered: boolean;
}

// =============================================================================
// AI Generation DTOs
// =============================================================================

/**
 * AI-generated flashcard proposal (returned from POST /api/generations)
 */
export interface FlashcardProposalDTO {
  front: string;
  back: string;
}

/**
 * Response for AI generation (POST /api/generations)
 */
export interface GenerationResponseDTO {
  generation_log_id: GenerationLogRow["id"];
  proposals: FlashcardProposalDTO[];
  model_used: GenerationLogRow["model_used"];
  generated_count: GenerationLogRow["generated_count"];
}

/**
 * Generation log DTO for list view (GET /api/generations)
 */
export type GenerationLogDTO = Pick<
  GenerationLogRow,
  | "id"
  | "source_text_length"
  | "generated_count"
  | "accepted_unedited_count"
  | "accepted_edited_count"
  | "rejected_count"
  | "model_used"
  | "created_at"
>;

/**
 * Paginated generation logs response (GET /api/generations)
 */
export interface GenerationLogsListResponseDTO {
  data: GenerationLogDTO[];
  pagination: PaginationDTO;
}

// =============================================================================
// AI Generation Command Models
// =============================================================================

/**
 * Command for generating flashcards from text (POST /api/generations)
 */
export interface GenerateFlashcardsCommand {
  source_text: string;
}

// =============================================================================
// Authentication DTOs
// =============================================================================

/**
 * User DTO for registration response
 */
export interface UserDTO {
  id: string;
  email: string;
  created_at?: string;
}

/**
 * Session DTO included in auth responses
 */
export interface SessionDTO {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

/**
 * Auth response for registration (POST /api/auth/register)
 */
export interface AuthRegisterResponseDTO {
  user: UserDTO & { created_at: string };
  session: SessionDTO;
}

/**
 * Auth response for login (POST /api/auth/login)
 */
export interface AuthLoginResponseDTO {
  user: Omit<UserDTO, "created_at">;
  session: SessionDTO;
}

// =============================================================================
// Authentication Command Models
// =============================================================================

/**
 * Command for user registration (POST /api/auth/register)
 */
export interface RegisterCommand {
  email: string;
  password: string;
}

/**
 * Command for user login (POST /api/auth/login)
 */
export interface LoginCommand {
  email: string;
  password: string;
}

// =============================================================================
// Common Response DTOs
// =============================================================================

/**
 * Generic message response (used for logout, delete operations, etc.)
 */
export interface MessageResponseDTO {
  message: string;
}
