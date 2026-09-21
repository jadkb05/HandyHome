import { ForbiddenError, UnauthorizedError } from "@/lib/auth/errors";
import { BookingError } from "@/features/bookings/errors";

export type InterventionErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN_ROLE"
  | "BOOKING_NOT_FOUND"
  | "QUOTE_NOT_ACCEPTED"
  | "ILLEGAL_TRANSITION";

export class InterventionError extends Error {
  readonly code: InterventionErrorCode;

  constructor(code: InterventionErrorCode, message: string) {
    super(message);
    this.name = "InterventionError";
    this.code = code;
  }
}

export function publicInterventionMessage(error: unknown): string {
  if (error instanceof InterventionError || error instanceof BookingError) {
    return error.message;
  }
  if (error instanceof UnauthorizedError) {
    return "Sign in to manage this intervention.";
  }
  if (error instanceof ForbiddenError) {
    return "You do not have access to this intervention.";
  }
  return "The intervention could not be updated. Try again.";
}
