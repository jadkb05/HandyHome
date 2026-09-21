import Link from "next/link";
import Image from "next/image";
import { copy } from "@/content/en";
import { SERVICE_MEDIA } from "@/content/media";
import { Icon, serviceIcon } from "@/components/ui/Icon";
import type { ListedService } from "@/features/services";

export function ServiceCard({
  service,
  headingLevel: Heading = "h3",
}: {
  service: ListedService;
  headingLevel?: "h2" | "h3";
}) {
  const count = service._count.providers;
  // A count of 0 or 1 reads as sparse on every card, so it only appears once it says something useful.
  const countLabel =
    count > 1 ? copy.professionalCountMany.replace("{count}", String(count)) : copy.viewService;
  const media = SERVICE_MEDIA[service.slug];

  return (
    <Link href={`/services/${service.slug}`} className="service-tile">
      {media ? (
        <div className="service-tile__media" aria-hidden="true">
          <Image
            src={media.src}
            alt=""
            width={900}
            height={600}
            sizes="(min-width: 64rem) 25rem, (min-width: 40rem) 33vw, 50vw"
            className="service-tile__image"
          />
        </div>
      ) : null}
      <div className="service-tile__body">
        <span className="service-tile__icon">
          <Icon name={serviceIcon(service.slug)} size={20} />
        </span>
        <Heading className="service-tile__title">{service.name}</Heading>
        {service.description ? <p className="service-tile__desc">{service.description}</p> : null}
        <p className="service-tile__meta">
          <span>{countLabel}</span>
          <span className="service-tile__arrow" aria-hidden="true">
            <Icon name="arrow-right" size={16} />
          </span>
        </p>
      </div>
    </Link>
  );
}
