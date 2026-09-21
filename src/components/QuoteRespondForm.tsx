"use client";

import { useActionState } from "react";
import { copy } from "@/content/en";
import { useFocusAfterSubmit } from "@/components/useFocusAfterSubmit";
import { respondToQuoteAction, type QuoteActionState } from "@/features/quotes/actions";

const initialState: QuoteActionState = { error: null, saved: false };

export function QuoteRespondForm({ quoteId }: { quoteId: string }) {
  const [state, action, pending] = useActionState(respondToQuoteAction, initialState);
  const formRef = useFocusAfterSubmit<HTMLFormElement>(pending);

  return (
    <form ref={formRef} className="booking-decision" action={action} data-testid="quote-respond-form">
      {state.error ? (
        <p className="form-alert" role="alert">
          {state.error}
        </p>
      ) : null}
      <input type="hidden" name="quoteId" value={quoteId} />
      <div className="stack">
        <button
          type="submit"
          name="decision"
          value="accept"
          className="button"
          disabled={pending}
          data-testid="accept-quote"
        >
          {copy.acceptQuote}
        </button>
        <button
          type="submit"
          name="decision"
          value="decline"
          className="button button-secondary"
          disabled={pending}
          data-testid="decline-quote"
        >
          {copy.declineQuote}
        </button>
      </div>
    </form>
  );
}
