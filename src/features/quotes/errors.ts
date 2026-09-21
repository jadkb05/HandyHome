import { ForbiddenError, UnauthorizedError } from "@/lib/auth/errors";
import { BookingError } from "@/features/bookings/errors";

export type QuoteErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN_ROLE"
  | "BOOKING_NOT_FOUND"
  | "QUOTE_NOT_FOUND"
  | "DIAGNOSIS_INCOMPLETE"
  | "INVALID_AMOUNT"
  | "ILLEGAL_TRANSITION"
  | "ALREADY_ACCEPTED";

export class QuoteError extends Error {
  readonly code: QuoteErrorCode;

  constructor(code: QuoteErrorCode, message: string) {
    super(message);
    this.name = "QuoteError";
    this.code = code;
  }
}

export function publicQuoteMessage(error: unknown): string {
  if (error instanceof QuoteError || error instanceof BookingError) {
    return error.message;
  }
  if (error instanceof UnauthorizedError) {
    return "Sign in to manage this quote.";
  }
  if (error instanceof ForbiddenError) {
    return "You do not have access to this quote.";
  }
  return "The quote could not be saved. Try again.";
}
