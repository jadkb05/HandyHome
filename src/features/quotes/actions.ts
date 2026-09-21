"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { publicQuoteMessage } from "@/features/quotes/errors";
import { createQuoteForIdentity, respondToQuoteForIdentity } from "@/features/quotes/service";

export type QuoteActionState = {
  error: string | null;
  saved: boolean;
};

export async function createQuoteAction(
  _previous: QuoteActionState,
  formData: FormData,
): Promise<QuoteActionState> {
  try {
    await createQuoteForIdentity(await requireAuth(), {
      bookingId: String(formData.get("bookingId") ?? ""),
      amount: String(formData.get("amount") ?? ""),
      notes: String(formData.get("notes") ?? ""),
      claimedProviderId: String(formData.get("providerId") ?? "") || undefined,
    });
    revalidatePath("/dashboard");
    revalidatePath("/professional/dashboard");
    return { error: null, saved: true };
  } catch (error) {
    return { error: publicQuoteMessage(error), saved: false };
  }
}

export async function respondToQuoteAction(
  _previous: QuoteActionState,
  formData: FormData,
): Promise<QuoteActionState> {
  try {
    await respondToQuoteForIdentity(await requireAuth(), {
      quoteId: String(formData.get("quoteId") ?? ""),
      decision: String(formData.get("decision") ?? ""),
      claimedClientId: String(formData.get("clientId") ?? "") || undefined,
    });
    revalidatePath("/dashboard");
    revalidatePath("/professional/dashboard");
    return { error: null, saved: true };
  } catch (error) {
    return { error: publicQuoteMessage(error), saved: false };
  }
}
