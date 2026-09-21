import Link from "next/link";
import { copy } from "@/content/en";
import { Icon, type IconName } from "@/components/ui/Icon";

export function EmptyState({
  children,
  hint,
  testId,
  icon = "search",
  action,
}: {
  children: string;
  hint?: string;
  testId?: string;
  icon?: IconName;
  action?: { href: string; label: string };
}) {
  return (
    <div className="empty-panel" data-testid={testId} role="status">
      <span className="empty-panel__icon">
        <Icon name={icon} size={24} />
      </span>
      <p className="empty-state">{children}</p>
      {hint ? <p className="section-note">{hint}</p> : null}
      {action ? (
        <Link href={action.href} className="button button-secondary">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

/** Skeleton placeholder for route loading states. The text is announced, the shapes are decorative. */
export function LoadingState({ children = copy.searchLoading }: { children?: string }) {
  return (
    <div role="status">
      <span className="sr-only">{children}</span>
      <div className="skeleton-grid" aria-hidden="true">
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    </div>
  );
}
