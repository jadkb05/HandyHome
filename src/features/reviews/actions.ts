"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { publicReviewMessage } from "@/features/reviews/errors";
import { createReviewForIdentity } from "@/features/reviews/service";

export type ReviewActionState = {
  error: string | null;
  saved: boolean;
};

export async function createReviewAction(
  _previous: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  try {
    const review = await createReviewForIdentity(await requireAuth(), {
      bookingId: String(formData.get("bookingId") ?? ""),
      rating: String(formData.get("rating") ?? ""),
      comment: String(formData.get("comment") ?? ""),
      claimedClientId: String(formData.get("clientId") ?? "") || undefined,
    });
    revalidatePath("/dashboard");
    revalidatePath("/professional/dashboard");
    revalidatePath(`/professionals/${review.providerId}`);
    return { error: null, saved: true };
  } catch (error) {
    return { error: publicReviewMessage(error), saved: false };
  }
}
