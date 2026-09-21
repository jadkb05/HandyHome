import { z } from "zod";
import { PROFILE_PLACEHOLDER } from "@/features/professionals/completeness";

const notPlaceholder = (value: string) => value !== PROFILE_PLACEHOLDER;

export const providerProfileSchema = z.object({
  profession: z
    .string()
    .trim()
    .min(2, "Enter your profession (at least 2 characters).")
    .max(80, "Profession must be 80 characters or fewer.")
    .refine(notPlaceholder, "Enter your profession."),
  description: z
    .string()
    .trim()
    .max(500, "Description must be 500 characters or fewer.")
    .optional()
    .or(z.literal("")),
  city: z
    .string()
    .trim()
    .min(2, "Enter your city (at least 2 characters).")
    .max(80, "City must be 80 characters or fewer.")
    .refine(notPlaceholder, "Enter your city."),
  /** When provided, replaces the services the professional offers. */
  serviceIds: z
    .array(z.string().trim().min(1))
    .min(1, "Choose at least one service.")
    .max(30, "Choose fewer services.")
    .optional(),
  claimedProviderId: z.string().optional(),
  claimedOwnerId: z.string().optional(),
});

export type ProviderProfileInput = z.infer<typeof providerProfileSchema>;
