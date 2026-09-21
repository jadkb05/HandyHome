import { z } from "zod";

const ratingSchema = z.union([
  z.number().int().gte(1).lte(5),
  z
    .string()
    .trim()
    .regex(/^[1-5]$/, "Choose a rating from 1 to 5.")
    .transform((value) => Number(value)),
]);

export const createReviewSchema = z.object({
  bookingId: z.string().trim().min(1, "Choose a booking."),
  rating: ratingSchema,
  comment: z
    .string()
    .optional()
    .transform((value) => {
      const trimmed = value?.trim() ?? "";
      return trimmed.length === 0 ? null : trimmed;
    })
    .pipe(z.string().max(2000, "Review comments must be 2000 characters or fewer.").nullable()),
  claimedClientId: z.string().optional(),
});
