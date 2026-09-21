"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { publicPaymentMessage } from "@/features/payments/errors";
import { recordPaymentForIdentity } from "@/features/payments/service";

export type PaymentActionState = {
  error: string | null;
  saved: boolean;
};

export async function recordPaymentAction(
  _previous: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  try {
    await recordPaymentForIdentity(await requireAuth(), {
      bookingId: String(formData.get("bookingId") ?? ""),
      claimedClientId: String(formData.get("clientId") ?? "") || undefined,
      amount: String(formData.get("amount") ?? "") || undefined,
    });
    revalidatePath("/dashboard");
    revalidatePath("/professional/dashboard");
    return { error: null, saved: true };
  } catch (error) {
    return { error: publicPaymentMessage(error), saved: false };
  }
}
