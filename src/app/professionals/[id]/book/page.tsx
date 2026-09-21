import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingForm } from "@/components/BookingForm";
import { copy } from "@/content/en";
import { groupSlotsByDay } from "@/features/bookings/slots";
import { listOpenSlotsForProvider, offeredBookingServices } from "@/features/bookings/create";
import { BookingError } from "@/features/bookings/errors";
import { getCurrentUser, UserRole } from "@/lib/auth";
import { getProfessionalById, isProfilePublic } from "@/features/professionals";
import { isValidCivilDate } from "@/lib/datetime";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const professional = await getProfessionalById(id);
  if (!professional) {
    return { title: copy.notFoundTitle };
  }
  return { title: `${copy.bookTitle} — ${professional.user.name}` };
}

export default async function RequestInterventionPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const professional = await getProfessionalById(id);
  if (
    !professional ||
    !isProfilePublic({
      profession: professional.profession,
      city: professional.city,
      serviceCount: professional.services.length,
    })
  ) {
    notFound();
  }

  const viewer = await getCurrentUser();
  const bookPath = `/professionals/${professional.id}/book`;
  const loginHref = `/login?from=${encodeURIComponent(bookPath)}`;

  if (!viewer) {
    return (
      <section className="booking-page">
        <p className="eyebrow">{copy.requestIntervention}</p>
        <h1 className="page-title">{copy.bookTitle}</h1>
        <p className="lead">{copy.bookingNeedSignIn}</p>
        <p>
          {copy.bookProfessional}: <strong>{professional.user.name}</strong>
        </p>
        <Link href={loginHref} className="button" data-testid="booking-login">
          {copy.navSignIn}
        </Link>
      </section>
    );
  }

  if (viewer.role !== UserRole.CLIENT) {
    return (
      <section className="booking-page">
        <h1 className="page-title">{copy.bookTitle}</h1>
        <p className="lead" data-testid="booking-role-error">
          {copy.bookingProfessionalCannot}
        </p>
        <Link href={`/professionals/${professional.id}`} className="button button-secondary">
          {copy.viewProfile}
        </Link>
      </section>
    );
  }

  let days: ReturnType<typeof groupSlotsByDay> = [];
  let availabilityError: string | null = null;
  try {
    const slots = await listOpenSlotsForProvider(professional.id);
    days = groupSlotsByDay(slots);
  } catch (error) {
    if (error instanceof BookingError) {
      availabilityError = error.message;
    } else {
      throw error;
    }
  }

  const selectedDate =
    query.date && isValidCivilDate(query.date) && days.some((day) => day.civilDate === query.date)
      ? query.date
      : (days[0]?.civilDate ?? null);

  const emptyMessage =
    professional.availability.length === 0 ? copy.bookingNoAvailability : copy.bookingNoSlots;

  return (
    <section className="booking-page">
      <h1 className="page-title">{copy.bookTitle}</h1>
      <p className="lead">{copy.bookLead}</p>
      <div className="booking-pro">
        <span className="booking-pro__avatar" aria-hidden="true">
          {professional.user.name.slice(0, 1)}
        </span>
        <p>
          <span className="booking-label">{copy.bookProfessional}</span>
          <strong>{professional.user.name}</strong> · {professional.profession}
        </p>
        <p className="price-on-quote">{copy.priceOnQuote}</p>
      </div>
      {availabilityError ? (
        <p className="empty-state">{availabilityError}</p>
      ) : days.length === 0 ? (
        <p className="empty-state" data-testid="booking-empty">
          {emptyMessage}
        </p>
      ) : (
        <BookingForm
          providerId={professional.id}
          providerName={professional.user.name}
          services={offeredBookingServices(professional.services)}
          days={days}
          selectedDate={selectedDate}
        />
      )}
    </section>
  );
}
