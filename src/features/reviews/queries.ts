import { getPrisma } from "@/lib/db";
import { publicAuthorName } from "@/features/reviews/display-name";
import { summarizeReviews, type ProviderReviewSummary, type PublicReview } from "@/features/reviews/rating";

const publicReviewSelect = {
  id: true,
  rating: true,
  comment: true,
  createdAt: true,
  client: { select: { name: true } },
} as const;

function toPublicReview(row: {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  client: { name: string };
}): PublicReview {
  return {
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.createdAt,
    authorName: publicAuthorName(row.client.name) ?? "",
  };
}

export async function listPublicReviewsForProvider(providerId: string): Promise<ProviderReviewSummary> {
  const rows = await getPrisma().review.findMany({
    where: { providerId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: publicReviewSelect,
  });
  return summarizeReviews(rows.map(toPublicReview));
}

export const PUBLIC_REVIEW_FIELDS = ["id", "rating", "comment", "createdAt", "authorName"] as const;
