import { assertOwnership, ownerIdFromSession } from "@/lib/auth/ownership";
import { UserRole, type AuthIdentity } from "@/lib/auth/types";
import { getPrisma } from "@/lib/db";
import { bookingDetailInclude } from "@/features/bookings/create";
import { BookingError } from "@/features/bookings/errors";

export async function listBookingsForClient(identity: AuthIdentity) {
  if (identity.role !== UserRole.CLIENT) {
    throw new BookingError("FORBIDDEN_ROLE", "Only a client can view their bookings.");
  }
  const clientId = ownerIdFromSession(identity);
  return getPrisma().booking.findMany({
    where: { clientId },
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
    include: bookingDetailInclude,
  });
}

export async function listBookingsForProfessional(identity: AuthIdentity) {
  if (identity.role !== UserRole.PROFESSIONAL) {
    throw new BookingError("FORBIDDEN_ROLE", "Only a professional can view assigned bookings.");
  }
  const ownerUserId = ownerIdFromSession(identity);
  return getPrisma().booking.findMany({
    where: { provider: { userId: ownerUserId } },
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
    include: bookingDetailInclude,
  });
}

export async function getClientBooking(identity: AuthIdentity, bookingId: string) {
  const booking = await getPrisma().booking.findUnique({
    where: { id: bookingId },
    include: bookingDetailInclude,
  });
  if (!booking) {
    throw new BookingError("BOOKING_NOT_FOUND", "That booking was not found.");
  }
  assertOwnership(identity.userId, booking.clientId);
  return booking;
}

export async function getProfessionalBooking(identity: AuthIdentity, bookingId: string) {
  const booking = await getPrisma().booking.findUnique({
    where: { id: bookingId },
    include: bookingDetailInclude,
  });
  if (!booking) {
    throw new BookingError("BOOKING_NOT_FOUND", "That booking was not found.");
  }
  assertOwnership(identity.userId, booking.provider.userId);
  return booking;
}
