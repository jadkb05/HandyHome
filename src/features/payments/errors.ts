import { ForbiddenError, UnauthorizedError } from "@/lib/auth/errors";
import { BookingError } from "@/features/bookings/errors";

export type PaymentErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN_ROLE"
  | "BOOKING_NOT_FOUND"
  | "PAYMENT_NOT_FOUND"
  | "QUOTE_NOT_ACCEPTED"
  | "ILLEGAL_TRANSITION"
  | "ALREADY_RECORDED";

export class PaymentError extends Error {
  readonly code: PaymentErrorCode;

  constructor(code: PaymentErrorCode, message: string) {
    super(message);
    this.name = "PaymentError";
    this.code = code;
  }
}

export function publicPaymentMessage(error: unknown): string {
  if (error instanceof PaymentError || error instanceof BookingError) {
    return error.message;
  }
  if (error instanceof UnauthorizedError) {
    return "Sign in to record this payment state.";
  }
  if (error instanceof ForbiddenError) {
    return "You do not have access to this payment.";
  }
  return "The payment state could not be updated. Try again.";
}
