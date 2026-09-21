import type { Metadata } from "next";
import Link from "next/link";
import { BookingStatus } from "@prisma/client";
import { ActivityFeed, firstName, NextStepCard, StatGrid } from "@/components/DashboardParts";
import { BookingList } from "@/components/BookingList";
import { Icon } from "@/components/ui/Icon";
import { copy } from "@/content/en";
import { actionFor, nextStepFor } from "@/features/bookings/dashboard";
import { listBookingsForProfessional } from "@/features/bookings/queries";
import { getProviderByUserId, profileGaps } from "@/features/professionals";
import { requirePageRole, UserRole } from "@/lib/auth";
import { civilDateInBusinessTimezone } from "@/lib/datetime";

export const metadata: Metadata = {
  title: copy.professionalDashboardTitle,
};

export default async function ProfessionalDashboardPage() {
  const user = await requirePageRole(UserRole.PROFESSIONAL);
  const [provider, bookings] = await Promise.all([getProviderByUserId(user.userId), listBookingsForProfessional(user)]);
  const today = civilDateInBusinessTimezone(new Date());
  const next = nextStepFor(bookings, "professional");
  const needsAction = bookings.filter((booking) => actionFor(booking, "professional")).length;
  const todaysWork = bookings.filter(
    (booking) =>
      booking.scheduledAt &&
      civilDateInBusinessTimezone(booking.scheduledAt) === today &&
      booking.status !== BookingStatus.REJECTED,
  ).length;
  const quotesWaiting = bookings.filter((booking) => booking.status === BookingStatus.QUOTE_PENDING).length;
  const completed = bookings.filter(
    (booking) => booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.REVIEWED,
  ).length;

  const gaps = provider
    ? profileGaps({
        profession: provider.profession,
        city: provider.city,
        serviceCount: provider.services.length,
      })
    : [];
  const gapLabels = {
    profession: copy.onboardingProfession,
    city: copy.onboardingCity,
    services: copy.onboardingServices,
  } as const;

  return (
    <section className="dashboard-page">
      <header className="dash-hero">
        <p className="eyebrow">{copy.dashHello.replace("{name}", firstName(user.name))}</p>
        <h1 className="page-title">{copy.professionalDashboardTitle}</h1>
        <p className="lead">{copy.professionalDashboardLead}</p>
        <div className="stack dash-hero__actions">
          <Link href="/professional/profile" className="button button-on-brand">
            {copy.editProfile}
          </Link>
          {provider ? (
            <Link href={`/professionals/${provider.id}`} className="button button-ghost-on-brand">
              {copy.viewPublicProfile}
            </Link>
          ) : null}
        </div>
        <dl className="account-meta">
          <div>
            <dt>{copy.signedInAs}</dt>
            <dd data-testid="auth-email">{user.email}</dd>
          </div>
          <div>
            <dt>{copy.accountRole}</dt>
            <dd data-testid="auth-role">{copy.accountTypeProfessional}</dd>
          </div>
        </dl>
      </header>

      {provider && gaps.length > 0 ? (
        <section className="onboarding" aria-labelledby="onboarding-heading" data-testid="profile-incomplete">
          <h2 id="onboarding-heading" className="onboarding__title">
            {copy.onboardingTitle}
          </h2>
          <p>{copy.onboardingLead}</p>
          <ul className="onboarding__list">
            {gaps.map((gap) => (
              <li key={gap}>{gapLabels[gap]}</li>
            ))}
          </ul>
          <Link href="/professional/profile" className="button">
            {copy.onboardingAction}
            <Icon name="arrow-right" size={18} />
          </Link>
        </section>
      ) : null}
      {provider && gaps.length === 0 && provider.availability.length === 0 ? (
        <p className="notice" role="note" data-testid="no-availability-note">
          {copy.onboardingNoAvailability}
        </p>
      ) : null}
      {provider && !provider.verified ? <p className="status-text">{copy.accountNotVerified}</p> : null}

      <div className="dash-top">
        <NextStepCard step={next} viewer="professional" hasBookings={bookings.length > 0} />
        <StatGrid
          items={[
            { label: copy.dashNeedsAction, value: needsAction, highlight: needsAction > 0 },
            { label: copy.dashboardToday, value: todaysWork },
            { label: copy.dashAwaitingClient, value: quotesWaiting },
            { label: copy.dashboardCompletedJobs, value: completed },
          ]}
        />
      </div>

      <div className="dash-cols">
        <section aria-labelledby="professional-bookings-heading">
          <h2 id="professional-bookings-heading" className="dash-section-title">
            {copy.professionalBookingsTitle}
          </h2>
          <BookingList
            bookings={bookings}
            variant="professional"
            empty={copy.professionalBookingsEmpty}
          />
        </section>
        <div className="dash-cols__side">
          <ActivityFeed bookings={bookings} viewer="professional" />
        </div>
      </div>
    </section>
  );
}
