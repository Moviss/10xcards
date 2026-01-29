/**
 * Proposal status in Staging Area
 */
export type ProposalStatus = "pending" | "accepted" | "rejected";

/**
 * ViewModel for a single flashcard proposal in Staging Area
 */
export interface ProposalViewModel {
  id: string;
  front: string;
  back: string;
  originalFront: string;
  originalBack: string;
  status: ProposalStatus;
  isEdited: boolean;
}

/**
 * Generator state persisted in localStorage
 */
export interface GeneratorState {
  sourceText: string;
  generationLogId: string | null;
  proposals: ProposalViewModel[];
}

/**
 * Generator form errors
 */
export interface GeneratorErrors {
  sourceText?: string;
  generation?: string;
  save?: string;
}

/**
 * Generator configuration constants
 */
export const GENERATOR_CONFIG = {
  MIN_SOURCE_TEXT_LENGTH: 1000,
  MAX_SOURCE_TEXT_LENGTH: 10000,
  LOCAL_STORAGE_KEY: "10xcards_generator_state",
} as const;
