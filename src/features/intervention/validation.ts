import { z } from "zod";

export const startInterventionSchema = z.object({
  bookingId: z.string().trim().min(1, "Choose a booking."),
  claimedProviderId: z.string().optional(),
});

export const completeInterventionSchema = z.object({
  bookingId: z.string().trim().min(1, "Choose a booking."),
  claimedProviderId: z.string().optional(),
});
