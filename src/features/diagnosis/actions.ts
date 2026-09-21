"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { completeDiagnosisForIdentity, startDiagnosisForIdentity } from "@/features/diagnosis/service";
import { publicDiagnosisMessage } from "@/features/diagnosis/errors";

export type DiagnosisActionState = {
  error: string | null;
  saved: boolean;
};

export async function startDiagnosisAction(
  _previous: DiagnosisActionState,
  formData: FormData,
): Promise<DiagnosisActionState> {
  try {
    await startDiagnosisForIdentity(await requireAuth(), {
      bookingId: String(formData.get("bookingId") ?? ""),
      claimedProviderId: String(formData.get("providerId") ?? "") || undefined,
    });
    revalidatePath("/dashboard");
    revalidatePath("/professional/dashboard");
    return { error: null, saved: true };
  } catch (error) {
    return { error: publicDiagnosisMessage(error), saved: false };
  }
}

export async function completeDiagnosisAction(
  _previous: DiagnosisActionState,
  formData: FormData,
): Promise<DiagnosisActionState> {
  try {
    await completeDiagnosisForIdentity(await requireAuth(), {
      bookingId: String(formData.get("bookingId") ?? ""),
      findings: String(formData.get("findings") ?? ""),
      claimedProviderId: String(formData.get("providerId") ?? "") || undefined,
    });
    revalidatePath("/dashboard");
    revalidatePath("/professional/dashboard");
    return { error: null, saved: true };
  } catch (error) {
    return { error: publicDiagnosisMessage(error), saved: false };
  }
}
