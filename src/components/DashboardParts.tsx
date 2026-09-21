import Link from "next/link";
import { copy } from "@/content/en";
import { Icon } from "@/components/ui/Icon";
import {
  firstName,
  recentActivity,
  type DashboardBooking,
  type NextStep,
} from "@/features/bookings/dashboard";
import { bookingStatusHint, bookingStatusLabel } from "@/features/bookings/status";
import {
  dayAndMonthInBusinessTimezone,
  formatAppointmentInBusinessTimezone,
  formatInBusinessTimezone,
} from "@/lib/datetime";

export function DateBlock({ date }: { date: Date }) {
  const { day, month } = dayAndMonthInBusinessTimezone(date);
  return (
    <span className="date-block" aria-hidden="true">
      <span className="date-block__day">{day}</span>
      <span className="date-block__month">{month}</span>
    </span>
  );
}

function partyName(booking: DashboardBooking, viewer: "client" | "professional") {
  return viewer === "client"
    ? copy.dashActiveWith.replace("{name}", booking.provider.user.name)
    : copy.dashActiveFor.replace("{name}", booking.client.name);
}

export function NextStepCard({
  step,
  viewer,
  hasBookings,
}: {
  step: NextStep;
  viewer: "client" | "professional";
  hasBookings: boolean;
}) {
  if (step.kind === "none") {
    const caughtUp = hasBookings;
    const client = viewer === "client";
    return (
      <div className="next-card" data-testid="next-step">
        <p className="next-card__label">
          <Icon name={caughtUp ? "check" : client ? "search" : "inbox"} size={16} />
          {copy.dashNextLabel}
        </p>
        <div>
          <h2 className="next-card__title">
            {caughtUp ? copy.dashNothingToDo : client ? copy.dashEmptyClientTitle : copy.dashEmptyProTitle}
          </h2>
          <p className="next-card__text">
            {caughtUp ? copy.dashNothingToDoBody : client ? copy.dashEmptyClientBody : copy.dashEmptyProBody}
          </p>
        </div>
        {client ? (
          <Link href="/search" className="button">
            {copy.findProfessional}
            <Icon name="arrow-right" size={18} />
          </Link>
        ) : null}
      </div>
    );
  }

  const { booking } = step;
  const label =
    step.kind === "action" ? copy.dashNextLabel : step.kind === "appointment" ? copy.dashNextAppointment : copy.dashCurrentStatusLabel;
  const title =
    step.kind === "action"
      ? step.label
      : step.kind === "appointment" && booking.scheduledAt
        ? formatAppointmentInBusinessTimezone(booking.scheduledAt)
        : booking.service.name;
  const text =
    step.kind === "active"
      ? bookingStatusHint(booking.status, viewer)
      : `${booking.service.name} · ${partyName(booking, viewer)}`;

  return (
    <div className="next-card" data-tone={step.kind === "action" ? "attention" : undefined} data-testid="next-step">
      <p className="next-card__label">
        <Icon name={step.kind === "action" ? "hand" : "calendar"} size={16} />
        {label}
      </p>
      <div className="next-card__main">
        {step.kind === "appointment" && booking.scheduledAt ? <DateBlock date={booking.scheduledAt} /> : null}
        <div>
          <h2 className="next-card__title">{title}</h2>
          <p className="next-card__text">{text}</p>
        </div>
      </div>
      <div>
        <Link href={`#booking-${booking.id}`} className="button">
          {copy.dashGoToBooking}
          <Icon name="arrow-right" size={18} />
        </Link>
      </div>
    </div>
  );
}

export function StatGrid({ items }: { items: { label: string; value: number; highlight?: boolean }[] }) {
  return (
    <dl className="dash-stats">
      {items.map((item) => (
        <div key={item.label} className="stat-card" data-highlight={item.highlight ? "true" : undefined}>
          <dt className="stat-card__label">{item.label}</dt>
          <dd className="stat-card__value">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ActivityFeed({
  bookings,
  viewer,
}: {
  bookings: DashboardBooking[];
  viewer: "client" | "professional";
}) {
  const items = recentActivity(bookings);
  return (
    <div className="activity-card">
      <h2 className="dash-section-title">{copy.dashLatest}</h2>
      {items.length === 0 ? (
        <p className="section-note">{copy.dashLatestEmpty}</p>
      ) : (
        <ol className="activity">
          {items.map((booking) => (
            <li key={booking.id} className="activity__item">
              <span className="activity__what">
                {booking.service.name} · {bookingStatusLabel(booking.status)}
              </span>
              <span className="activity__when">
                {partyName(booking, viewer)} · {formatInBusinessTimezone(booking.updatedAt)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export { firstName };
