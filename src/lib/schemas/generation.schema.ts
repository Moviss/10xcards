import { z } from "zod";
import { containsDangerousContent } from "../services/prompt-security";

export const generateFlashcardsSchema = z.object({
  source_text: z
    .string({ required_error: "Pole source_text jest wymagane" })
    .min(1000, "Tekst źródłowy musi zawierać co najmniej 1000 znaków")
    .max(10000, "Tekst źródłowy nie może przekraczać 10000 znaków"),
});

export type GenerateFlashcardsInput = z.infer<typeof generateFlashcardsSchema>;

export const flashcardProposalSchema = z.object({
  front: z
    .string()
    .min(1, "Pytanie nie może być puste")
    .max(500, "Pytanie nie może przekraczać 500 znaków")
    .refine((s) => !containsDangerousContent(s), "Niedozwolona treść w pytaniu"),
  back: z
    .string()
    .min(1, "Odpowiedź nie może być pusta")
    .max(1000, "Odpowiedź nie może przekraczać 1000 znaków")
    .refine((s) => !containsDangerousContent(s), "Niedozwolona treść w odpowiedzi"),
});

export const parsedFlashcardsResponseSchema = z.object({
  flashcards: z.array(flashcardProposalSchema),
});

export type ParsedFlashcardsResponse = z.infer<typeof parsedFlashcardsResponseSchema>;

export const getGenerationLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1, "Parametr page musi być >= 1").default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1, "Parametr limit musi być >= 1")
    .max(100, "Parametr limit nie może przekraczać 100")
    .default(20),
});

export type GetGenerationLogsQuery = z.infer<typeof getGenerationLogsQuerySchema>;
