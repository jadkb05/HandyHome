import Link from "next/link";
import Image from "next/image";
import type { MouseEvent } from "react";
import { copy } from "@/content/en";
import { formatPublicLocation, verificationLabel } from "@/lib/location";
import { formatDistanceKm } from "@/lib/maps/distance";
import type { ListedProfessional } from "@/features/professionals";
import type { SearchProfessional } from "@/features/search";
import { StarDisplay } from "@/components/StarDisplay";
import { Icon } from "@/components/ui/Icon";

export type ProfessionalCardData = {
  id: string;
  name: string;
  profession: string;
  city: string;
  neighborhood?: string | null;
  image?: string | null;
  verified: boolean;
  services: string[];
  reviewCount: number;
  averageLabel: string | null;
  averageRating: number | null;
};

export function listedProfessionalToCard(professional: ListedProfessional): ProfessionalCardData {
  const summary = professional.reviewSummary;
  return {
    id: professional.id,
    name: professional.user.name,
    profession: professional.profession,
    city: professional.city,
    neighborhood: professional.address,
    image: professional.user.image,
    verified: professional.verified,
    services: professional.services.map((item) => item.service.name),
    reviewCount: summary.count,
    averageLabel: summary.averageLabel,
    averageRating: summary.average,
  };
}

export function searchProfessionalToCard(professional: SearchProfessional): ProfessionalCardData {
  return {
    id: professional.id,
    name: professional.name,
    profession: professional.profession,
    city: professional.city,
    neighborhood: professional.neighborhood,
    image: professional.image,
    verified: professional.verified,
    services: professional.services.map((service) => service.name),
    reviewCount: professional.reviewCount,
    averageLabel: professional.averageLabel,
    averageRating: professional.averageRating,
  };
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function reviewState(professional: ProfessionalCardData) {
  if (professional.reviewCount === 0 || !professional.averageLabel) {
    return { label: copy.newProfessional, rated: false as const };
  }
  const countLabel =
    professional.reviewCount === 1
      ? copy.reviewCountOne
      : copy.reviewCountMany.replace("{count}", String(professional.reviewCount));
  return {
    label: `${professional.averageLabel} · ${countLabel}`,
    rated: true as const,
  };
}

type ProfessionalCardProps = {
  professional: ProfessionalCardData;
  distanceKm?: number | null;
  selected?: boolean;
  selectable?: boolean;
  onSelect?: (id: string) => void;
  variant?: "directory" | "compact";
  /** Selectable cards expose a real button so keyboard users can locate the professional. */
  canShowOnMap?: boolean;
};

export function ProfessionalCard({
  professional,
  distanceKm,
  selected = false,
  selectable = false,
  onSelect,
  variant = "directory",
  canShowOnMap = false,
}: ProfessionalCardProps) {
  const location = formatPublicLocation(professional.city, professional.neighborhood);
  const status = verificationLabel(professional.verified);
  const href = `/professionals/${professional.id}`;
  const photo = professional.image?.startsWith("/") ? professional.image : null;
  const reviews = reviewState(professional);
  const tags = professional.services.slice(0, variant === "compact" ? 2 : 3);

  function handleSelect(event: MouseEvent) {
    if ((event.target as HTMLElement).closest("a, button")) {
      return;
    }
    onSelect?.(professional.id);
  }

  const media = (
    <div className="pro-card__media" aria-hidden={photo ? true : undefined}>
      {photo ? (
        <Image
          src={photo}
          alt=""
          width={variant === "compact" ? 160 : 640}
          height={variant === "compact" ? 200 : 480}
          sizes={variant === "compact" ? "8rem" : "(min-width: 64rem) 25rem, (min-width: 40rem) 50vw, 100vw"}
          className="pro-card__image"
        />
      ) : (
        <span className="pro-card__fallback">{initials(professional.name) || "P"}</span>
      )}
      <span className="pro-card__badge">{professional.profession}</span>
    </div>
  );

  const details = (
    <>
      {variant === "compact" ? <p className="pro-card__loc">{professional.profession}</p> : null}
      <p className="pro-card__loc">
        <Icon name="pin" size={16} />
        <span>{location}</span>
        {distanceKm != null ? <span className="pro-card__dist">{formatDistanceKm(distanceKm)}</span> : null}
      </p>
      <p className="pro-card__rating">
        {reviews.rated && professional.averageRating != null ? (
          <>
            <StarDisplay rating={professional.averageRating} />
            <span>{reviews.label}</span>
          </>
        ) : (
          <span className="pro-card__new">{reviews.label}</span>
        )}
      </p>
      {tags.length > 0 ? (
        <ul className="pro-card__tags">
          {tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      ) : null}
    </>
  );

  const foot = (
    <p className="pro-card__status">
      <span className="status-dot" aria-hidden="true" data-verified={professional.verified} />
      {status}
    </p>
  );

  return (
    <article
      className="pro-card"
      data-variant={variant}
      data-selected={selected}
      data-testid={`professional-card-${professional.id}`}
      onClick={selectable ? handleSelect : undefined}
    >
      {selectable ? (
        <div className="pro-card__link">
          {media}
          <div className="pro-card__body">
            <h3 className="pro-card__title">
              <Link href={href}>{professional.name}</Link>
            </h3>
            {details}
            {selected ? <p className="pro-card__selected">{copy.selectedProfessional}</p> : null}
            <div className="pro-card__actions">
              <Link href={href} className="pro-card__cta">
                {copy.viewProfile}
                <Icon name="arrow-right" size={16} />
              </Link>
              {canShowOnMap && onSelect ? (
                <button
                  type="button"
                  className="pro-card__map-button"
                  aria-pressed={selected}
                  aria-label={`${copy.showOnMap}: ${professional.name}`}
                  onClick={() => onSelect(professional.id)}
                >
                  {copy.showOnMap}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <Link href={href} className="pro-card__link">
          {media}
          <div className="pro-card__body">
            <h3 className="pro-card__title">{professional.name}</h3>
            {details}
            <div className="pro-card__foot">
              <span className="price-on-quote">{copy.priceOnQuote}</span>
              <span className="pro-card__cta">
                {copy.viewProfile}
                <Icon name="arrow-right" size={16} />
              </span>
            </div>
            {foot}
          </div>
        </Link>
      )}
    </article>
  );
}
