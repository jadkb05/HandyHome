-- Phase 6: professional decline of a REQUESTED booking.
-- Cancellation / no-show (OPEN_QUESTIONS B-05) is still not modeled.

ALTER TYPE "BookingStatus" ADD VALUE 'REJECTED';
