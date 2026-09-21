import { BookingStatus, PaymentStatus, Prisma } from "@prisma/client";
import { assertOwnership, ownerIdFromSession } from "@/lib/auth/ownership";
import { UserRole, type AuthIdentity } from "@/lib/auth/types";
import { getPrisma } from "@/lib/db";
import { bookingDetailInclude } from "@/features/bookings/create";
import { ReviewError } from "@/features/reviews/errors";
import { createReviewSchema } from "@/features/reviews/validation";

function assertClient(identity: AuthIdentity | null): AuthIdentity {
  if (!identity) {
    throw new ReviewError("UNAUTHENTICATED", "Sign in to leave a review.");
  }
  if (identity.role !== UserRole.CLIENT) {
    throw new ReviewError("FORBIDDEN_ROLE", "Only the client who booked this intervention can leave a review.");
  }
  return identity;
}

export async function createReviewForIdentity(identity: AuthIdentity | null, input: unknown) {
  const client = assertClient(identity);
  const parsed = createReviewSchema.safeParse(input);
  if (!parsed.success) {
    const path = parsed.error.issues[0]?.path[0];
    throw new ReviewError(
      path === "comment" ? "INVALID_COMMENT" : "INVALID_RATING",
      parsed.error.issues[0]?.message ?? "Choose a rating from 1 to 5.",
    );
  }

  try {
    return await getPrisma().$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: parsed.data.bookingId },
        include: bookingDetailInclude,
      });
      if (!booking) {
        throw new ReviewError("BOOKING_NOT_FOUND", "That booking was not found.");
      }
      assertOwnership(ownerIdFromSession(client, parsed.data.claimedClientId), booking.clientId);

      if (booking.status !== BookingStatus.COMPLETED) {
        throw new ReviewError(
          "ILLEGAL_TRANSITION",
          "You can leave a review only after the intervention is completed.",
        );
      }
      if (!booking.payment || booking.payment.status !== PaymentStatus.PAID) {
        throw new ReviewError(
          "PAYMENT_REQUIRED",
          "Payment must be completed before leaving a review.",
        );
      }
      if (booking.review) {
        throw new ReviewError("ALREADY_REVIEWED", "A review has already been submitted for this booking.");
      }

      return tx.review.create({
        data: {
          bookingId: booking.id,
          clientId: booking.clientId,
          providerId: booking.providerId,
          rating: parsed.data.rating,
          comment: parsed.data.comment,
        },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ReviewError("ALREADY_REVIEWED", "A review has already been submitted for this booking.");
    }
    throw error;
  }
}
