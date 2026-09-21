-- Phase 2 domain invariants. Do not edit the database outside this migration.

-- User: password hash column (no plaintext; auth is not implemented in this phase).
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT NOT NULL;

-- UTC-safe timestamps
ALTER TABLE "User" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "User" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

ALTER TABLE "Provider" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "Provider" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

ALTER TABLE "Service" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "Service" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

ALTER TABLE "Booking" ALTER COLUMN "scheduledAt" TYPE TIMESTAMPTZ(3) USING "scheduledAt" AT TIME ZONE 'UTC';
ALTER TABLE "Booking" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "Booking" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

ALTER TABLE "Quote" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "Quote" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

ALTER TABLE "Payment" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "Payment" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

ALTER TABLE "Review" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';

ALTER TABLE "Favorite" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';

ALTER TABLE "PortfolioItem" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "PortfolioItem" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- Quote revisions: explicit version, unique per booking (history is never overwritten in place).
ALTER TABLE "Quote" ALTER COLUMN "version" DROP DEFAULT;
CREATE UNIQUE INDEX "Quote_bookingId_version_key" ON "Quote"("bookingId", "version");

-- At most one accepted quote per booking (identifies the accepted quote without mutating prior rows).
CREATE UNIQUE INDEX "Quote_one_accepted_per_booking_idx"
ON "Quote" ("bookingId")
WHERE "status" = 'ACCEPTED';

-- Double booking: a provider cannot hold two appointments at the same scheduledAt.
-- Unscheduled bookings (scheduledAt IS NULL) are excluded.
-- Cancellation is not modeled; any persisted timestamp occupies the slot.
DROP INDEX "Booking_providerId_scheduledAt_key";
CREATE UNIQUE INDEX "Booking_provider_scheduledAt_active_key"
ON "Booking" ("providerId", "scheduledAt")
WHERE "scheduledAt" IS NOT NULL;

-- Redundant with Payment.bookingId unique
DROP INDEX "Payment_bookingId_idx";

-- Restrict user/provider deletion so booking/quote/payment history cannot cascade away.
ALTER TABLE "Provider" DROP CONSTRAINT "Provider_userId_fkey";
ALTER TABLE "Provider" ADD CONSTRAINT "Provider_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Quote" DROP CONSTRAINT "Quote_bookingId_fkey";
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
