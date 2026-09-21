"use client";

import { useActionState } from "react";
import { copy } from "@/content/en";
import { useFocusAfterSubmit } from "@/components/useFocusAfterSubmit";
import {
  respondToBookingAction,
  type BookingDecisionActionState,
} from "@/features/bookings/actions";

const initialState: BookingDecisionActionState = { error: null, saved: false };

export function BookingDecisionForm({ bookingId }: { bookingId: string }) {
  const [state, action, pending] = useActionState(respondToBookingAction, initialState);
  const formRef = useFocusAfterSubmit<HTMLFormElement>(pending);

  return (
    <form ref={formRef} className="booking-decision" action={action}>
      {state.error ? (
        <p className="form-alert" role="alert">
          {state.error}
        </p>
      ) : null}
      <input type="hidden" name="bookingId" value={bookingId} />
      <div className="stack">
        <button
          type="submit"
          name="decision"
          value="accept"
          className="button"
          disabled={pending}
        >
          {copy.bookingAccept}
        </button>
        <button
          type="submit"
          name="decision"
          value="reject"
          className="button button-secondary"
          disabled={pending}
        >
          {copy.bookingReject}
        </button>
      </div>
    </form>
  );
}
