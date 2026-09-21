import { ForbiddenError, UnauthorizedError } from "@/lib/auth/errors";
import { BookingError } from "@/features/bookings/errors";

export type ReviewErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN_ROLE"
  | "BOOKING_NOT_FOUND"
  | "PAYMENT_REQUIRED"
  | "ILLEGAL_TRANSITION"
  | "INVALID_RATING"
  | "INVALID_COMMENT"
  | "ALREADY_REVIEWED";

export class ReviewError extends Error {
  readonly code: ReviewErrorCode;

  constructor(code: ReviewErrorCode, message: string) {
    super(message);
    this.name = "ReviewError";
    this.code = code;
  }
}

export function publicReviewMessage(error: unknown): string {
  if (error instanceof ReviewError || error instanceof BookingError) {
    return error.message;
  }
  if (error instanceof UnauthorizedError) {
    return "Sign in to leave a review.";
  }
  if (error instanceof ForbiddenError) {
    return "You do not have access to this review.";
  }
  return "The review could not be saved. Try again.";
}
