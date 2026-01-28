import { z } from "zod";

export const uuidSchema = z.string().uuid("Nieprawidłowy format identyfikatora");

export const flashcardsQuerySchema = z.object({
  page: z.coerce.number().int().min(1, "Parametr page musi być >= 1").default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1, "Parametr limit musi być >= 1")
    .max(100, "Parametr limit nie może przekraczać 100")
    .default(20),
  search: z.string().optional(),
  sort: z
    .enum(["created_at", "updated_at", "next_review_date"], {
      errorMap: () => ({
        message: "Parametr sort musi być jednym z: created_at, updated_at, next_review_date",
      }),
    })
    .default("created_at"),
  order: z
    .enum(["asc", "desc"], {
      errorMap: () => ({
        message: "Parametr order musi być jednym z: asc, desc",
      }),
    })
    .default("desc"),
});

export const createFlashcardSchema = z.object({
  front: z
    .string({ required_error: "Pole front jest wymagane" })
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, "Pole front nie może być puste"),
  back: z
    .string({ required_error: "Pole back jest wymagane" })
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, "Pole back nie może być puste"),
});

export const updateFlashcardSchema = z
  .object({
    front: z
      .string()
      .transform((val) => val.trim())
      .refine((val) => val.length > 0, "Pole front nie może być puste")
      .optional(),
    back: z
      .string()
      .transform((val) => val.trim())
      .refine((val) => val.length > 0, "Pole back nie może być puste")
      .optional(),
  })
  .refine((data) => data.front !== undefined || data.back !== undefined, {
    message: "Przynajmniej jedno pole (front lub back) musi być podane",
  });

const batchFlashcardItemSchema = z.object({
  front: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, "Pole front nie może być puste"),
  back: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, "Pole back nie może być puste"),
  original_front: z.string(),
  original_back: z.string(),
  is_edited: z.boolean(),
});

export const createFlashcardsBatchSchema = z.object({
  generation_log_id: z
    .string({ required_error: "Pole generation_log_id jest wymagane" })
    .uuid("Nieprawidłowy format generation_log_id"),
  flashcards: z.array(batchFlashcardItemSchema).min(1, "Tablica flashcards nie może być pusta"),
  rejected_count: z
    .number({ required_error: "Pole rejected_count jest wymagane" })
    .int()
    .min(0, "Pole rejected_count musi być >= 0"),
});

export type FlashcardsQueryInput = z.infer<typeof flashcardsQuerySchema>;
export type CreateFlashcardInput = z.infer<typeof createFlashcardSchema>;
export type UpdateFlashcardInput = z.infer<typeof updateFlashcardSchema>;
export type CreateFlashcardsBatchInput = z.infer<typeof createFlashcardsBatchSchema>;
