import { BookingStatus, DiagnosisStatus, Prisma } from "@prisma/client";
import { assertOwnership, ownerIdFromSession } from "@/lib/auth/ownership";
import { UserRole, type AuthIdentity } from "@/lib/auth/types";
import { getPrisma } from "@/lib/db";
import { bookingDetailInclude } from "@/features/bookings/create";
import { BookingError } from "@/features/bookings/errors";
import { DiagnosisError } from "@/features/diagnosis/errors";
import { completeDiagnosisSchema, startDiagnosisSchema } from "@/features/diagnosis/validation";

function assertProfessional(identity: AuthIdentity | null): AuthIdentity {
  if (!identity) {
    throw new DiagnosisError("UNAUTHENTICATED", "Sign in to manage the diagnosis.");
  }
  if (identity.role !== UserRole.PROFESSIONAL) {
    throw new DiagnosisError("FORBIDDEN_ROLE", "Only the assigned professional can update this diagnosis.");
  }
  return identity;
}

async function loadOwnedBooking(identity: AuthIdentity, bookingId: string, claimedProviderId?: string) {
  const booking = await getPrisma().booking.findUnique({
    where: { id: bookingId },
    include: bookingDetailInclude,
  });
  if (!booking) {
    throw new DiagnosisError("BOOKING_NOT_FOUND", "That booking was not found.");
  }
  assertOwnership(ownerIdFromSession(identity, claimedProviderId), booking.provider.userId);
  if (claimedProviderId && claimedProviderId !== booking.providerId) {
    throw new DiagnosisError("FORBIDDEN_ROLE", "You can only update bookings for your own profile.");
  }
  return booking;
}

export async function startDiagnosisForIdentity(identity: AuthIdentity | null, input: unknown) {
  const professional = assertProfessional(identity);
  const parsed = startDiagnosisSchema.safeParse(input);
  if (!parsed.success) {
    throw new DiagnosisError("BOOKING_NOT_FOUND", "That booking could not be updated.");
  }

  const booking = await loadOwnedBooking(professional, parsed.data.bookingId, parsed.data.claimedProviderId);
  if (booking.status !== BookingStatus.ACCEPTED) {
    throw new DiagnosisError("ILLEGAL_TRANSITION", "Diagnosis can start only after the booking is accepted.");
  }
  if (booking.diagnosis) {
    throw new DiagnosisError("ILLEGAL_TRANSITION", "Diagnosis has already been started.");
  }

  try {
    await getPrisma().$transaction(async (tx) => {
      const moved = await tx.booking.updateMany({
        where: { id: booking.id, status: BookingStatus.ACCEPTED },
        data: { status: BookingStatus.DIAGNOSIS },
      });
      if (moved.count !== 1) {
        throw new DiagnosisError(
          "ILLEGAL_TRANSITION",
          "Diagnosis can start only after the booking is accepted.",
        );
      }
      await tx.diagnosis.create({
        data: { bookingId: booking.id, findings: "", status: DiagnosisStatus.DRAFT },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new DiagnosisError("ILLEGAL_TRANSITION", "Diagnosis has already been started.");
    }
    throw error;
  }

  return getPrisma().booking.findUniqueOrThrow({
    where: { id: booking.id },
    include: bookingDetailInclude,
  });
}

export async function completeDiagnosisForIdentity(identity: AuthIdentity | null, input: unknown) {
  const professional = assertProfessional(identity);
  const parsed = completeDiagnosisSchema.safeParse(input);
  if (!parsed.success) {
    throw new DiagnosisError(
      "INVALID_FINDINGS",
      parsed.error.issues[0]?.message ?? "Enter the diagnosis findings.",
    );
  }

  const booking = await loadOwnedBooking(professional, parsed.data.bookingId, parsed.data.claimedProviderId);
  if (!booking.diagnosis || booking.diagnosis.status !== DiagnosisStatus.DRAFT) {
    throw new DiagnosisError("ILLEGAL_TRANSITION", "Start the diagnosis before completing it.");
  }

  const completed = await getPrisma().diagnosis.updateMany({
    where: { id: booking.diagnosis.id, status: DiagnosisStatus.DRAFT },
    data: { findings: parsed.data.findings, status: DiagnosisStatus.COMPLETED },
  });
  if (completed.count !== 1) {
    throw new DiagnosisError("ILLEGAL_TRANSITION", "Start the diagnosis before completing it.");
  }

  return getPrisma().booking.findUniqueOrThrow({
    where: { id: booking.id },
    include: bookingDetailInclude,
  });
}

export async function getCompletedDiagnosisForClient(identity: AuthIdentity, bookingId: string) {
  if (identity.role !== UserRole.CLIENT) {
    throw new DiagnosisError("FORBIDDEN_ROLE", "Only the client can view this diagnosis.");
  }
  const booking = await getPrisma().booking.findUnique({
    where: { id: bookingId },
    include: bookingDetailInclude,
  });
  if (!booking) {
    throw new BookingError("BOOKING_NOT_FOUND", "That booking was not found.");
  }
  assertOwnership(identity.userId, booking.clientId);
  if (!booking.diagnosis || booking.diagnosis.status !== DiagnosisStatus.COMPLETED) {
    return null;
  }
  return booking.diagnosis;
}
