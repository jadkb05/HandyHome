import { BookingStatus, DiagnosisStatus, QuoteStatus } from "@prisma/client";
import { copy } from "@/content/en";

/** Presentation helpers for the dashboards. They only read existing booking data. */
export type DashboardBooking = {
  id: string;
  status: BookingStatus;
  scheduledAt: Date | null;
  updatedAt: Date;
  service: { name: string };
  client: { name: string };
  provider: { user: { name: string } };
  diagnosis: { status: DiagnosisStatus } | null;
  quotes: { status: QuoteStatus }[];
  review: unknown | null;
};

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

export function isOpenBooking(booking: { status: BookingStatus }): boolean {
  return (
    booking.status !== BookingStatus.COMPLETED &&
    booking.status !== BookingStatus.REVIEWED &&
    booking.status !== BookingStatus.REJECTED
  );
}

/** What this viewer has to do next on the booking, or null when they are just waiting. */
export function actionFor(booking: DashboardBooking, viewer: "client" | "professional"): string | null {
  const hasSent = booking.quotes.some((quote) => quote.status === QuoteStatus.SENT);
  if (viewer === "client") {
    if (booking.status === BookingStatus.QUOTE_PENDING && hasSent) {
      return copy.actionReviewQuote;
    }
    if (booking.status === BookingStatus.PAYMENT) {
      return copy.actionRecordPayment;
    }
    if (booking.status === BookingStatus.COMPLETED && !booking.review) {
      return copy.actionLeaveReview;
    }
    return null;
  }
  switch (booking.status) {
    case BookingStatus.REQUESTED:
      return copy.actionAnswerRequest;
    case BookingStatus.ACCEPTED:
      return copy.actionStartDiagnosis;
    case BookingStatus.DIAGNOSIS:
      return booking.diagnosis?.status === DiagnosisStatus.COMPLETED
        ? copy.actionSendQuote
        : copy.actionCompleteDiagnosis;
    case BookingStatus.QUOTE_PENDING:
      return hasSent ? null : copy.actionSendQuote;
    case BookingStatus.QUOTE_ACCEPTED:
      return copy.actionStartIntervention;
    case BookingStatus.INTERVENTION:
      return copy.actionCompleteIntervention;
    default:
      return null;
  }
}

export type NextStep =
  | { kind: "action"; booking: DashboardBooking; label: string }
  | { kind: "appointment"; booking: DashboardBooking }
  | { kind: "active"; booking: DashboardBooking }
  | { kind: "none" };

export function nextStepFor(
  bookings: DashboardBooking[],
  viewer: "client" | "professional",
  now = new Date(),
): NextStep {
  for (const booking of bookings) {
    const label = actionFor(booking, viewer);
    if (label) {
      return { kind: "action", booking, label };
    }
  }
  const upcoming = bookings
    .filter((booking) => isOpenBooking(booking) && booking.scheduledAt && booking.scheduledAt >= now)
    .sort((a, b) => (a.scheduledAt as Date).getTime() - (b.scheduledAt as Date).getTime());
  if (upcoming[0]) {
    return { kind: "appointment", booking: upcoming[0] };
  }
  const open = bookings.find(isOpenBooking);
  return open ? { kind: "active", booking: open } : { kind: "none" };
}

export function recentActivity(bookings: DashboardBooking[], limit = 4): DashboardBooking[] {
  return [...bookings].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, limit);
}
