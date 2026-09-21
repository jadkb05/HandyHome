import { getPrisma } from "@/lib/db";
import { formatAverageRating } from "@/features/reviews/rating";

export type ReviewSummary = {
  count: number;
  average: number | null;
  averageLabel: string | null;
};

const EMPTY: ReviewSummary = { count: 0, average: null, averageLabel: null };

/** One aggregate query instead of loading every review row. */
export async function reviewSummariesFor(providerIds: string[]): Promise<Map<string, ReviewSummary>> {
  const summaries = new Map<string, ReviewSummary>();
  if (providerIds.length === 0) {
    return summaries;
  }
  const rows = await getPrisma().review.groupBy({
    by: ["providerId"],
    where: { providerId: { in: providerIds } },
    _avg: { rating: true },
    _count: { _all: true },
  });
  for (const row of rows) {
    const average = row._avg.rating;
    summaries.set(
      row.providerId,
      average == null
        ? EMPTY
        : { count: row._count._all, average, averageLabel: formatAverageRating(average) },
    );
  }
  return summaries;
}

export function summaryOrEmpty(map: Map<string, ReviewSummary>, providerId: string): ReviewSummary {
  return map.get(providerId) ?? EMPTY;
}
