import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../db/database.types";
import type { GenerateFlashcardsCommand, GenerationLogsListResponseDTO, GenerationResponseDTO } from "../../types";
import { createOpenrouterService, OpenrouterError } from "./openrouter.service";

export class GenerationServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "GenerationServiceError";
  }
}

export class GenerationService {
  private supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  async generateFlashcards(userId: string, command: GenerateFlashcardsCommand): Promise<GenerationResponseDTO> {
    const openrouterService = createOpenrouterService();
    const sourceTextLength = command.source_text.length;

    // Create initial generation log entry
    const generationLogId = await this.createGenerationLog(userId, sourceTextLength);

    try {
      // Call OpenRouter API to generate flashcards
      const { flashcards, model } = await openrouterService.generateFlashcards(command.source_text);

      // Update generation log with results
      await this.updateGenerationLog(generationLogId, flashcards.length, model);

      return {
        generation_log_id: generationLogId,
        proposals: flashcards,
        model_used: model,
        generated_count: flashcards.length,
      };
    } catch (error) {
      // Update generation log to indicate failure (generated_count stays 0)
      await this.updateGenerationLogModel(generationLogId, "failed");

      if (error instanceof OpenrouterError) {
        throw new GenerationServiceError(error.message, error.statusCode);
      }
      throw new GenerationServiceError("Wystąpił nieoczekiwany błąd", 500);
    }
  }

  private async createGenerationLog(userId: string, sourceTextLength: number): Promise<string> {
    const { data, error } = await this.supabase
      .from("generation_logs")
      .insert({
        user_id: userId,
        source_text_length: sourceTextLength,
        model_used: "pending",
        generated_count: 0,
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new GenerationServiceError("Błąd serwera", 500);
    }

    return data.id;
  }

  private async updateGenerationLog(generationLogId: string, generatedCount: number, modelUsed: string): Promise<void> {
    const { error } = await this.supabase
      .from("generation_logs")
      .update({
        generated_count: generatedCount,
        model_used: modelUsed,
      })
      .eq("id", generationLogId);

    if (error) {
      console.error("Failed to update generation log:", error);
    }
  }

  private async updateGenerationLogModel(generationLogId: string, modelUsed: string): Promise<void> {
    const { error } = await this.supabase
      .from("generation_logs")
      .update({ model_used: modelUsed })
      .eq("id", generationLogId);

    if (error) {
      console.error("Failed to update generation log model:", error);
    }
  }

  async getGenerationLogs(page: number, limit: number): Promise<GenerationLogsListResponseDTO> {
    const offset = (page - 1) * limit;

    const { data, error, count } = await this.supabase
      .from("generation_logs")
      .select(
        "id, source_text_length, generated_count, accepted_unedited_count, accepted_edited_count, rejected_count, model_used, created_at",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new GenerationServiceError("Błąd serwera", 500);
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
}

export function createGenerationService(supabase: SupabaseClient<Database>): GenerationService {
  return new GenerationService(supabase);
}
