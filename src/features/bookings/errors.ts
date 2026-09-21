import { ForbiddenError, UnauthorizedError } from "@/lib/auth/errors";

export type BookingErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN_ROLE"
  | "PROVIDER_NOT_FOUND"
  | "PROVIDER_INELIGIBLE"
  | "INVALID_TIME"
  | "OUTSIDE_AVAILABILITY"
  | "SLOT_TAKEN"
  | "SERVICE_NOT_OFFERED"
  | "BOOKING_NOT_FOUND"
  | "ILLEGAL_TRANSITION";

export class BookingError extends Error {
  readonly code: BookingErrorCode;

  constructor(code: BookingErrorCode, message: string) {
    super(message);
    this.name = "BookingError";
    this.code = code;
  }
}

export function publicBookingMessage(error: unknown): string {
  if (error instanceof BookingError) {
    return error.message;
  }
  if (error instanceof UnauthorizedError) {
    return "Sign in as a client to request an intervention.";
  }
  if (error instanceof ForbiddenError) {
    return "You do not have access to this booking.";
  }
  return "The appointment could not be saved. Try another time.";
}
