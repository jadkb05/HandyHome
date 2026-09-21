"use server";

import { revalidatePath } from "next/cache";
import { requireRole, UserRole } from "@/lib/auth";
import { publicProfileError, type ProfileFieldErrors } from "@/features/professionals/errors";
import { updateProviderProfileForIdentity } from "@/features/professionals/profile";

export type ProfileActionState = {
  error: string | null;
  saved: boolean;
  fieldErrors: ProfileFieldErrors;
};

export async function updateOwnProviderProfileAction(
  _previous: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  try {
    const identity = await requireRole(UserRole.PROFESSIONAL);
    const updated = await updateProviderProfileForIdentity(identity, {
      profession: String(formData.get("profession") ?? ""),
      description: String(formData.get("description") ?? ""),
      city: String(formData.get("city") ?? ""),
      serviceIds: formData.getAll("serviceIds").map(String),
      claimedProviderId: String(formData.get("providerId") ?? "") || undefined,
      claimedOwnerId: String(formData.get("userId") ?? "") || undefined,
    });
    revalidatePath("/");
    revalidatePath("/professionals");
    revalidatePath("/search");
    revalidatePath("/services", "layout");
    revalidatePath(`/professionals/${updated.id}`);
    revalidatePath("/professional/profile");
    revalidatePath("/professional/dashboard");
    return { error: null, saved: true, fieldErrors: {} };
  } catch (error) {
    const { message, fieldErrors } = publicProfileError(error);
    return { error: message, saved: false, fieldErrors };
  }
}
