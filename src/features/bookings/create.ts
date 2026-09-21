import { BookingStatus, Prisma, UserRole as PrismaUserRole } from "@prisma/client";
import { ownerIdFromSession } from "@/lib/auth/ownership";
import { UserRole, type AuthIdentity } from "@/lib/auth/types";
import { getPrisma } from "@/lib/db";
import { isProfilePublic } from "@/features/professionals/completeness";
import { BookingError } from "@/features/bookings/errors";
import { generateOpenSlots, SLOT_OCCUPYING_STATUSES, slotIsOpen } from "@/features/bookings/slots";
import type { OfferedBookingService } from "@/features/bookings/types";
import { createBookingInputSchema } from "@/features/bookings/validation";

export function assertClientCanBook(identity: AuthIdentity | null): AuthIdentity {
  if (!identity) {
    throw new BookingError("UNAUTHENTICATED", "Sign in as a client to request an intervention.");
  }
  if (identity.role !== UserRole.CLIENT) {
    throw new BookingError(
      "FORBIDDEN_ROLE",
      "Professionals cannot request an intervention as a client.",
    );
  }
  return identity;
}

function parseScheduledAt(value: string, now: Date): Date {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) {
    throw new BookingError("INVALID_TIME", "Choose a valid appointment time.");
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new BookingError("INVALID_TIME", "Choose a valid appointment time.");
  }
  if (parsed.getTime() <= now.getTime()) {
    throw new BookingError("INVALID_TIME", "Choose a future appointment time.");
  }
  return parsed;
}

async function loadBookableProvider(providerId: string) {
  const provider = await getPrisma().provider.findUnique({
    where: { id: providerId },
    include: {
      user: { select: { id: true, role: true, name: true } },
      services: { include: { service: true }, orderBy: { service: { name: "asc" } } },
      availability: { where: { active: true }, orderBy: { dayOfWeek: "asc" } },
    },
  });
  if (!provider) {
    throw new BookingError("PROVIDER_NOT_FOUND", "This professional profile was not found.");
  }
  if (provider.user.role !== PrismaUserRole.PROFESSIONAL) {
    throw new BookingError("PROVIDER_INELIGIBLE", "This professional cannot accept bookings.");
  }
  if (
    !isProfilePublic({
      profession: provider.profession,
      city: provider.city,
      serviceCount: provider.services.length,
    })
  ) {
    throw new BookingError("PROVIDER_INELIGIBLE", "This professional cannot accept bookings yet.");
  }
  return provider;
}

async function offeredServiceId(providerId: string, serviceId: string): Promise<string> {
  const link = await getPrisma().providerService.findUnique({
    where: {
      providerId_serviceId: { providerId, serviceId },
    },
    select: { serviceId: true },
  });
  if (!link) {
    throw new BookingError(
      "SERVICE_NOT_OFFERED",
      "That service is not offered by this professional.",
    );
  }
  return link.serviceId;
}

export type { OfferedBookingService } from "@/features/bookings/types";

export function offeredBookingServices(
  services: ReadonlyArray<{ serviceId: string; service: { name: string } }>,
): OfferedBookingService[] {
  return services.map((row) => ({ id: row.serviceId, name: row.service.name }));
}

async function occupiedTimes(providerId: string): Promise<Date[]> {
  const rows = await getPrisma().booking.findMany({
    where: {
      providerId,
      scheduledAt: { not: null },
      status: { in: SLOT_OCCUPYING_STATUSES },
    },
    select: { scheduledAt: true },
  });
  return rows
    .map((row) => row.scheduledAt)
    .filter((value): value is Date => value instanceof Date);
}

export async function listOpenSlotsForProvider(providerId: string, now = new Date()) {
  const provider = await loadBookableProvider(providerId);
  const occupied = await occupiedTimes(provider.id);
  return generateOpenSlots({
    availability: provider.availability,
    occupied,
    now,
  });
}

export async function createBookingForIdentity(
  identity: AuthIdentity | null,
  input: unknown,
  now = new Date(),
) {
  const client = assertClientCanBook(identity);
  const parsed = createBookingInputSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const message = issue?.message ?? "Choose a valid appointment time.";
    if (issue?.path[0] === "serviceId") {
      throw new BookingError("SERVICE_NOT_OFFERED", "Choose a service.");
    }
    if (issue?.path[0] === "providerId") {
      throw new BookingError("PROVIDER_NOT_FOUND", message);
    }
    throw new BookingError("INVALID_TIME", message);
  }

  const clientId = ownerIdFromSession(client, parsed.data.claimedClientId);
  const scheduledAt = parseScheduledAt(parsed.data.scheduledAt, now);
  const provider = await loadBookableProvider(parsed.data.providerId);
  const occupied = await occupiedTimes(provider.id);
  const openSlots = generateOpenSlots({
    availability: provider.availability,
    occupied,
    now,
  });

  if (provider.availability.length === 0) {
    throw new BookingError(
      "OUTSIDE_AVAILABILITY",
      "No availability is currently listed for this professional.",
    );
  }

  if (!slotIsOpen(openSlots, scheduledAt)) {
    const stillInWindow = generateOpenSlots({
      availability: provider.availability,
      occupied: [],
      now: new Date(scheduledAt.getTime() - 60_000),
    }).some((slot) => slot.scheduledAt.getTime() === scheduledAt.getTime());
    if (!stillInWindow) {
      throw new BookingError(
        "OUTSIDE_AVAILABILITY",
        "That time is outside this professional's availability.",
      );
    }
    throw new BookingError("SLOT_TAKEN", "This time slot is no longer available.");
  }

  const serviceId = await offeredServiceId(provider.id, parsed.data.serviceId);

  try {
    return await getPrisma().booking.create({
      data: {
        clientId,
        providerId: provider.id,
        serviceId,
        scheduledAt,
        status: BookingStatus.REQUESTED,
      },
      include: bookingDetailInclude,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new BookingError("SLOT_TAKEN", "This time slot is no longer available.");
    }
    throw error;
  }
}

export const bookingDetailInclude = {
  client: { select: { id: true, name: true, email: true } },
  provider: {
    select: {
      id: true,
      userId: true,
      profession: true,
      city: true,
      user: { select: { id: true, name: true } },
    },
  },
  service: { select: { id: true, name: true, slug: true } },
  diagnosis: true,
  quotes: { orderBy: { version: "asc" as const } },
  payment: true,
  review: true,
} as const;
