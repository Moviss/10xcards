import { z } from "zod";

export const generateFlashcardsSchema = z.object({
  source_text: z
    .string({ required_error: "Pole source_text jest wymagane" })
    .min(1000, "Tekst źródłowy musi zawierać co najmniej 1000 znaków")
    .max(10000, "Tekst źródłowy nie może przekraczać 10000 znaków"),
});

export type GenerateFlashcardsInput = z.infer<typeof generateFlashcardsSchema>;

export const flashcardProposalSchema = z.object({
  front: z.string().min(1, "Pytanie nie może być puste"),
  back: z.string().min(1, "Odpowiedź nie może być pusta"),
});

export const parsedFlashcardsResponseSchema = z.object({
  flashcards: z.array(flashcardProposalSchema),
});

export type ParsedFlashcardsResponse = z.infer<typeof parsedFlashcardsResponseSchema>;
