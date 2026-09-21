import { z } from "zod";

export const recordPaymentSchema = z.object({
  bookingId: z.string().trim().min(1, "Choose a booking."),
  claimedClientId: z.string().optional(),
  /// Ignored. Amount always comes from the accepted quote snapshot.
  amount: z.string().optional(),
});
