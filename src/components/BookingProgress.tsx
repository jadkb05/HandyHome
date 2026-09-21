import { BookingStatus } from "@prisma/client";
import { copy } from "@/content/en";

const STEPS = [
  {
    id: "accepted",
    label: copy.progressAccepted,
    active: new Set<BookingStatus>([
      BookingStatus.ACCEPTED,
      BookingStatus.APPOINTMENT_SCHEDULED,
      BookingStatus.DIAGNOSIS,
      BookingStatus.QUOTE_PENDING,
      BookingStatus.QUOTE_ACCEPTED,
      BookingStatus.INTERVENTION,
      BookingStatus.PAYMENT,
      BookingStatus.COMPLETED,
      BookingStatus.REVIEWED,
    ]),
  },
  {
    id: "diagnosis",
    label: copy.progressDiagnosis,
    active: new Set<BookingStatus>([
      BookingStatus.DIAGNOSIS,
      BookingStatus.QUOTE_PENDING,
      BookingStatus.QUOTE_ACCEPTED,
      BookingStatus.INTERVENTION,
      BookingStatus.PAYMENT,
      BookingStatus.COMPLETED,
      BookingStatus.REVIEWED,
    ]),
  },
  {
    id: "quote",
    label: copy.progressQuote,
    active: new Set<BookingStatus>([
      BookingStatus.QUOTE_PENDING,
      BookingStatus.QUOTE_ACCEPTED,
      BookingStatus.INTERVENTION,
      BookingStatus.PAYMENT,
      BookingStatus.COMPLETED,
      BookingStatus.REVIEWED,
    ]),
  },
  {
    id: "intervention",
    label: copy.progressIntervention,
    active: new Set<BookingStatus>([
      BookingStatus.INTERVENTION,
      BookingStatus.PAYMENT,
      BookingStatus.COMPLETED,
      BookingStatus.REVIEWED,
    ]),
  },
  {
    id: "payment",
    label: copy.progressPayment,
    active: new Set<BookingStatus>([BookingStatus.PAYMENT, BookingStatus.COMPLETED, BookingStatus.REVIEWED]),
  },
  {
    id: "completed",
    label: copy.progressCompleted,
    active: new Set<BookingStatus>([BookingStatus.COMPLETED, BookingStatus.REVIEWED]),
  },
] as const;

export function BookingProgress({ status }: { status: BookingStatus }) {
  if (status === BookingStatus.REJECTED) {
    return null;
  }

  const currentIndex = STEPS.reduce((found, step, index) => (step.active.has(status) ? index : found), -1);
  // A finished booking has nothing left to do: show every step as completed.
  const finished = status === BookingStatus.COMPLETED || status === BookingStatus.REVIEWED;

  return (
    <ol className="progress-timeline" aria-label="Booking progress">
      {STEPS.map((step, index) => {
        const complete = finished || index < currentIndex;
        const current = !finished && index === currentIndex;
        const state = complete ? "done" : current ? "current" : "upcoming";
        return (
          <li
            key={step.id}
            className="progress-timeline__step"
            data-state={state}
            data-complete={complete}
            data-current={current}
            aria-current={current ? "step" : undefined}
          >
            <span className="progress-timeline__index" aria-hidden="true">
              {complete ? "✓" : String(index + 1)}
            </span>
            <span className="progress-timeline__label">{step.label}</span>
            <span className="sr-only">
              {" "}
              (
              {complete
                ? copy.progressStateDone
                : current
                  ? copy.progressStateCurrent
                  : copy.progressStateUpcoming}
              )
            </span>
          </li>
        );
      })}
    </ol>
  );
}
