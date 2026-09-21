import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listedProfessionalToCard, ProfessionalCard } from "@/components/ProfessionalCard";
import { EmptyState } from "@/components/EmptyState";
import { copy } from "@/content/en";
import { getServiceBySlug } from "@/features/services";
import { SERVICE_MEDIA } from "@/content/media";
import Image from "next/image";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) {
    return { title: copy.notFoundTitle };
  }
  return { title: service.name };
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) {
    notFound();
  }

  const professionals = service.providers.map((item) => item.provider);
  const media = SERVICE_MEDIA[service.slug];

  return (
    <>
      <header className="service-hero">
        {media ? (
          <div className="service-hero__media">
            <Image src={media.src} alt={media.alt} width={900} height={600} sizes="(min-width: 48rem) 40vw, 100vw" className="service-hero__image" priority />
          </div>
        ) : null}
        <div>
          <p className="eyebrow">{copy.servicesTitle}</p>
          <h1 className="page-title">{service.name}</h1>
          {service.description ? <p className="lead">{service.description}</p> : null}
        </div>
      </header>

      <section className="section" aria-labelledby="service-professionals-heading">
        <h2 id="service-professionals-heading" className="section-title">
          {copy.professionalsTitle}
        </h2>
        {professionals.length === 0 ? (
          <EmptyState icon="user" action={{ href: "/search", label: copy.findProfessional }}>
            {copy.emptyServiceProfessionals}
          </EmptyState>
        ) : (
          <ul className="pro-grid" data-testid="service-professionals">
            {professionals.map((professional) => (
              <li key={professional.id}>
                <ProfessionalCard professional={listedProfessionalToCard(professional)} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
