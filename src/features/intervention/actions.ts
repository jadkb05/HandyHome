"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { publicInterventionMessage } from "@/features/intervention/errors";
import {
  completeInterventionForIdentity,
  startInterventionForIdentity,
} from "@/features/intervention/service";

export type InterventionActionState = {
  error: string | null;
  saved: boolean;
};

export async function startInterventionAction(
  _previous: InterventionActionState,
  formData: FormData,
): Promise<InterventionActionState> {
  try {
    await startInterventionForIdentity(await requireAuth(), {
      bookingId: String(formData.get("bookingId") ?? ""),
      claimedProviderId: String(formData.get("providerId") ?? "") || undefined,
    });
    revalidatePath("/dashboard");
    revalidatePath("/professional/dashboard");
    return { error: null, saved: true };
  } catch (error) {
    return { error: publicInterventionMessage(error), saved: false };
  }
}

export async function completeInterventionAction(
  _previous: InterventionActionState,
  formData: FormData,
): Promise<InterventionActionState> {
  try {
    await completeInterventionForIdentity(await requireAuth(), {
      bookingId: String(formData.get("bookingId") ?? ""),
      claimedProviderId: String(formData.get("providerId") ?? "") || undefined,
    });
    revalidatePath("/dashboard");
    revalidatePath("/professional/dashboard");
    return { error: null, saved: true };
  } catch (error) {
    return { error: publicInterventionMessage(error), saved: false };
  }
}
