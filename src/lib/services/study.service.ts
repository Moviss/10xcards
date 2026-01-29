import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../db/database.types";
import type { StudyCardDTO, StudyReviewResponseDTO, StudySessionResponseDTO, SubmitReviewCommand } from "../../types";

export class StudyServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "StudyServiceError";
  }
}

interface SM2Parameters {
  interval: number;
  ease_factor: number;
  repetitions: number;
}

export class StudyService {
  private supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  async getStudySession(userId: string): Promise<StudySessionResponseDTO> {
    const today = new Date().toISOString().split("T")[0];

    // Pobierz karty do powtórki (last_reviewed_at IS NOT NULL AND next_review_date <= today)
    const { data: reviewCards, error: reviewError } = await this.supabase
      .from("flashcards")
      .select("id, front, back")
      .eq("user_id", userId)
      .not("last_reviewed_at", "is", null)
      .lte("next_review_date", today);

    if (reviewError) {
      throw new StudyServiceError("Błąd serwera", 500);
    }

    // Pobierz nowe karty (last_reviewed_at IS NULL, limit 20)
    const { data: newCards, error: newError } = await this.supabase
      .from("flashcards")
      .select("id, front, back")
      .eq("user_id", userId)
      .is("last_reviewed_at", null)
      .limit(20);

    if (newError) {
      throw new StudyServiceError("Błąd serwera", 500);
    }

    // Mapowanie na StudyCardDTO z ustawieniem is_new
    const reviewCardsDTO: StudyCardDTO[] = (reviewCards ?? []).map((card) => ({
      id: card.id,
      front: card.front,
      back: card.back,
      is_new: false,
    }));

    const newCardsDTO: StudyCardDTO[] = (newCards ?? []).map((card) => ({
      id: card.id,
      front: card.front,
      back: card.back,
      is_new: true,
    }));

    // Połącz karty: najpierw powtórki, potem nowe
    const allCards = [...reviewCardsDTO, ...newCardsDTO];

    return {
      cards: allCards,
      statistics: {
        total_cards: allCards.length,
        new_cards: newCardsDTO.length,
        review_cards: reviewCardsDTO.length,
      },
    };
  }

  async submitReview(userId: string, command: SubmitReviewCommand): Promise<StudyReviewResponseDTO> {
    const { flashcard_id, remembered } = command;

    // Pobierz fiszkę i sprawdź czy należy do użytkownika
    const { data: flashcard, error: fetchError } = await this.supabase
      .from("flashcards")
      .select("id, interval, ease_factor, repetitions")
      .eq("id", flashcard_id)
      .eq("user_id", userId)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        throw new StudyServiceError("Fiszka nie została znaleziona", 404);
      }
      throw new StudyServiceError("Błąd serwera", 500);
    }

    if (!flashcard) {
      throw new StudyServiceError("Fiszka nie została znaleziona", 404);
    }

    // Oblicz nowe parametry SM-2
    const currentParams: SM2Parameters = {
      interval: flashcard.interval,
      ease_factor: flashcard.ease_factor,
      repetitions: flashcard.repetitions,
    };

    const newParams = this.calculateSM2Parameters(currentParams, remembered);

    // Oblicz next_review_date
    const today = new Date();
    const nextReviewDate = new Date(today);
    nextReviewDate.setDate(today.getDate() + newParams.interval);
    const nextReviewDateStr = nextReviewDate.toISOString().split("T")[0];
    const lastReviewedAt = today.toISOString();

    // Aktualizuj fiszkę
    const { data: updatedFlashcard, error: updateError } = await this.supabase
      .from("flashcards")
      .update({
        interval: newParams.interval,
        ease_factor: newParams.ease_factor,
        repetitions: newParams.repetitions,
        next_review_date: nextReviewDateStr,
        last_reviewed_at: lastReviewedAt,
      })
      .eq("id", flashcard_id)
      .eq("user_id", userId)
      .select("id, interval, ease_factor, repetitions, next_review_date, last_reviewed_at")
      .single();

    if (updateError || !updatedFlashcard) {
      throw new StudyServiceError("Błąd serwera", 500);
    }

    return {
      flashcard_id: updatedFlashcard.id,
      interval: updatedFlashcard.interval,
      ease_factor: updatedFlashcard.ease_factor,
      repetitions: updatedFlashcard.repetitions,
      next_review_date: updatedFlashcard.next_review_date,
      last_reviewed_at: updatedFlashcard.last_reviewed_at,
    };
  }

  private calculateSM2Parameters(current: SM2Parameters, remembered: boolean): SM2Parameters {
    if (remembered) {
      // Użytkownik zapamiętał
      let newInterval: number;
      if (current.repetitions === 0) {
        newInterval = 1;
      } else if (current.repetitions === 1) {
        newInterval = 6;
      } else {
        newInterval = Math.round(current.interval * current.ease_factor);
      }

      return {
        interval: newInterval,
        ease_factor: Math.max(2.5, current.ease_factor + 0.1),
        repetitions: current.repetitions + 1,
      };
    }

    // Użytkownik nie zapamiętał
    return {
      interval: 1,
      ease_factor: Math.max(1.3, current.ease_factor - 0.2),
      repetitions: 0,
    };
  }
}

export function createStudyService(supabase: SupabaseClient<Database>): StudyService {
  return new StudyService(supabase);
}
