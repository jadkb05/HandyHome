-- Phase 7: diagnosis entity and quote notes.
-- QuoteStatus already has SENT / REJECTED / ACCEPTED. REJECTED is the client decline.
-- One accepted quote per booking remains Quote_one_accepted_per_booking_idx.

CREATE TYPE "DiagnosisStatus" AS ENUM ('DRAFT', 'COMPLETED');

CREATE TABLE "Diagnosis" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "findings" TEXT NOT NULL DEFAULT '',
    "status" "DiagnosisStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Diagnosis_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Diagnosis_bookingId_key" ON "Diagnosis"("bookingId");

ALTER TABLE "Diagnosis" ADD CONSTRAINT "Diagnosis_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Quote" ADD COLUMN "notes" TEXT NOT NULL DEFAULT '';
