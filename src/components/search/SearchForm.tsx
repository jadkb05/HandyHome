import { copy } from "@/content/en";
import { searchDateWindow, type SearchFilters } from "@/features/search";

type SearchFormProps = {
  filters: SearchFilters;
  services: { slug: string; name: string }[];
  cities: string[];
};

export function SearchForm({ filters, services, cities }: SearchFormProps) {
  const dates = searchDateWindow();

  return (
    <form className="search-form" method="get" action="/search" data-testid="search-form">
      <label className="field">
        <span>{copy.searchService}</span>
        <select name="service" defaultValue={filters.service ?? ""}>
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
        <input
          type="text"
          name="city"
          defaultValue={filters.city ?? ""}
          list="search-cities"
          autoComplete="address-level2"
        />
        <datalist id="search-cities">
          {cities.map((city) => (
            <option key={city} value={city} />
          ))}
        </datalist>
      </label>
      <label className="field">
        <span>{copy.searchDate}</span>
        <input
          type="date"
          name="date"
          defaultValue={filters.date ?? ""}
          min={dates.min}
          max={dates.max}
          aria-describedby="search-date-hint"
          data-testid="search-date"
        />
        <span id="search-date-hint" className="field-hint">
          {copy.searchAnyDate}
        </span>
      </label>
      <label className="field">
        <span>{copy.searchSort}</span>
        <select name="sort" defaultValue={filters.sort}>
          <option value="name">{copy.sortName}</option>
          <option value="nearest">{copy.sortNearest}</option>
        </select>
      </label>
      <div className="search-form__actions">
        {filters.lat != null && filters.lng != null ? (
          <>
            <input type="hidden" name="lat" value={String(filters.lat)} />
            <input type="hidden" name="lng" value={String(filters.lng)} />
          </>
        ) : null}
        <button type="submit" className="button">
          {copy.searchSubmit}
        </button>
      </div>
    </form>
  );
}
