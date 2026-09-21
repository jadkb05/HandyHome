import { BookingStatus, DiagnosisStatus, Prisma, QuoteStatus } from "@prisma/client";
import { assertOwnership, ownerIdFromSession } from "@/lib/auth/ownership";
import { UserRole, type AuthIdentity } from "@/lib/auth/types";
import { getPrisma } from "@/lib/db";
import { bookingDetailInclude } from "@/features/bookings/create";
import { QuoteError } from "@/features/quotes/errors";
import { DEFAULT_QUOTE_CURRENCY } from "@/features/quotes/money";
import { createQuoteSchema, quoteDecisionSchema } from "@/features/quotes/validation";

function assertProfessional(identity: AuthIdentity | null): AuthIdentity {
  if (!identity) {
    throw new QuoteError("UNAUTHENTICATED", "Sign in to create a quote.");
  }
  if (identity.role !== UserRole.PROFESSIONAL) {
    throw new QuoteError("FORBIDDEN_ROLE", "Only the assigned professional can create a quote.");
  }
  return identity;
}

function assertClient(identity: AuthIdentity | null): AuthIdentity {
  if (!identity) {
    throw new QuoteError("UNAUTHENTICATED", "Sign in to respond to this quote.");
  }
  if (identity.role !== UserRole.CLIENT) {
    throw new QuoteError("FORBIDDEN_ROLE", "Only the client can accept or decline this quote.");
  }
  return identity;
}

export async function createQuoteForIdentity(identity: AuthIdentity | null, input: unknown) {
  const professional = assertProfessional(identity);
  const parsed = createQuoteSchema.safeParse(input);
  if (!parsed.success) {
    const path = parsed.error.issues[0]?.path[0];
    throw new QuoteError(
      path === "amount" ? "INVALID_AMOUNT" : "ILLEGAL_TRANSITION",
      parsed.error.issues[0]?.message ?? "That quote could not be created.",
    );
  }

  try {
    return await getPrisma().$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: parsed.data.bookingId },
        include: bookingDetailInclude,
      });
      if (!booking) {
        throw new QuoteError("BOOKING_NOT_FOUND", "That booking was not found.");
      }
      assertOwnership(ownerIdFromSession(professional, parsed.data.claimedProviderId), booking.provider.userId);
      if (parsed.data.claimedProviderId && parsed.data.claimedProviderId !== booking.providerId) {
        throw new QuoteError("FORBIDDEN_ROLE", "You can only quote bookings for your own profile.");
      }

      if (booking.diagnosis?.status !== DiagnosisStatus.COMPLETED) {
        throw new QuoteError("DIAGNOSIS_INCOMPLETE", "Complete the diagnosis before creating a quote.");
      }
      if (booking.quotes.some((quote) => quote.status === QuoteStatus.ACCEPTED)) {
        throw new QuoteError("ALREADY_ACCEPTED", "This booking already has an accepted quote.");
      }
      if (booking.quotes.some((quote) => quote.status === QuoteStatus.SENT)) {
        throw new QuoteError("ILLEGAL_TRANSITION", "A quote is already awaiting the client.");
      }
      if (
        booking.status !== BookingStatus.DIAGNOSIS &&
        booking.status !== BookingStatus.QUOTE_PENDING
      ) {
        throw new QuoteError("ILLEGAL_TRANSITION", "A quote can be created only after diagnosis.");
      }

      const latestVersion = booking.quotes.reduce((max, quote) => Math.max(max, quote.version), 0);
      const quote = await tx.quote.create({
        data: {
          bookingId: booking.id,
          amount: new Prisma.Decimal(parsed.data.amount),
          currency: DEFAULT_QUOTE_CURRENCY,
          notes: parsed.data.notes,
          status: QuoteStatus.SENT,
          version: latestVersion + 1,
        },
      });
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.QUOTE_PENDING },
      });
      return quote;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new QuoteError("ILLEGAL_TRANSITION", "A quote is already awaiting the client.");
    }
    throw error;
  }
}

export async function respondToQuoteForIdentity(identity: AuthIdentity | null, input: unknown) {
  const client = assertClient(identity);
  const parsed = quoteDecisionSchema.safeParse(input);
  if (!parsed.success) {
    throw new QuoteError("QUOTE_NOT_FOUND", "That quote could not be updated.");
  }

  try {
    return await getPrisma().$transaction(async (tx) => {
      const quote = await tx.quote.findUnique({
        where: { id: parsed.data.quoteId },
        include: { booking: { include: bookingDetailInclude } },
      });
      if (!quote) {
        throw new QuoteError("QUOTE_NOT_FOUND", "That quote was not found.");
      }
      assertOwnership(ownerIdFromSession(client, parsed.data.claimedClientId), quote.booking.clientId);
      if (quote.status !== QuoteStatus.SENT) {
        throw new QuoteError("ILLEGAL_TRANSITION", "Only a sent quote can be accepted or declined.");
      }
      if (quote.booking.status !== BookingStatus.QUOTE_PENDING) {
        throw new QuoteError("ILLEGAL_TRANSITION", "This booking cannot accept or decline a quote.");
      }

      const nextStatus =
        parsed.data.decision === "decline" ? QuoteStatus.REJECTED : QuoteStatus.ACCEPTED;
      const decided = await tx.quote.updateMany({
        where: { id: quote.id, status: QuoteStatus.SENT },
        data: { status: nextStatus },
      });
      if (decided.count !== 1) {
        throw new QuoteError("ILLEGAL_TRANSITION", "Only a sent quote can be accepted or declined.");
      }
      if (nextStatus === QuoteStatus.ACCEPTED) {
        const moved = await tx.booking.updateMany({
          where: { id: quote.bookingId, status: BookingStatus.QUOTE_PENDING },
          data: { status: BookingStatus.QUOTE_ACCEPTED },
        });
        if (moved.count !== 1) {
          throw new QuoteError("ILLEGAL_TRANSITION", "This booking cannot accept or decline a quote.");
        }
      }
      return tx.quote.findUniqueOrThrow({ where: { id: quote.id } });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new QuoteError("ALREADY_ACCEPTED", "This booking already has an accepted quote.");
    }
    throw error;
  }
}

export async function getQuotesForClient(identity: AuthIdentity, bookingId: string) {
  if (identity.role !== UserRole.CLIENT) {
    throw new QuoteError("FORBIDDEN_ROLE", "Only the client can view these quotes.");
  }
  const booking = await getPrisma().booking.findUnique({
    where: { id: bookingId },
    include: bookingDetailInclude,
  });
  if (!booking) {
    throw new QuoteError("BOOKING_NOT_FOUND", "That booking was not found.");
  }
  assertOwnership(identity.userId, booking.clientId);
  return booking.quotes;
}

export async function getQuotesForProfessional(identity: AuthIdentity, bookingId: string) {
  if (identity.role !== UserRole.PROFESSIONAL) {
    throw new QuoteError("FORBIDDEN_ROLE", "Only the assigned professional can view these quotes.");
  }
  const booking = await getPrisma().booking.findUnique({
    where: { id: bookingId },
    include: bookingDetailInclude,
  });
  if (!booking) {
    throw new QuoteError("BOOKING_NOT_FOUND", "That booking was not found.");
  }
  assertOwnership(identity.userId, booking.provider.userId);
  return booking.quotes;
}
