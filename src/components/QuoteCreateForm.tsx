"use client";

import { useActionState } from "react";
import { copy } from "@/content/en";
import { useFocusAfterSubmit } from "@/components/useFocusAfterSubmit";
import { createQuoteAction, type QuoteActionState } from "@/features/quotes/actions";

const initialState: QuoteActionState = { error: null, saved: false };

export function QuoteCreateForm({ bookingId }: { bookingId: string }) {
  const [state, action, pending] = useActionState(createQuoteAction, initialState);
  const formRef = useFocusAfterSubmit<HTMLFormElement>(pending);

  return (
    <form ref={formRef} className="booking-decision" action={action} data-testid="create-quote-form">
      {state.error ? (
        <p className="form-alert" role="alert">
          {state.error}
        </p>
      ) : null}
      <p className="section-note">{copy.quotePending}</p>
      <input type="hidden" name="bookingId" value={bookingId} />
      <label className="field">
        <span>{copy.quoteAmount}</span>
        <input
          type="text"
          name="amount"
          inputMode="decimal"
          required
          autoComplete="off"
          aria-describedby={`amount-hint-${bookingId}`}
          data-testid="quote-amount-input"
        />
        <span id={`amount-hint-${bookingId}`} className="role-hint">
          {copy.amountHint}
        </span>
      </label>
      <label className="field">
        <span>{copy.quoteDescription}</span>
        <textarea name="notes" required maxLength={2000} rows={3} data-testid="quote-notes" />
      </label>
      <button type="submit" className="button" disabled={pending} data-testid="send-quote">
        {copy.sendQuote}
      </button>
    </form>
  );
}
