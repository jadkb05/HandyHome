import { ForbiddenError, UnauthorizedError } from "@/lib/auth/errors";
import { BookingError } from "@/features/bookings/errors";

export type DiagnosisErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN_ROLE"
  | "BOOKING_NOT_FOUND"
  | "ILLEGAL_TRANSITION"
  | "INVALID_FINDINGS";

export class DiagnosisError extends Error {
  readonly code: DiagnosisErrorCode;

  constructor(code: DiagnosisErrorCode, message: string) {
    super(message);
    this.name = "DiagnosisError";
    this.code = code;
  }
}

export function publicDiagnosisMessage(error: unknown): string {
  if (error instanceof DiagnosisError || error instanceof BookingError) {
    return error.message;
  }
  if (error instanceof UnauthorizedError) {
    return "Sign in to manage the diagnosis.";
  }
  if (error instanceof ForbiddenError) {
    return "You do not have access to this diagnosis.";
  }
  return "The diagnosis could not be saved. Try again.";
}
