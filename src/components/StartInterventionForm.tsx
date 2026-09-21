"use client";

import { useActionState } from "react";
import { copy } from "@/content/en";
import { useFocusAfterSubmit } from "@/components/useFocusAfterSubmit";
import { startInterventionAction, type InterventionActionState } from "@/features/intervention/actions";

const initialState: InterventionActionState = { error: null, saved: false };

export function StartInterventionForm({ bookingId }: { bookingId: string }) {
  const [state, action, pending] = useActionState(startInterventionAction, initialState);
  const formRef = useFocusAfterSubmit<HTMLFormElement>(pending);

  return (
    <form ref={formRef} className="booking-decision" action={action} data-testid="start-intervention-form">
      {state.error ? (
        <p className="form-alert" role="alert">
          {state.error}
        </p>
      ) : null}
      <input type="hidden" name="bookingId" value={bookingId} />
      <button type="submit" className="button" disabled={pending} data-testid="start-intervention">
        {copy.startIntervention}
      </button>
    </form>
  );
}
