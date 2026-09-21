import { z } from "zod";

export const createQuoteSchema = z.object({
  bookingId: z.string().trim().min(1, "Choose a booking."),
  amount: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount.")
    .refine((value) => Number(value) > 0, "Enter an amount greater than 0.")
    .refine((value) => Number(value) <= 9_999_999_999.99, "That amount is too large."),
  notes: z
    .string()
    .trim()
    .min(1, "Add a short description.")
    .max(2000, "Quote notes must be 2000 characters or fewer."),
  claimedProviderId: z.string().optional(),
});

export const quoteDecisionSchema = z.object({
  quoteId: z.string().trim().min(1, "Choose a quote."),
  decision: z.enum(["accept", "decline"]),
  claimedClientId: z.string().optional(),
});
