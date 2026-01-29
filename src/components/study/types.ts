import type { StudyCardDTO, StudySessionStatisticsDTO } from "@/types";

// =============================================================================
// Study Session ViewModel Types
// =============================================================================

/**
 * Status sesji nauki
 */
export type StudySessionStatus =
  | "idle" // Początkowy stan
  | "loading" // Trwa pobieranie sesji
  | "ready" // Sesja gotowa do rozpoczęcia
  | "studying" // Sesja w trakcie
  | "completed" // Sesja zakończona (wszystkie karty ocenione)
  | "interrupted" // Sesja przerwana przez użytkownika
  | "empty"; // Brak kart do nauki

/**
 * Stan wyświetlania fiszki
 */
export interface FlashcardDisplayState {
  isRevealed: boolean;
  isSubmitting: boolean;
}

/**
 * Postęp sesji
 */
export interface SessionProgress {
  currentIndex: number; // Indeks aktualnej karty (0-based)
  totalCards: number; // Łączna liczba kart w sesji
  answeredCount: number; // Liczba już ocenionych kart
  rememberedCount: number; // Liczba odpowiedzi "Pamiętam"
  forgottenCount: number; // Liczba odpowiedzi "Nie pamiętam"
}

/**
 * Podsumowanie sesji
 */
export interface SessionSummary {
  totalReviewed: number; // Łączna liczba ocenionych kart
  newCardsReviewed: number; // Liczba ocenionych nowych kart
  reviewCardsReviewed: number; // Liczba ocenionych powtórek
  rememberedCount: number; // Liczba "Pamiętam"
  forgottenCount: number; // Liczba "Nie pamiętam"
  successRate: number; // Procent "Pamiętam" (0-100)
}

/**
 * Pełny stan sesji (do hooka)
 */
export interface StudySessionState {
  status: StudySessionStatus;
  cards: StudyCardDTO[];
  statistics: StudySessionStatisticsDTO | null;
  progress: SessionProgress;
  currentCard: StudyCardDTO | null;
  flashcardDisplay: FlashcardDisplayState;
  summary: SessionSummary | null;
  error: string | null;
}

/**
 * Rekord odpowiedzi (do śledzenia w sesji)
 */
export interface AnswerRecord {
  flashcardId: string;
  isNew: boolean;
  remembered: boolean;
  timestamp: Date;
}

// =============================================================================
// Component Props Types
// =============================================================================

export interface StudyStartScreenProps {
  statistics: StudySessionStatisticsDTO;
  onStartSession: () => void;
  isLoading: boolean;
}

export interface StudyFlashcardProps {
  card: StudyCardDTO;
  isRevealed: boolean;
  onReveal: () => void;
  onAnswer: (remembered: boolean) => void;
  isSubmitting: boolean;
}

export interface AnswerButtonsProps {
  onAnswer: (remembered: boolean) => void;
  isSubmitting: boolean;
}

export interface StudyProgressProps {
  currentIndex: number;
  totalCards: number;
  rememberedCount: number;
  forgottenCount: number;
}

export interface StudySummaryProps {
  summary: SessionSummary;
  isInterrupted: boolean;
  onFinish: () => void;
}

export interface InterruptButtonProps {
  onInterrupt: () => void;
  isSubmitting: boolean;
}

export interface EmptyStateProps {
  hasAnyFlashcards: boolean;
}

// =============================================================================
// Hook Return Type
// =============================================================================

export interface UseStudySessionReturn {
  // Stan
  status: StudySessionStatus;
  statistics: StudySessionStatisticsDTO | null;
  currentCard: StudyCardDTO | null;
  progress: SessionProgress;
  isRevealed: boolean;
  isSubmitting: boolean;
  summary: SessionSummary | null;
  error: string | null;
  hasAnyFlashcards: boolean;

  // Akcje
  fetchSession: () => Promise<void>;
  startSession: () => void;
  revealCard: () => void;
  submitAnswer: (remembered: boolean) => Promise<void>;
  interruptSession: () => void;
  finishSession: () => void;
}

// =============================================================================
// Error Messages
// =============================================================================

export const errorMessages = {
  unauthorized: "Sesja wygasła. Zaloguj się ponownie.",
  networkError: "Błąd połączenia. Sprawdź internet i spróbuj ponownie.",
  serverError: "Błąd serwera. Spróbuj ponownie później.",
  flashcardNotFound: "Fiszka nie została znaleziona.",
  invalidReview: "Nieprawidłowe dane oceny.",
} as const;
