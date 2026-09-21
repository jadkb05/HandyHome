import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AvailabilitySummary } from "@/components/AvailabilitySummary";
import { PortfolioList } from "@/components/PortfolioList";
import { ProfessionalReviews } from "@/components/ProfessionalReviews";
import { StarDisplay } from "@/components/StarDisplay";
import { Icon, serviceIcon } from "@/components/ui/Icon";
import { copy } from "@/content/en";
import { getCurrentUser, UserRole } from "@/lib/auth";
import { getProfessionalById, isProfilePublic } from "@/features/professionals";
import { listPublicReviewsForProvider } from "@/features/reviews";
import { formatPublicLocation, verificationLabel } from "@/lib/location";

type PageProps = {
  params: Promise<{ id: string }>;
};

function profileShape(professional: { profession: string; city: string; services: unknown[] }) {
  return {
    profession: professional.profession,
    city: professional.city,
    serviceCount: professional.services.length,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const professional = await getProfessionalById(id);
  if (!professional || !isProfilePublic(profileShape(professional))) {
    return { title: copy.professionalsTitle };
  }
  return { title: professional.user.name };
}

export default async function ProfessionalProfilePage({ params }: PageProps) {
  const { id } = await params;
  const professional = await getProfessionalById(id);
  if (!professional) {
    notFound();
  }

  const [reviewSummary, viewer] = await Promise.all([
    listPublicReviewsForProvider(professional.id),
    getCurrentUser(),
  ]);
  const isOwner = viewer?.role === UserRole.PROFESSIONAL && viewer.userId === professional.userId;
  const isPublic = isProfilePublic(profileShape(professional));
  if (!isPublic && !isOwner) {
    notFound();
  }
  const location = formatPublicLocation(professional.city, professional.address);
  const photo = professional.user.image?.startsWith("/") ? professional.user.image : null;
  const countLabel =
    reviewSummary.count === 1
      ? copy.reviewCountOne
      : copy.reviewCountMany.replace("{count}", String(reviewSummary.count));

  return (
    <article className="profile">
      {!isPublic ? (
        <p className="notice" role="note" data-testid="profile-private-notice">
          {copy.profilePrivateNotice}
        </p>
      ) : null}
      <header className="profile-header">
        <div className="profile-hero__photo">
          {photo ? (
            <Image
              src={photo}
              alt={professional.user.name}
              width={800}
              height={800}
              sizes="(min-width: 40rem) 15rem, 100vw"
              className="profile-hero__image"
              priority
            />
          ) : (
            <div className="profile-hero__fallback" aria-hidden="true">
              {professional.user.name.slice(0, 1)}
            </div>
          )}
        </div>
        <div className="profile-hero__copy">
          <p className="eyebrow">{professional.profession}</p>
          <h1 className="page-title">{professional.user.name}</h1>
          <div className="profile-meta">
            <p className="lead" data-testid="profile-location">
              <Icon name="pin" size={18} />
              {location}
            </p>
            {reviewSummary.count > 0 && reviewSummary.average != null ? (
              <p className="market-card__rating" data-testid="profile-rating">
                <StarDisplay rating={reviewSummary.average} />
                <span>
                  {reviewSummary.averageLabel} · {countLabel}
                </span>
              </p>
            ) : (
              <span className="badge badge--brand">{copy.newProfessional}</span>
            )}
          </div>
          <p className="status-text">
            <span className="status-dot" aria-hidden="true" data-verified={professional.verified} />
            {verificationLabel(professional.verified)}
          </p>
        </div>
      </header>

      <div className="profile-layout">
        <aside className="profile-aside" aria-label={copy.profileBookingTitle}>
          <div className="book-card">
            <h2 className="book-card__title">{copy.profileBookingTitle}</h2>
            <p className="price-on-quote" data-testid="price-on-quote">
              {copy.priceOnQuote}
            </p>
            {isOwner ? (
              <Link href="/professional/profile" className="button button-secondary">
                {copy.editProfile}
              </Link>
            ) : (
              <Link
                href={`/professionals/${professional.id}/book`}
                className="button button-lg"
                data-testid="request-intervention"
              >
                {copy.requestIntervention}
                <Icon name="arrow-right" size={18} />
              </Link>
            )}
            <p className="section-note">{copy.profileBookingNote}</p>
            <h3 className="booking-label">{copy.profileAvailability}</h3>
            <AvailabilitySummary availability={professional.availability} />
          </div>
        </aside>

        <div className="profile-main">
          <section className="profile-section" aria-labelledby="about-heading">
            <h2 id="about-heading" className="section-title">
              {copy.profileAbout}
            </h2>
            <p>{professional.description ?? copy.noDescriptionYet}</p>
          </section>

          <section className="profile-section" aria-labelledby="services-heading">
            <h2 id="services-heading" className="section-title">
              {copy.profileServices}
            </h2>
            {professional.services.length === 0 ? (
              <p className="empty-state">{copy.emptyServices}</p>
            ) : (
              <ul className="chip-list" data-testid="profile-services">
                {professional.services.map((item) => (
                  <li key={item.serviceId}>
                    <Link href={`/services/${item.service.slug}`}>
                      <Icon name={serviceIcon(item.service.slug)} size={16} />
                      {item.service.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="profile-section" aria-labelledby="portfolio-heading">
            <h2 id="portfolio-heading" className="section-title">
              {copy.profilePortfolio}
            </h2>
            <PortfolioList items={professional.portfolio} />
          </section>

          <ProfessionalReviews summary={reviewSummary} />
        </div>
      </div>
    </article>
  );
}
