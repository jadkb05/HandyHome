import { BookingStatus, DiagnosisStatus, PaymentStatus, QuoteStatus } from "@prisma/client";
import { copy } from "@/content/en";
import { BookingDecisionForm } from "@/components/BookingDecisionForm";
import { CompleteDiagnosisForm } from "@/components/CompleteDiagnosisForm";
import { CompleteInterventionForm } from "@/components/CompleteInterventionForm";
import { QuoteCreateForm } from "@/components/QuoteCreateForm";
import { QuoteRespondForm } from "@/components/QuoteRespondForm";
import { RecordPaymentForm } from "@/components/RecordPaymentForm";
import { ReviewForm } from "@/components/ReviewForm";
import { StartDiagnosisForm } from "@/components/StartDiagnosisForm";
import { StartInterventionForm } from "@/components/StartInterventionForm";
import { BookingProgress } from "@/components/BookingProgress";
import { bookingStatusHint, bookingStatusLabel, bookingStatusTone } from "@/features/bookings/status";
import { formatQuoteAmount } from "@/features/quotes/money";
import { formatAppointmentInBusinessTimezone } from "@/lib/datetime";
import { DateBlock } from "@/components/DashboardParts";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/ui/Icon";

type QuoteRow = {
  id: string;
  version: number;
  amount: { toString(): string };
  currency: string;
  notes: string;
  status: QuoteStatus;
};

type PaymentRow = {
  amount: { toString(): string };
  currency: string;
  status: PaymentStatus;
};

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
};

type BookingRow = {
  id: string;
  status: BookingStatus;
  scheduledAt: Date | null;
  client: { name: string };
  provider: { user: { name: string } };
  service: { name: string };
  diagnosis: { findings: string; status: DiagnosisStatus } | null;
  quotes: QuoteRow[];
  payment: PaymentRow | null;
  review: ReviewRow | null;
};

function quoteStatusLabel(status: QuoteStatus): string {
  if (status === QuoteStatus.ACCEPTED) {
    return copy.bookingStatusQuoteAccepted;
  }
  if (status === QuoteStatus.REJECTED) {
    return copy.quoteDeclined;
  }
  if (status === QuoteStatus.SENT) {
    return copy.quoteSent;
  }
  return status;
}

function QuoteHistory({ quotes, showActions }: { quotes: QuoteRow[]; showActions: boolean }) {
  if (quotes.length === 0) {
    return null;
  }

  const latestSent = [...quotes].reverse().find((quote) => quote.status === QuoteStatus.SENT);
  const awaitingClient = showActions && latestSent;

  return (
    <div className="quote-history" data-testid="quote-history">
      {awaitingClient ? (
        <div className="quote-callout">
          <Icon name="receipt" size={20} />
          <div>
            <p className="quote-callout__title">{copy.quoteDecisionTitle}</p>
            <p className="section-note">{copy.quoteDecisionHelp}</p>
          </div>
        </div>
      ) : null}
      <ul className="quote-version-list">
        {quotes.map((quote) => (
          <li key={quote.id} className="quote-card" data-testid="quote-item" data-quote-status={quote.status}>
            <div className="quote-card__head">
              <p className="quote-card__title">
                {copy.quoteTitle} · {copy.quoteVersion} {quote.version}
              </p>
              <span className="quote-card__status">{quoteStatusLabel(quote.status)}</span>
            </div>
            <p
              className="quote-card__amount"
              data-testid={quote.status === QuoteStatus.SENT ? "quote-amount" : undefined}
            >
              <span className="quote-card__amount-label">{copy.quoteTotal}</span>
              <strong>{formatQuoteAmount(quote.amount, quote.currency)}</strong>
            </p>
            {quote.notes ? (
              <p className="quote-card__notes">
                <span className="booking-label">{copy.quoteNotes}</span>
                {quote.notes}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      {awaitingClient && latestSent ? <QuoteRespondForm quoteId={latestSent.id} /> : null}
    </div>
  );
}

export function BookingList({
  bookings,
  variant,
  empty,
  emptyAction,
}: {
  bookings: BookingRow[];
  variant: "client" | "professional";
  empty: string;
  emptyAction?: { href: string; label: string };
}) {
  if (bookings.length === 0) {
    return (
      <EmptyState icon={variant === "client" ? "calendar" : "inbox"} action={emptyAction}>
        {empty}
      </EmptyState>
    );
  }

  return (
    <ul className="booking-list" data-testid={variant === "client" ? "client-bookings" : "professional-bookings"}>
      {bookings.map((booking) => {
        const completedDiagnosis = booking.diagnosis?.status === DiagnosisStatus.COMPLETED;
        const hasAcceptedQuote = booking.quotes.some((quote) => quote.status === QuoteStatus.ACCEPTED);
        const hasSentQuote = booking.quotes.some((quote) => quote.status === QuoteStatus.SENT);
        const canCreateQuote =
          variant === "professional" && completedDiagnosis && !hasAcceptedQuote && !hasSentQuote;
        const quoteAccepted = booking.status === BookingStatus.QUOTE_ACCEPTED && hasAcceptedQuote;

        return (
          <li
            key={booking.id}
            id={`booking-${booking.id}`}
            className="booking-item"
            tabIndex={-1}
            data-booking-item
            data-testid="booking-item"
            data-booking-status={booking.status}
          >
            <div className="booking-item__head">
              {booking.scheduledAt ? <DateBlock date={booking.scheduledAt} /> : null}
              <div className="booking-item__title">
                <span className="booking-item__service">{booking.service.name}</span>
                <span className="booking-item__who">
                  {variant === "client"
                    ? copy.dashActiveWith.replace("{name}", booking.provider.user.name)
                    : copy.dashActiveFor.replace("{name}", booking.client.name)}
                </span>
                <p className="booking-item__when">
                  <Icon name="calendar" size={16} />
                  {booking.scheduledAt
                    ? formatAppointmentInBusinessTimezone(booking.scheduledAt)
                    : copy.bookingNoSlots}
                </p>
              </div>
              <div className="booking-item__status">
                <strong
                  className="status-pill"
                  data-tone={bookingStatusTone(booking.status)}
                  data-testid="booking-item-status"
                >
                  {bookingStatusLabel(booking.status)}
                </strong>
              </div>
            </div>
            <p className="booking-hint" aria-live="polite" data-testid="booking-hint">
              {bookingStatusHint(booking.status, variant, { hasSentQuote })}
            </p>
            <BookingProgress status={booking.status} />

            {variant === "professional" && booking.status === BookingStatus.REQUESTED ? (
              <BookingDecisionForm bookingId={booking.id} />
            ) : null}

            {variant === "professional" && booking.status === BookingStatus.ACCEPTED ? (
              <StartDiagnosisForm bookingId={booking.id} />
            ) : null}

            {variant === "professional" && booking.diagnosis?.status === DiagnosisStatus.DRAFT ? (
              <CompleteDiagnosisForm bookingId={booking.id} defaultFindings={booking.diagnosis.findings} />
            ) : null}

            {completedDiagnosis ? (
              <div className="diagnosis-note" data-testid="diagnosis-completed">
                <p className="diagnosis-note__label">
                  <Icon name="check" size={16} />
                  {copy.diagnosisTitle} · {copy.diagnosisCompleted}
                </p>
                {(variant === "professional" || variant === "client") && booking.diagnosis ? (
                  <p data-testid="diagnosis-findings-text">{booking.diagnosis.findings}</p>
                ) : null}
              </div>
            ) : null}

            {canCreateQuote ? <QuoteCreateForm bookingId={booking.id} /> : null}

            {variant === "professional" && hasSentQuote ? (
              <p className="section-note">{copy.quoteAwaitingClient}</p>
            ) : null}

            <QuoteHistory quotes={booking.quotes} showActions={variant === "client"} />

            {quoteAccepted ? (
              <div>
                <p className="form-success" role="status" data-testid="quote-accepted">
                  {copy.quoteAcceptedNext}
                </p>
                {variant === "professional" ? <StartInterventionForm bookingId={booking.id} /> : (
                  <p className="section-note">{copy.interventionPending}</p>
                )}
              </div>
            ) : null}

            {booking.status === BookingStatus.INTERVENTION ? (
              <div data-testid="intervention-in-progress">
                <p className="section-note">{copy.interventionInProgress}</p>
                {variant === "professional" ? <CompleteInterventionForm bookingId={booking.id} /> : null}
              </div>
            ) : null}

            {booking.status === BookingStatus.PAYMENT ? (
              <div data-testid="payment-pending">
                <p className="section-note">{copy.interventionCompletedPaymentPending}</p>
                <p>{copy.paymentPending}</p>
                {booking.payment ? (
                  <p data-testid="payment-amount">
                    {copy.paymentAmount}: {formatQuoteAmount(booking.payment.amount, booking.payment.currency)}
                  </p>
                ) : null}
                {variant === "client" ? <RecordPaymentForm bookingId={booking.id} /> : null}
              </div>
            ) : null}

            {booking.status === BookingStatus.COMPLETED ? (
              <div data-testid="payment-recorded">
                <p className="form-success" role="status">
                  {copy.paymentRecorded}
                </p>
                {booking.payment ? (
                  <p data-testid="payment-amount">
                    {copy.paymentAmount}: {formatQuoteAmount(booking.payment.amount, booking.payment.currency)}
                  </p>
                ) : null}
                {variant === "client" && !booking.review ? (
                  <div data-testid="leave-review">
                    <p className="section-note">{copy.leaveReview}</p>
                    <ReviewForm bookingId={booking.id} />
                  </div>
                ) : null}
                {variant === "client" && booking.review ? (
                  <p className="form-success" role="status" data-testid="review-submitted">
                    {copy.reviewSubmitted}
                  </p>
                ) : null}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
