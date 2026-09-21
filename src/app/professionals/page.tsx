import type { Metadata } from "next";
import { listedProfessionalToCard, ProfessionalCard } from "@/components/ProfessionalCard";
import { EmptyState } from "@/components/EmptyState";
import { copy } from "@/content/en";
import { listProfessionals } from "@/features/professionals";
import { listServices } from "@/features/services";

export const metadata: Metadata = {
  title: copy.professionalsTitle,
};

type PageProps = {
  searchParams: Promise<{ service?: string; city?: string }>;
};

export default async function ProfessionalsPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const [professionals, services] = await Promise.all([listProfessionals(), listServices()]);
  const serviceFilter = query.service?.trim() ?? "";
  const cityFilter = query.city?.trim() ?? "";
  const visible = professionals.filter((professional) => {
    const serviceMatch =
      !serviceFilter || professional.services.some((item) => item.service.slug === serviceFilter);
    const cityMatch = !cityFilter || professional.city.toLowerCase() === cityFilter.toLowerCase();
    return serviceMatch && cityMatch;
  });

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">{copy.professionalsHeading}</h1>
        <p className="lead">{copy.professionalsLead}</p>
      </header>
      <form className="search-form search-form--filters" method="get" action="/professionals">
        <label className="field">
          <span>{copy.searchService}</span>
          <select name="service" defaultValue={serviceFilter}>
            <option value="">{copy.allServices}</option>
            {services.map((service) => (
              <option key={service.slug} value={service.slug}>
                {service.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{copy.fieldCity}</span>
          <input type="text" name="city" defaultValue={cityFilter} autoComplete="address-level2" />
        </label>
        <div className="search-form__actions">
          <button type="submit" className="button">
            {copy.searchSubmit}
          </button>
        </div>
      </form>
      {visible.length === 0 ? (
        <EmptyState hint={copy.searchEmptyHint} icon="user" action={{ href: "/professionals", label: copy.clearFilters }}>
          {copy.emptyProfessionals}
        </EmptyState>
      ) : (
        <section aria-labelledby="professionals-results-heading">
          <h2 id="professionals-results-heading" className="sr-only">
            {copy.professionalsTitle}
          </h2>
        <ul className="pro-grid">
          {visible.map((professional) => (
            <li key={professional.id}>
              <ProfessionalCard professional={listedProfessionalToCard(professional)} />
            </li>
          ))}
        </ul>
        </section>
      )}
    </>
  );
}
