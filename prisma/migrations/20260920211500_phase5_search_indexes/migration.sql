-- Neighborhood/city-level search filters (Phase 5).
-- Provider.city is already indexed; address stores the neighborhood label.

CREATE INDEX "Provider_address_idx" ON "Provider"("address");
