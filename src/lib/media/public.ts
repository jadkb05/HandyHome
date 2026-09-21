/**
 * Demo/public media stays in the repository. Paid object storage is not selected (T-03).
 */
export function resolvePortfolioSrc(item: { url: string | null; mediaKey: string }): string | null {
  if (item.url && item.url.startsWith("/")) {
    return item.url;
  }
  return null;
}
