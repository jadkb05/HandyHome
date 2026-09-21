import { copy } from "@/content/en";
import { formatInBusinessTimezone } from "@/lib/datetime";
import type { ProviderReviewSummary } from "@/features/reviews";
import { StarDisplay } from "@/components/StarDisplay";

function reviewCountLabel(count: number): string {
  if (count === 1) {
    return copy.reviewCountOne;
  }
  return copy.reviewCountMany.replace("{count}", String(count));
}

export function ProfessionalReviews({ summary }: { summary: ProviderReviewSummary }) {
  return (
    <section className="section" aria-labelledby="reviews-heading" data-testid="profile-reviews">
      <h2 id="reviews-heading" className="section-title">
        {copy.reviewsTitle}
      </h2>
      {summary.count === 0 ? (
        <p className="empty-state" data-testid="no-reviews">
          {copy.noReviewsYet}
        </p>
      ) : (
        <>
          <p data-testid="review-summary" className="market-card__rating">
            {summary.average != null ? <StarDisplay rating={summary.average} /> : null}
            <strong data-testid="review-average">{summary.averageLabel}</strong>
            {" · "}
            <span data-testid="review-count">{reviewCountLabel(summary.count)}</span>
          </p>
          <ul className="review-list">
            {summary.reviews.map((review) => (
              <li key={review.id} className="review-item" data-testid="public-review">
                <p className="market-card__rating">
                  <StarDisplay rating={review.rating} />
                  <span className="booking-label">{copy.reviewRating}</span>
                  <span>{review.rating} / 5</span>
                </p>
                {review.comment ? <p data-testid="review-comment-text">{review.comment}</p> : null}
                <p className="market-card__meta">
                  {review.authorName.trim() || copy.reviewAuthorFallback}
                  {" · "}
                  {formatInBusinessTimezone(review.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
