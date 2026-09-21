import type { Metadata } from "next";
import Link from "next/link";
import { BookingStatus } from "@prisma/client";
import { ActivityFeed, firstName, NextStepCard, StatGrid } from "@/components/DashboardParts";
import { BookingList } from "@/components/BookingList";
import { Icon } from "@/components/ui/Icon";
import { copy } from "@/content/en";
import { actionFor, isOpenBooking, nextStepFor } from "@/features/bookings/dashboard";
import { listBookingsForClient } from "@/features/bookings/queries";
import { requirePageRole, UserRole } from "@/lib/auth";

export const metadata: Metadata = {
  title: copy.clientDashboardTitle,
};

export default async function ClientDashboardPage() {
  const user = await requirePageRole(UserRole.CLIENT);
  const bookings = await listBookingsForClient(user);
  const next = nextStepFor(bookings, "client");
  const needsAction = bookings.filter((booking) => actionFor(booking, "client")).length;
  const active = bookings.filter(isOpenBooking).length;
  const completed = bookings.filter(
    (booking) => booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.REVIEWED,
  ).length;
  const reviews = bookings.filter((booking) => booking.review).length;

  return (
    <section className="dashboard-page">
      <header className="dash-hero">
        <p className="eyebrow">{copy.clientWelcome}, {firstName(user.name)}</p>
        <h1 className="page-title">{copy.clientDashboardTitle}</h1>
        <p className="lead">{copy.clientDashboardLead}</p>
        <div className="stack dash-hero__actions">
          <Link href="/search" className="button button-on-brand">
            {copy.findProfessional}
            <Icon name="arrow-right" size={18} />
          </Link>
          <Link href="/services" className="button button-ghost-on-brand">
            {copy.browseServices}
          </Link>
        </div>
        <dl className="account-meta">
          <div>
            <dt>{copy.signedInAs}</dt>
            <dd data-testid="auth-email">{user.email}</dd>
          </div>
          <div>
            <dt>{copy.accountRole}</dt>
            <dd data-testid="auth-role">{copy.accountTypeClient}</dd>
          </div>
        </dl>
      </header>

      <div className="dash-top">
        <NextStepCard step={next} viewer="client" hasBookings={bookings.length > 0} />
        <StatGrid
          items={[
            { label: copy.dashAwaiting, value: needsAction, highlight: needsAction > 0 },
            { label: copy.dashboardUpcoming, value: active },
            { label: copy.dashboardCompleted, value: completed },
            { label: copy.dashboardReviews, value: reviews },
          ]}
        />
      </div>

      <div className="dash-cols">
        <section aria-labelledby="client-bookings-heading">
          <h2 id="client-bookings-heading" className="dash-section-title">
            {copy.clientBookingsTitle}
          </h2>
          <BookingList
            bookings={bookings}
            variant="client"
            empty={copy.clientBookingsEmpty}
            emptyAction={{ href: "/search", label: copy.findProfessional }}
          />
        </section>
        <div className="dash-cols__side">
          <ActivityFeed bookings={bookings} viewer="client" />
        </div>
      </div>
    </section>
  );
}
