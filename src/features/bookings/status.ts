import { BookingStatus } from "@prisma/client";
import { copy } from "@/content/en";

const labels: Record<BookingStatus, string> = {
  [BookingStatus.REQUESTED]: copy.bookingStatusRequested,
  [BookingStatus.ACCEPTED]: copy.bookingStatusAccepted,
  [BookingStatus.REJECTED]: copy.bookingStatusRejected,
  [BookingStatus.APPOINTMENT_SCHEDULED]: copy.bookingStatusAccepted,
  [BookingStatus.DIAGNOSIS]: copy.bookingStatusDiagnosis,
  [BookingStatus.QUOTE_PENDING]: copy.bookingStatusQuoteSent,
  [BookingStatus.QUOTE_ACCEPTED]: copy.bookingStatusQuoteAccepted,
  [BookingStatus.INTERVENTION]: copy.interventionInProgress,
  [BookingStatus.PAYMENT]: copy.interventionCompletedPaymentPending,
  [BookingStatus.COMPLETED]: copy.paymentRecorded,
  [BookingStatus.REVIEWED]: copy.paymentRecorded,
};

export function bookingStatusLabel(status: BookingStatus): string {
  return labels[status] ?? status;
}

export type StatusTone = "pending" | "info" | "positive" | "attention" | "active" | "done" | "declined";

/** Semantic tone for the status pill: pending (neutral), positive, info, attention, active, done, declined. */
export function bookingStatusTone(status: BookingStatus): StatusTone {
  switch (status) {
    case BookingStatus.REQUESTED:
      return "pending";
    case BookingStatus.ACCEPTED:
    case BookingStatus.APPOINTMENT_SCHEDULED:
    case BookingStatus.QUOTE_ACCEPTED:
      return "positive";
    case BookingStatus.DIAGNOSIS:
      return "info";
    case BookingStatus.QUOTE_PENDING:
    case BookingStatus.PAYMENT:
      return "attention";
    case BookingStatus.INTERVENTION:
      return "active";
    case BookingStatus.COMPLETED:
    case BookingStatus.REVIEWED:
      return "done";
    case BookingStatus.REJECTED:
      return "declined";
  }
}

/** One plain-language sentence telling each side what the current status means. */
export function bookingStatusHint(
  status: BookingStatus,
  viewer: "client" | "professional",
  options: { hasSentQuote?: boolean } = {},
): string {
  const client = viewer === "client";
  switch (status) {
    case BookingStatus.REQUESTED:
      return client ? copy.hintClientRequested : copy.hintProRequested;
    case BookingStatus.ACCEPTED:
    case BookingStatus.APPOINTMENT_SCHEDULED:
      return client ? copy.hintClientAccepted : copy.hintProAccepted;
    case BookingStatus.DIAGNOSIS:
      return client ? copy.hintClientDiagnosis : copy.hintProDiagnosis;
    case BookingStatus.QUOTE_PENDING:
      if (options.hasSentQuote) {
        return client ? copy.hintClientQuotePending : copy.hintProQuotePending;
      }
      return client ? copy.hintClientQuoteDeclined : copy.hintProQuoteDeclined;
    case BookingStatus.QUOTE_ACCEPTED:
      return client ? copy.hintClientQuoteAccepted : copy.hintProQuoteAccepted;
    case BookingStatus.INTERVENTION:
      return client ? copy.hintClientIntervention : copy.hintProIntervention;
    case BookingStatus.PAYMENT:
      return client ? copy.hintClientPayment : copy.hintProPayment;
    case BookingStatus.COMPLETED:
    case BookingStatus.REVIEWED:
      return client ? copy.hintClientCompleted : copy.hintProCompleted;
    case BookingStatus.REJECTED:
      return client ? copy.hintClientRejected : copy.hintProRejected;
  }
}
