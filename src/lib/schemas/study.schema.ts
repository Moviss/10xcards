import { z } from "zod";

/**
 * Schema walidacji dla POST /api/study/review
 */
export const submitReviewSchema = z.object({
  flashcard_id: z
    .string({
      required_error: "flashcard_id jest wymagane",
      invalid_type_error: "flashcard_id musi być tekstem",
    })
    .uuid({
      message: "flashcard_id musi być prawidłowym UUID",
    }),
  remembered: z.boolean({
    required_error: "remembered jest wymagane",
    invalid_type_error: "remembered musi być wartością boolean",
  }),
});

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;
