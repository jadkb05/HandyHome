import type { Metadata } from "next";
import { SearchExperience } from "@/components/search/SearchExperience";
import { SearchForm } from "@/components/search/SearchForm";
import { UseMyLocationButton } from "@/components/search/UseMyLocationButton";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { copy } from "@/content/en";
import {
  InvalidSearchParamsError,
  listSearchLocations,
  parseSearchParams,
  searchProfessionals,
  type SearchFilters,
  type SearchProfessional,
} from "@/features/search";
import { listServices } from "@/features/services";

export const metadata: Metadata = {
  title: copy.searchTitle,
};

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function resultCountLabel(count: number): string {
  if (count === 1) {
    return copy.searchCountOne;
  }
  return copy.searchCountMany.replace("{count}", String(count));
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const raw = await searchParams;

  let filters: SearchFilters;
  try {
    filters = parseSearchParams(raw);
  } catch (error) {
    if (error instanceof InvalidSearchParamsError) {
      return (
        <>
          <h1 className="page-title">{copy.searchTitle}</h1>
          <p className="form-alert" role="alert">
            {copy.searchInvalid}
          </p>
        </>
      );
    }
    throw error;
  }

  const [servicesResult, locationsResult, searchResult] = await Promise.allSettled([
    listServices(),
    listSearchLocations(),
    searchProfessionals(filters),
  ]);

  if (servicesResult.status === "rejected" || locationsResult.status === "rejected") {
    return (
      <>
        <h1 className="page-title">{copy.searchTitle}</h1>
        <p className="form-alert" role="alert">
          {copy.searchQueryError}
        </p>
      </>
    );
  }

  const services = servicesResult.value;
  const locations = locationsResult.value;
  const queryFailed = searchResult.status === "rejected";
  const professionals: SearchProfessional[] = queryFailed ? [] : searchResult.value;
  const showNearestNote = filters.sort === "nearest" && (filters.lat == null || filters.lng == null);

  return (
    <>
      <section className="search-hero">
        <h1 className="page-title">{copy.searchTitle}</h1>
        <p className="lead">{copy.searchLead}</p>
        <SearchForm
          key={JSON.stringify(filters)}
          filters={filters}
          services={services.map((service) => ({ slug: service.slug, name: service.name }))}
          cities={locations.cities}
          neighborhoods={locations.neighborhoods}
        />
        <UseMyLocationButton filters={filters} />
      </section>
      {showNearestNote ? <p className="section-note">{copy.nearestNeedsLocation}</p> : null}
      {queryFailed ? (
        <p className="form-alert" role="alert">
          {copy.searchQueryError}
        </p>
      ) : professionals.length === 0 ? (
        <div data-testid="search-empty">
          <EmptyState hint={copy.searchEmptyHint} action={{ href: "/search", label: copy.clearFilters }}>
            {copy.searchEmpty}
          </EmptyState>
        </div>
      ) : (
        <p className="search-count" data-testid="search-count">
          <Icon name="pin" size={20} />
          {resultCountLabel(professionals.length)}
        </p>
      )}
      {!queryFailed && professionals.length > 0 ? (
        <section aria-labelledby="search-results-heading">
          <h2 id="search-results-heading" className="sr-only">
            {copy.searchResultsHeading}
          </h2>
          <SearchExperience professionals={professionals} />
        </section>
      ) : null}
    </>
  );
}
