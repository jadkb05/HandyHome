import { BookingStatus, PaymentStatus, Prisma, QuoteStatus } from "@prisma/client";
import { assertOwnership, ownerIdFromSession } from "@/lib/auth/ownership";
import { UserRole, type AuthIdentity } from "@/lib/auth/types";
import { getPrisma } from "@/lib/db";
import { bookingDetailInclude } from "@/features/bookings/create";
import { PaymentError } from "@/features/payments/errors";
import { recordPaymentSchema } from "@/features/payments/validation";
import { DEFAULT_QUOTE_CURRENCY } from "@/features/quotes/money";

type BookingWithQuotes = {
  id: string;
  payment: { id: string } | null;
  quotes: Array<{
    id: string;
    amount: Prisma.Decimal;
    currency: string;
    status: QuoteStatus;
  }>;
};

export async function createPendingPaymentInTransaction(
  tx: Prisma.TransactionClient,
  booking: BookingWithQuotes,
) {
  const accepted = booking.quotes.find((quote) => quote.status === QuoteStatus.ACCEPTED);
  if (!accepted) {
    throw new PaymentError(
      "QUOTE_NOT_ACCEPTED",
      "A payment can be created only after a quote is accepted.",
    );
  }
  if (booking.payment) {
    throw new PaymentError("ALREADY_RECORDED", "This booking already has a payment record.");
  }

  return tx.payment.create({
    data: {
      bookingId: booking.id,
      quoteId: accepted.id,
      amount: accepted.amount,
      currency: accepted.currency || DEFAULT_QUOTE_CURRENCY,
      status: PaymentStatus.PENDING,
    },
  });
}

function assertClient(identity: AuthIdentity | null): AuthIdentity {
  if (!identity) {
    throw new PaymentError("UNAUTHENTICATED", "Sign in to record this payment state.");
  }
  if (identity.role !== UserRole.CLIENT) {
    throw new PaymentError(
      "FORBIDDEN_ROLE",
      "Only the client who owns the booking can record this payment state.",
    );
  }
  return identity;
}

export async function recordPaymentForIdentity(identity: AuthIdentity | null, input: unknown) {
  const client = assertClient(identity);
  const parsed = recordPaymentSchema.safeParse(input);
  if (!parsed.success) {
    throw new PaymentError("BOOKING_NOT_FOUND", "That payment could not be updated.");
  }
  void parsed.data.amount;

  try {
    return await getPrisma().$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: parsed.data.bookingId },
        include: bookingDetailInclude,
      });
      if (!booking) {
        throw new PaymentError("BOOKING_NOT_FOUND", "That booking was not found.");
      }
      assertOwnership(ownerIdFromSession(client, parsed.data.claimedClientId), booking.clientId);

      if (booking.payment?.status === PaymentStatus.PAID) {
        throw new PaymentError("ALREADY_RECORDED", "This payment has already been recorded.");
      }
      if (booking.status !== BookingStatus.PAYMENT) {
        throw new PaymentError(
          "ILLEGAL_TRANSITION",
          "Payment can be recorded only after the intervention is completed.",
        );
      }
      if (!booking.payment) {
        throw new PaymentError("PAYMENT_NOT_FOUND", "That payment was not found.");
      }
      if (booking.payment.status !== PaymentStatus.PENDING) {
        throw new PaymentError("ILLEGAL_TRANSITION", "Only a pending payment can be recorded.");
      }

      const paid = await tx.payment.updateMany({
        where: { id: booking.payment.id, status: PaymentStatus.PENDING },
        data: { status: PaymentStatus.PAID },
      });
      const moved = await tx.booking.updateMany({
        where: { id: booking.id, status: BookingStatus.PAYMENT },
        data: { status: BookingStatus.COMPLETED },
      });
      if (paid.count !== 1 || moved.count !== 1) {
        throw new PaymentError("ALREADY_RECORDED", "This payment has already been recorded.");
      }
      return tx.payment.findUniqueOrThrow({ where: { id: booking.payment.id } });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new PaymentError("ALREADY_RECORDED", "This booking already has a payment record.");
    }
    throw error;
  }
}
