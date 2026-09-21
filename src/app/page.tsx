import Image from "next/image";
import Link from "next/link";
import { ServiceCard } from "@/components/ServiceCard";
import { Reveal } from "@/components/motion/Reveal";
import { Icon, type IconName } from "@/components/ui/Icon";
import { SceneBackdrop } from "@/components/visual/SceneBackdrop";
import { copy } from "@/content/en";
import { BRAND_STORY_IMAGE, HERO_IMAGE, POPULAR_SERVICE_SLUGS } from "@/content/media";
import { listServices } from "@/features/services";

const VALUE_SIGNALS: { icon: IconName; title: string; body: string }[] = [
  { icon: "pin", title: copy.valueLocalTitle, body: copy.valueLocalBody },
  { icon: "calendar", title: copy.valueTimeTitle, body: copy.valueTimeBody },
  { icon: "receipt", title: copy.valueQuoteTitle, body: copy.valueQuoteBody },
];

const JOURNEY: { icon: IconName; title: string; body: string }[] = [
  { icon: "search", title: copy.journey1Title, body: copy.journey1Body },
  { icon: "user", title: copy.journey2Title, body: copy.journey2Body },
  { icon: "calendar", title: copy.journey3Title, body: copy.journey3Body },
  { icon: "receipt", title: copy.journey4Title, body: copy.journey4Body },
  { icon: "check", title: copy.journey5Title, body: copy.journey5Body },
];

const WHY: { title: string; body: string }[] = [
  { title: copy.whyDiagnosisTitle, body: copy.whyDiagnosisBody },
  { title: copy.whyControlTitle, body: copy.whyControlBody },
  { title: copy.whyTrackTitle, body: copy.whyTrackBody },
  { title: copy.whyReviewsTitle, body: copy.whyReviewsBody },
];

export default async function HomePage() {
  const services = await listServices();
  const popular = POPULAR_SERVICE_SLUGS.map((slug) => services.find((service) => service.slug === slug)).filter(
    (service): service is NonNullable<typeof service> => Boolean(service),
  );

  return (
    <div className="home-story">
      <section className="scene hero-section" aria-labelledby="home-hero-heading">
        <SceneBackdrop variant="hero" />
        <div className="page-width hero">
          <div className="hero__copy">
            <p className="hero__kicker">
              <Icon name="pin" size={16} />
              {copy.heroKicker}
            </p>
            <h1 id="home-hero-heading" className="hero__title">
              {copy.homeTitlePre} <span className="hero__accent">{copy.homeTitleAccent}</span>{" "}
              {copy.homeTitlePost}
            </h1>
            <p className="hero__lead">{copy.homeLead}</p>
            <form className="hero-search" action="/search" method="get" role="search">
              <label className="hero-search__field">
                <span className="sr-only">{copy.heroSearchLabel}</span>
                <span className="hero-search__icon" aria-hidden="true">
                  <Icon name="search" size={18} />
                </span>
                <select name="service" defaultValue="">
                  <option value="">{copy.heroSearchLabel}</option>
                  {services.map((service) => (
                    <option key={service.slug} value={service.slug}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" className="button button-lg">
                {copy.heroSearchButton}
                <Icon name="arrow-right" size={18} />
              </button>
            </form>
            <div className="hero__links">
              <Link href="/professionals" className="text-link">
                {copy.heroBrowse}
                <Icon name="arrow-right" size={16} />
              </Link>
              <Link href="/services" className="text-link">
                {copy.homeExploreServices}
                <Icon name="arrow-right" size={16} />
              </Link>
            </div>
          </div>
          <div className="hero__visual">
            <div className="hero__gable" aria-hidden="true" />
            <div className="hero__frame">
              <Image
                src={HERO_IMAGE.src}
                alt={HERO_IMAGE.alt}
                width={HERO_IMAGE.width}
                height={HERO_IMAGE.height}
                className="hero__image"
                sizes="(min-width: 64rem) 640px, calc(100vw - 2.5rem)"
                priority
              />
            </div>
            <span className="hero__chip hero__chip--a" aria-hidden="true">
              <span className="hero__chip-icon">
                <Icon name="wrench" size={16} />
              </span>
              Plumbing
            </span>
            <span className="hero__chip hero__chip--b" aria-hidden="true">
              <span className="hero__chip-icon">
                <Icon name="receipt" size={16} />
              </span>
              {copy.heroChipQuote}
            </span>
          </div>
        </div>
      </section>

      <section className="value-band page-width" aria-label={copy.whyHandyHome}>
        <ul className="value-band__list">
          {VALUE_SIGNALS.map((item) => (
            <li key={item.title} className="value-band__item">
              <span className="value-band__icon">
                <Icon name={item.icon} size={22} />
              </span>
              <div>
                <p className="value-band__title">{item.title}</p>
                <p className="value-band__text">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="page-width section" id="how-it-works" aria-labelledby="how-heading">
        <div className="section-heading">
          <div className="section-heading__copy">
            <p className="eyebrow">{copy.howItWorks}</p>
            <h2 id="how-heading" className="section-title">
              {copy.journeyTitle}
            </h2>
            <p className="lead">{copy.journeyLead}</p>
          </div>
        </div>
        <ol className="journey">
          {JOURNEY.map((step, index) => (
            <Reveal as="li" key={step.title} className="journey__step" delayMs={index * 70}>
              <span className="journey__icon">
                <Icon name={step.icon} size={24} />
                <span className="journey__num" aria-hidden="true">
                  {index + 1}
                </span>
              </span>
              <div>
                <h3 className="journey__title">{step.title}</h3>
                <p className="journey__text">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="scene section-band section-band--soft section" aria-labelledby="popular-services-heading">
        <SceneBackdrop variant="flow" />
        <div className="page-width">
          <div className="section-heading">
            <div className="section-heading__copy">
              <p className="eyebrow">{copy.navServices}</p>
              <h2 id="popular-services-heading" className="section-title">
                {copy.popularServices}
              </h2>
              <p className="lead">{copy.popularServicesLead}</p>
            </div>
            <Link href="/services" className="text-link">
              {copy.allServices2}
              <Icon name="arrow-right" size={16} />
            </Link>
          </div>
          {popular.length === 0 ? (
            <p className="empty-state">{copy.emptyServices}</p>
          ) : (
            <ul className="service-grid">
              {popular.map((service) => (
                <li key={service.id}>
                  <ServiceCard service={service} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="scene section-band section-band--soft section" aria-labelledby="why-heading">
        <SceneBackdrop variant="wash" />
        <div className="page-width why">
          <div className="why__intro">
            <p className="eyebrow">{copy.whyHandyHome}</p>
            <h2 id="why-heading" className="section-title">
              {copy.whyTitle}
            </h2>
            <p className="lead">{copy.whyLead}</p>
          </div>
          <ul className="why__list">
            {WHY.map((item) => (
              <li key={item.title} className="why__item">
                <h3 className="why__title">{item.title}</h3>
                <p className="why__text">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="page-width section" aria-labelledby="brand-story-heading">
        <div className="story">
          <div>
            <h2 id="brand-story-heading" className="story__title">
              {copy.brandStoryTitle.replace(". ", ".\n")}
            </h2>
            <p className="lead">{copy.brandStoryLead}</p>
            <Link href="/professionals" className="button">
              {copy.exploreProfessionals}
              <Icon name="arrow-right" size={18} />
            </Link>
          </div>
          <Reveal from="right" delayMs={80}>
            <div className="story__frame">
              <Image
                src={BRAND_STORY_IMAGE.src}
                alt={BRAND_STORY_IMAGE.alt}
                width={BRAND_STORY_IMAGE.width}
                height={BRAND_STORY_IMAGE.height}
                className="story__image"
                sizes="(min-width: 64rem) 640px, calc(100vw - 2.5rem)"
              />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="page-width section" aria-labelledby="home-cta-heading">
        <div className="cta-band">
          <SceneBackdrop variant="cta" />
          <div>
            <h2 id="home-cta-heading" className="cta-band__title">
              {copy.homeCtaTitle}
            </h2>
            <p className="cta-band__text">{copy.homeCtaBody}</p>
          </div>
          <div>
            <div className="stack">
              <Link href="/search" className="button button-on-brand button-lg">
                {copy.findProfessional}
                <Icon name="arrow-right" size={18} />
              </Link>
              <Link href="/services" className="button button-ghost-on-brand button-lg">
                {copy.homeCtaSecondary}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
