import { z } from "zod";
import { UserRole } from "@/lib/auth/types";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.");

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Enter your full name (at least 2 characters).")
  .max(80, "Name must be 80 characters or fewer.")
  .refine((value) => !value.includes("@"), "Enter your name, not an email address.");

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9][0-9 ().-]{5,19}$/, "Enter a valid phone number.");

export const registerSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: passwordSchema,
  role: z.enum([UserRole.CLIENT, UserRole.PROFESSIONAL], {
    message: "Choose Client or Professional.",
  }),
  name: nameSchema,
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
