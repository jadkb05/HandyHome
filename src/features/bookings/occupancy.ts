import { getPrisma } from "@/lib/db";
import { SLOT_OCCUPYING_STATUSES } from "@/features/bookings/slots";

/** Occupying appointment instants per provider, using the same statuses as booking. */
export async function occupyingScheduledTimes(providerIds: string[]): Promise<Map<string, Date[]>> {
  const occupied = new Map<string, Date[]>();
  for (const providerId of providerIds) {
    occupied.set(providerId, []);
  }
  if (providerIds.length === 0) {
    return occupied;
  }

  const rows = await getPrisma().booking.findMany({
    where: {
      providerId: { in: providerIds },
      scheduledAt: { not: null },
      status: { in: SLOT_OCCUPYING_STATUSES },
    },
    select: { providerId: true, scheduledAt: true },
  });

  for (const row of rows) {
    if (!(row.scheduledAt instanceof Date)) {
      continue;
    }
    occupied.get(row.providerId)?.push(row.scheduledAt);
  }

  return occupied;
}
