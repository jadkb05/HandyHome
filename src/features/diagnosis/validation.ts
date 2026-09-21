import { z } from "zod";

export const startDiagnosisSchema = z.object({
  bookingId: z.string().trim().min(1, "Choose a booking."),
  claimedProviderId: z.string().optional(),
});

export const completeDiagnosisSchema = z.object({
  bookingId: z.string().trim().min(1, "Choose a booking."),
  findings: z
    .string()
    .trim()
    .min(8, "Enter the diagnosis findings.")
    .max(2000, "Diagnosis findings must be 2000 characters or fewer."),
  claimedProviderId: z.string().optional(),
});
