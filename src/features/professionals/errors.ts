import { ZodError } from "zod";
import { ForbiddenError, UnauthorizedError } from "@/lib/auth/errors";

export type ProfileField = "profession" | "city" | "description" | "services";
export type ProfileFieldErrors = Partial<Record<ProfileField, string>>;

export class ProfileValidationError extends Error {
  readonly fieldErrors: ProfileFieldErrors;
  constructor(fieldErrors: ProfileFieldErrors) {
    super(Object.values(fieldErrors)[0] ?? "Check the highlighted fields.");
    this.name = "ProfileValidationError";
    this.fieldErrors = fieldErrors;
  }
}

export function fieldErrorsFromZod(error: ZodError): ProfileFieldErrors {
  const result: ProfileFieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    const field: ProfileField | null =
      key === "profession" || key === "city" || key === "description"
        ? key
        : key === "serviceIds"
          ? "services"
          : null;
    if (field && !result[field]) {
      result[field] = issue.message;
    }
  }
  return result;
}

export type PublicProfileError = { message: string; fieldErrors: ProfileFieldErrors };

/** Never returns raw Zod, Prisma or internal error text. */
export function publicProfileError(error: unknown): PublicProfileError {
  if (error instanceof ProfileValidationError) {
    return { message: error.message, fieldErrors: error.fieldErrors };
  }
  if (error instanceof UnauthorizedError) {
    return { message: "Sign in to edit your profile.", fieldErrors: {} };
  }
  if (error instanceof ForbiddenError) {
    return { message: "Only the professional who owns this profile can edit it.", fieldErrors: {} };
  }
  return { message: "The profile could not be saved. Try again.", fieldErrors: {} };
}
