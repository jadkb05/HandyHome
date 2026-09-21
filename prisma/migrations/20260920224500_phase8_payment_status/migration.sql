-- Phase 8: domain PaymentStatus (PENDING | PAID). Not a PSP.
-- BookingStatus.PAYMENT remains "payment pending". COMPLETED means payment recorded.
-- Payment.bookingId unique (one payment per booking) already exists.

CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID');

ALTER TABLE "Payment"
  ALTER COLUMN "status" TYPE "PaymentStatus"
  USING (
    CASE
      WHEN upper("status") = 'PAID' THEN 'PAID'::"PaymentStatus"
      ELSE 'PENDING'::"PaymentStatus"
    END
  );
