import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../db/database.types";
import type {
  CreateFlashcardCommand,
  CreateFlashcardsBatchCommand,
  FlashcardCreateResponseDTO,
  FlashcardDetailDTO,
  FlashcardResetProgressResponseDTO,
  FlashcardsBatchResponseDTO,
  FlashcardsListResponseDTO,
  FlashcardUpdateResponseDTO,
  UpdateFlashcardCommand,
} from "../../types";
import type { FlashcardsQueryInput } from "../schemas/flashcard.schema";

export class FlashcardServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "FlashcardServiceError";
  }
}

export class FlashcardService {
  private supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  async getFlashcards(params: FlashcardsQueryInput): Promise<FlashcardsListResponseDTO> {
    const { page, limit, search, sort, order } = params;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from("flashcards")
      .select(
        "id, front, back, is_ai_generated, interval, ease_factor, repetitions, next_review_date, last_reviewed_at, created_at, updated_at",
        { count: "exact" }
      );

    if (search) {
      query = query.or(`front.ilike.%${search}%,back.ilike.%${search}%`);
    }

    query = query.order(sort, { ascending: order === "asc" }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new FlashcardServiceError("Błąd serwera", 500);
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data: data ?? [],
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    };
  }

  async getFlashcardById(id: string): Promise<FlashcardDetailDTO | null> {
    const { data, error } = await this.supabase
      .from("flashcards")
      .select(
        "id, front, back, original_front, original_back, is_ai_generated, generation_log_id, interval, ease_factor, repetitions, next_review_date, last_reviewed_at, created_at, updated_at"
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new FlashcardServiceError("Błąd serwera", 500);
    }

    return data;
  }

  async createFlashcard(userId: string, command: CreateFlashcardCommand): Promise<FlashcardCreateResponseDTO> {
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await this.supabase
      .from("flashcards")
      .insert({
        user_id: userId,
        front: command.front,
        back: command.back,
        is_ai_generated: false,
        interval: 0,
        ease_factor: 2.5,
        repetitions: 0,
        next_review_date: today,
      })
      .select(
        "id, front, back, is_ai_generated, interval, ease_factor, repetitions, next_review_date, last_reviewed_at, created_at, updated_at"
      )
      .single();

    if (error || !data) {
      throw new FlashcardServiceError("Błąd serwera", 500);
    }

    return data;
  }

  async createFlashcardsBatch(
    userId: string,
    command: CreateFlashcardsBatchCommand
  ): Promise<FlashcardsBatchResponseDTO> {
    const { generation_log_id, flashcards, rejected_count } = command;

    const { data: generationLog, error: logError } = await this.supabase
      .from("generation_logs")
      .select("id")
      .eq("id", generation_log_id)
      .single();

    if (logError || !generationLog) {
      throw new FlashcardServiceError("Generation log not found", 404);
    }

    const today = new Date().toISOString().split("T")[0];

    const flashcardsToInsert = flashcards.map((fc) => ({
      user_id: userId,
      front: fc.front,
      back: fc.back,
      original_front: fc.original_front,
      original_back: fc.original_back,
      is_ai_generated: true,
      generation_log_id,
      interval: 0,
      ease_factor: 2.5,
      repetitions: 0,
      next_review_date: today,
    }));

    const { data: insertedFlashcards, error: insertError } = await this.supabase
      .from("flashcards")
      .insert(flashcardsToInsert)
      .select("id, front, back, is_ai_generated, created_at");

    if (insertError || !insertedFlashcards) {
      throw new FlashcardServiceError("Błąd serwera", 500);
    }

    const acceptedUnedited = flashcards.filter((fc) => !fc.is_edited).length;
    const acceptedEdited = flashcards.filter((fc) => fc.is_edited).length;

    const { error: updateError } = await this.supabase
      .from("generation_logs")
      .update({
        accepted_unedited_count: acceptedUnedited,
        accepted_edited_count: acceptedEdited,
        rejected_count,
      })
      .eq("id", generation_log_id);

    if (updateError) {
      console.error("Failed to update generation log:", updateError);
    }

    return {
      created_count: insertedFlashcards.length,
      flashcards: insertedFlashcards,
    };
  }

  async updateFlashcard(id: string, command: UpdateFlashcardCommand): Promise<FlashcardUpdateResponseDTO | null> {
    const updateData: { front?: string; back?: string } = {};
    if (command.front !== undefined) {
      updateData.front = command.front;
    }
    if (command.back !== undefined) {
      updateData.back = command.back;
    }

    const { data, error } = await this.supabase
      .from("flashcards")
      .update(updateData)
      .eq("id", id)
      .select("id, front, back, is_ai_generated, updated_at")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new FlashcardServiceError("Błąd serwera", 500);
    }

    return data;
  }

  async deleteFlashcard(id: string): Promise<boolean> {
    const { error, count } = await this.supabase.from("flashcards").delete({ count: "exact" }).eq("id", id);

    if (error) {
      throw new FlashcardServiceError("Błąd serwera", 500);
    }

    return (count ?? 0) > 0;
  }

  async resetProgress(id: string): Promise<FlashcardResetProgressResponseDTO | null> {
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await this.supabase
      .from("flashcards")
      .update({
        interval: 0,
        ease_factor: 2.5,
        repetitions: 0,
        next_review_date: today,
        last_reviewed_at: null,
      })
      .eq("id", id)
      .select("id, interval, ease_factor, repetitions, next_review_date, last_reviewed_at")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new FlashcardServiceError("Błąd serwera", 500);
    }

    return {
      ...data,
      message: "Learning progress reset successfully",
    };
  }
}

export function createFlashcardService(supabase: SupabaseClient<Database>): FlashcardService {
  return new FlashcardService(supabase);
}
