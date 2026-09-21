-- Phase 9: one review per booking. Rating 1–5. No fake seed reviews.

DROP INDEX IF EXISTS "Review_bookingId_idx";

CREATE UNIQUE INDEX "Review_bookingId_key" ON "Review"("bookingId");

ALTER TABLE "Review"
  ADD CONSTRAINT "Review_rating_check" CHECK ("rating" >= 1 AND "rating" <= 5);
