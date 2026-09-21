"use client";

import { useActionState } from "react";
import { copy } from "@/content/en";
import { useFocusAfterSubmit } from "@/components/useFocusAfterSubmit";
import { createReviewAction, type ReviewActionState } from "@/features/reviews/actions";

const initialState: ReviewActionState = { error: null, saved: false };
const ratings = [1, 2, 3, 4, 5] as const;

export function ReviewForm({ bookingId }: { bookingId: string }) {
  const [state, action, pending] = useActionState(createReviewAction, initialState);
  const formRef = useFocusAfterSubmit<HTMLFormElement>(pending);

  return (
    <form ref={formRef} className="booking-decision" action={action} data-testid="review-form">
      {state.error ? (
        <p className="form-alert" role="alert">
          {state.error}
        </p>
      ) : null}
      <input type="hidden" name="bookingId" value={bookingId} />
      <p className="section-note">{copy.reviewPrompt}</p>
      <fieldset className="rating-fieldset">
        <legend>
          {copy.reviewRating} <span className="role-hint">({copy.reviewRatingRequired})</span>
        </legend>
        <div className="rating-options">
          {ratings.map((value) => (
            <label key={value} className="rating-option">
              <input
                type="radio"
                name="rating"
                value={value}
                required
                data-testid={`review-rating-${value}`}
              />
              <span aria-hidden="true">★</span>
              <span>{value}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="field">
        <span>
          {copy.reviewComment} <span className="role-hint">({copy.reviewCommentOptional})</span>
        </span>
        <textarea name="comment" maxLength={2000} rows={3} data-testid="review-comment" />
      </label>
      <button type="submit" className="button" disabled={pending} data-testid="submit-review">
        {copy.submitReview}
      </button>
    </form>
  );
}
