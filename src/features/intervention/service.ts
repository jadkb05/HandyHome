import { BookingStatus, Prisma, QuoteStatus } from "@prisma/client";
import { assertOwnership, ownerIdFromSession } from "@/lib/auth/ownership";
import { UserRole, type AuthIdentity } from "@/lib/auth/types";
import { getPrisma } from "@/lib/db";
import { bookingDetailInclude } from "@/features/bookings/create";
import { InterventionError } from "@/features/intervention/errors";
import {
  completeInterventionSchema,
  startInterventionSchema,
} from "@/features/intervention/validation";
import { createPendingPaymentInTransaction } from "@/features/payments/service";

function assertProfessional(identity: AuthIdentity | null): AuthIdentity {
  if (!identity) {
    throw new InterventionError("UNAUTHENTICATED", "Sign in to manage this intervention.");
  }
  if (identity.role !== UserRole.PROFESSIONAL) {
    throw new InterventionError(
      "FORBIDDEN_ROLE",
      "Only the assigned professional can update this intervention.",
    );
  }
  return identity;
}

async function loadOwnedBooking(identity: AuthIdentity, bookingId: string, claimedProviderId?: string) {
  const booking = await getPrisma().booking.findUnique({
    where: { id: bookingId },
    include: bookingDetailInclude,
  });
  if (!booking) {
    throw new InterventionError("BOOKING_NOT_FOUND", "That booking was not found.");
  }
  assertOwnership(ownerIdFromSession(identity, claimedProviderId), booking.provider.userId);
  if (claimedProviderId && claimedProviderId !== booking.providerId) {
    throw new InterventionError("FORBIDDEN_ROLE", "You can only update bookings for your own profile.");
  }
  return booking;
}

function acceptedQuoteOf(booking: { quotes: Array<{ status: QuoteStatus }> }) {
  return booking.quotes.find((quote) => quote.status === QuoteStatus.ACCEPTED);
}

export async function startInterventionForIdentity(identity: AuthIdentity | null, input: unknown) {
  const professional = assertProfessional(identity);
  const parsed = startInterventionSchema.safeParse(input);
  if (!parsed.success) {
    throw new InterventionError("BOOKING_NOT_FOUND", "That booking could not be updated.");
  }

  const booking = await loadOwnedBooking(
    professional,
    parsed.data.bookingId,
    parsed.data.claimedProviderId,
  );
  if (!acceptedQuoteOf(booking)) {
    throw new InterventionError(
      "QUOTE_NOT_ACCEPTED",
      "An accepted quote is required before starting the intervention.",
    );
  }
  if (booking.status !== BookingStatus.QUOTE_ACCEPTED) {
    throw new InterventionError(
      "ILLEGAL_TRANSITION",
      "The intervention can start only after the client accepts the quote.",
    );
  }

  const moved = await getPrisma().booking.updateMany({
    where: { id: booking.id, status: BookingStatus.QUOTE_ACCEPTED },
    data: { status: BookingStatus.INTERVENTION },
  });
  if (moved.count !== 1) {
    throw new InterventionError(
      "ILLEGAL_TRANSITION",
      "The intervention can start only after the client accepts the quote.",
    );
  }
  return getPrisma().booking.findUniqueOrThrow({
    where: { id: booking.id },
    include: bookingDetailInclude,
  });
}

export async function completeInterventionForIdentity(identity: AuthIdentity | null, input: unknown) {
  const professional = assertProfessional(identity);
  const parsed = completeInterventionSchema.safeParse(input);
  if (!parsed.success) {
    throw new InterventionError("BOOKING_NOT_FOUND", "That booking could not be updated.");
  }

  try {
    return await getPrisma().$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: parsed.data.bookingId },
        include: bookingDetailInclude,
      });
      if (!booking) {
        throw new InterventionError("BOOKING_NOT_FOUND", "That booking was not found.");
      }
      assertOwnership(
        ownerIdFromSession(professional, parsed.data.claimedProviderId),
        booking.provider.userId,
      );
      if (parsed.data.claimedProviderId && parsed.data.claimedProviderId !== booking.providerId) {
        throw new InterventionError(
          "FORBIDDEN_ROLE",
          "You can only update bookings for your own profile.",
        );
      }
      if (!acceptedQuoteOf(booking)) {
        throw new InterventionError(
          "QUOTE_NOT_ACCEPTED",
          "An accepted quote is required before completing the intervention.",
        );
      }
      if (booking.status !== BookingStatus.INTERVENTION) {
        throw new InterventionError(
          "ILLEGAL_TRANSITION",
          "Complete the intervention only after it has started.",
        );
      }

      const moved = await tx.booking.updateMany({
        where: { id: booking.id, status: BookingStatus.INTERVENTION },
        data: { status: BookingStatus.PAYMENT },
      });
      if (moved.count !== 1) {
        throw new InterventionError(
          "ILLEGAL_TRANSITION",
          "Complete the intervention only after it has started.",
        );
      }
      await createPendingPaymentInTransaction(tx, booking);
      return tx.booking.findUniqueOrThrow({
        where: { id: booking.id },
        include: bookingDetailInclude,
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new InterventionError(
        "ILLEGAL_TRANSITION",
        "A payment record already exists for this booking.",
      );
    }
    throw error;
  }
}
