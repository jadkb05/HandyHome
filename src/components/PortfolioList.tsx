import Image from "next/image";
import { copy } from "@/content/en";
import { resolvePortfolioSrc } from "@/lib/media/public";

type PortfolioRow = {
  id: string;
  title: string | null;
  altText: string | null;
  url: string | null;
  mediaKey: string;
};

export function PortfolioList({ items }: { items: PortfolioRow[] }) {
  if (items.length === 0) {
    return <p className="empty-state">{copy.emptyPortfolio}</p>;
  }

  return (
    <ul className="portfolio-grid">
      {items.map((item) => {
        const src = resolvePortfolioSrc(item);
        const label = item.altText || item.title || copy.portfolioItemFallback;
        return (
          <li key={item.id} className="portfolio-item">
            {src ? (
              <Image src={src} alt={label} width={640} height={400} className="portfolio-image" />
            ) : (
              <div className="portfolio-placeholder">{label}</div>
            )}
            {item.title ? <p className="portfolio-caption">{item.title}</p> : null}
          </li>
        );
      })}
    </ul>
  );
}
