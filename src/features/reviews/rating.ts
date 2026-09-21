export function formatAverageRating(average: number): string {
  return (Math.round(average * 10) / 10).toFixed(1);
}

export type PublicReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  authorName: string;
};

export type ProviderReviewSummary = {
  average: number | null;
  averageLabel: string | null;
  count: number;
  reviews: PublicReview[];
};

export function averageFromRatings(ratings: number[]): {
  average: number | null;
  averageLabel: string | null;
  count: number;
} {
  if (ratings.length === 0) {
    return { average: null, averageLabel: null, count: 0 };
  }
  const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  return {
    average,
    averageLabel: formatAverageRating(average),
    count: ratings.length,
  };
}

export function summarizeReviews(reviews: PublicReview[]): ProviderReviewSummary {
  return {
    ...averageFromRatings(reviews.map((review) => review.rating)),
    reviews,
  };
}
