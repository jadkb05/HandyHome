-- Declined bookings keep scheduledAt for history but must not block the slot.
-- The previous index occupied the slot for every non-null scheduledAt.

DROP INDEX "Booking_provider_scheduledAt_active_key";

CREATE UNIQUE INDEX "Booking_provider_scheduledAt_active_key"
ON "Booking" ("providerId", "scheduledAt")
WHERE "scheduledAt" IS NOT NULL AND status <> 'REJECTED';
