import { z } from "zod";

export const createBookingInputSchema = z.object({
  providerId: z.string().trim().min(1, "Choose a professional."),
  serviceId: z.string().trim().min(1, "Choose a service."),
  scheduledAt: z.string().trim().min(1, "Choose an appointment time."),
  claimedClientId: z.string().optional(),
});

export const bookingDecisionSchema = z.object({
  bookingId: z.string().trim().min(1, "Choose a booking."),
  decision: z.enum(["accept", "reject"]),
  claimedProviderId: z.string().optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingInputSchema>;
export type BookingDecisionInput = z.infer<typeof bookingDecisionSchema>;
