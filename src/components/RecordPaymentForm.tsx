"use client";

import { useActionState } from "react";
import { copy } from "@/content/en";
import { useFocusAfterSubmit } from "@/components/useFocusAfterSubmit";
import { recordPaymentAction, type PaymentActionState } from "@/features/payments/actions";

const initialState: PaymentActionState = { error: null, saved: false };

export function RecordPaymentForm({ bookingId }: { bookingId: string }) {
  const [state, action, pending] = useActionState(recordPaymentAction, initialState);
  const formRef = useFocusAfterSubmit<HTMLFormElement>(pending);

  return (
    <form ref={formRef} className="booking-decision" action={action} data-testid="record-payment-form">
      {state.error ? (
        <p className="form-alert" role="alert">
          {state.error}
        </p>
      ) : null}
      <input type="hidden" name="bookingId" value={bookingId} />
      <p className="section-note">{copy.recordPaymentHint}</p>
      <button type="submit" className="button" disabled={pending} data-testid="record-payment">
        {copy.recordPayment}
      </button>
    </form>
  );
}
