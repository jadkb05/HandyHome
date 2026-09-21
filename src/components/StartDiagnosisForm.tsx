"use client";

import { useActionState } from "react";
import { copy } from "@/content/en";
import { useFocusAfterSubmit } from "@/components/useFocusAfterSubmit";
import { startDiagnosisAction, type DiagnosisActionState } from "@/features/diagnosis/actions";

const initialState: DiagnosisActionState = { error: null, saved: false };

export function StartDiagnosisForm({ bookingId }: { bookingId: string }) {
  const [state, action, pending] = useActionState(startDiagnosisAction, initialState);
  const formRef = useFocusAfterSubmit<HTMLFormElement>(pending);

  return (
    <form ref={formRef} className="booking-decision" action={action} data-testid="start-diagnosis-form">
      {state.error ? (
        <p className="form-alert" role="alert">
          {state.error}
        </p>
      ) : null}
      <input type="hidden" name="bookingId" value={bookingId} />
      <p className="section-note">{copy.diagnosisPending}</p>
      <button type="submit" className="button" disabled={pending} data-testid="start-diagnosis">
        {copy.startDiagnosis}
      </button>
    </form>
  );
}
