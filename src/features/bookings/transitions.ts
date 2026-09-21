import { BookingStatus } from "@prisma/client";
import { assertOwnership, ownerIdFromSession } from "@/lib/auth/ownership";
import { UserRole, type AuthIdentity } from "@/lib/auth/types";
import { getPrisma } from "@/lib/db";
import { bookingDetailInclude } from "@/features/bookings/create";
import { BookingError } from "@/features/bookings/errors";
import { bookingDecisionSchema } from "@/features/bookings/validation";

export function assertProfessionalCanManage(identity: AuthIdentity | null): AuthIdentity {
  if (!identity) {
    throw new BookingError("UNAUTHENTICATED", "Sign in to manage bookings.");
  }
  if (identity.role !== UserRole.PROFESSIONAL) {
    throw new BookingError("FORBIDDEN_ROLE", "Only the assigned professional can update this booking.");
  }
  return identity;
}

export async function respondToBookingForIdentity(identity: AuthIdentity | null, input: unknown) {
  const professional = assertProfessionalCanManage(identity);
  const parsed = bookingDecisionSchema.safeParse(input);
  if (!parsed.success) {
    throw new BookingError("BOOKING_NOT_FOUND", "That booking could not be updated.");
  }

  const ownerUserId = ownerIdFromSession(professional, parsed.data.claimedProviderId);
  const booking = await getPrisma().booking.findUnique({
    where: { id: parsed.data.bookingId },
    include: bookingDetailInclude,
  });
  if (!booking) {
    throw new BookingError("BOOKING_NOT_FOUND", "That booking was not found.");
  }

  assertOwnership(ownerUserId, booking.provider.userId);

  if (parsed.data.claimedProviderId && parsed.data.claimedProviderId !== booking.providerId) {
    throw new BookingError("FORBIDDEN_ROLE", "You can only update bookings for your own profile.");
  }

  if (booking.status !== BookingStatus.REQUESTED) {
    throw new BookingError("ILLEGAL_TRANSITION", "Only a pending request can be accepted or declined.");
  }

  const nextStatus =
    parsed.data.decision === "accept" ? BookingStatus.ACCEPTED : BookingStatus.REJECTED;

  // Conditional write: a concurrent accept/decline must not be silently overwritten.
  const moved = await getPrisma().booking.updateMany({
    where: { id: booking.id, status: BookingStatus.REQUESTED },
    data: { status: nextStatus },
  });
  if (moved.count !== 1) {
    throw new BookingError("ILLEGAL_TRANSITION", "Only a pending request can be accepted or declined.");
  }
  return getPrisma().booking.findUniqueOrThrow({
    where: { id: booking.id },
    include: bookingDetailInclude,
  });
}
