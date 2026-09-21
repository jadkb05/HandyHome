"use client";

import { useActionState } from "react";
import { copy } from "@/content/en";
import { useFocusAfterSubmit } from "@/components/useFocusAfterSubmit";
import { completeDiagnosisAction, type DiagnosisActionState } from "@/features/diagnosis/actions";

const initialState: DiagnosisActionState = { error: null, saved: false };

export function CompleteDiagnosisForm({
  bookingId,
  defaultFindings,
}: {
  bookingId: string;
  defaultFindings: string;
}) {
  const [state, action, pending] = useActionState(completeDiagnosisAction, initialState);
  const formRef = useFocusAfterSubmit<HTMLFormElement>(pending);

  return (
    <form ref={formRef} className="booking-decision" action={action} data-testid="complete-diagnosis-form">
      {state.error ? (
        <p className="form-alert" role="alert">
          {state.error}
        </p>
      ) : null}
      <input type="hidden" name="bookingId" value={bookingId} />
      <label className="field">
        <span>{copy.diagnosisFindings}</span>
        <textarea
          name="findings"
          required
          minLength={8}
          maxLength={2000}
          rows={4}
          defaultValue={defaultFindings}
          data-testid="diagnosis-findings"
        />
      </label>
      <button type="submit" className="button" disabled={pending} data-testid="complete-diagnosis">
        {copy.completeDiagnosis}
      </button>
    </form>
  );
}
