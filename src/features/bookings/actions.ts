"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { createBookingForIdentity } from "@/features/bookings/create";
import { publicBookingMessage } from "@/features/bookings/errors";
import { respondToBookingForIdentity } from "@/features/bookings/transitions";

export type CreateBookingActionState = {
  error: string | null;
  bookingId: string | null;
};

export type BookingDecisionActionState = {
  error: string | null;
  saved: boolean;
};

export async function createBookingAction(
  _previous: CreateBookingActionState,
  formData: FormData,
): Promise<CreateBookingActionState> {
  try {
    const identity = await requireAuth();
    const booking = await createBookingForIdentity(identity, {
      providerId: String(formData.get("providerId") ?? ""),
      serviceId: String(formData.get("serviceId") ?? ""),
      scheduledAt: String(formData.get("scheduledAt") ?? ""),
      claimedClientId: String(formData.get("clientId") ?? "") || undefined,
    });
    revalidatePath("/dashboard");
    revalidatePath("/professional/dashboard");
    revalidatePath(`/professionals/${booking.providerId}/book`);
    return { error: null, bookingId: booking.id };
  } catch (error) {
    return { error: publicBookingMessage(error), bookingId: null };
  }
}

export async function respondToBookingAction(
  _previous: BookingDecisionActionState,
  formData: FormData,
): Promise<BookingDecisionActionState> {
  try {
    const identity = await requireAuth();
    const booking = await respondToBookingForIdentity(identity, {
      bookingId: String(formData.get("bookingId") ?? ""),
      decision: String(formData.get("decision") ?? ""),
      claimedProviderId: String(formData.get("providerId") ?? "") || undefined,
    });
    revalidatePath("/dashboard");
    revalidatePath("/professional/dashboard");
    revalidatePath(`/professionals/${booking.providerId}/book`);
    return { error: null, saved: true };
  } catch (error) {
    return { error: publicBookingMessage(error), saved: false };
  }
}
