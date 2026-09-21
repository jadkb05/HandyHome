import { BookingStatus } from "@prisma/client";
import {
  addCivilDays,
  BUSINESS_TIMEZONE,
  civilDateInBusinessTimezone,
  formatDateInBusinessTimezone,
  formatTimeInBusinessTimezone,
  weekdayFromCivilDate,
  zonedCivilToUtc,
} from "@/lib/datetime";

export const SLOT_INTERVAL_MINUTES = 60;
export const SLOT_HORIZON_DAYS = 14;

export type AvailabilityWindow = {
  dayOfWeek: number;
  startTime: Date;
  endTime: Date;
  active: boolean;
};

export type AppointmentSlot = {
  scheduledAt: Date;
  iso: string;
  civilDate: string;
  timeLabel: string;
  dateLabel: string;
  weekday: number;
};

export type SlotDay = {
  civilDate: string;
  dateLabel: string;
  times: AppointmentSlot[];
};

/** Availability Time columns store clock values via UTC hours on a dummy date. */
export function clockMinutes(value: Date): number {
  return value.getUTCHours() * 60 + value.getUTCMinutes();
}

function minutesToClock(total: number): string {
  const hour = Math.floor(total / 60);
  const minute = total % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function generateOpenSlots(input: {
  availability: AvailabilityWindow[];
  occupied: Date[];
  now?: Date;
  horizonDays?: number;
  intervalMinutes?: number;
}): AppointmentSlot[] {
  const now = input.now ?? new Date();
  const horizonDays = input.horizonDays ?? SLOT_HORIZON_DAYS;
  const intervalMinutes = input.intervalMinutes ?? SLOT_INTERVAL_MINUTES;
  const occupied = new Set(input.occupied.map((value) => value.getTime()));
  const windows = input.availability.filter((row) => row.active);
  const today = civilDateInBusinessTimezone(now, BUSINESS_TIMEZONE);
  const slots: AppointmentSlot[] = [];

  for (let offset = 0; offset < horizonDays; offset += 1) {
    const civilDate = addCivilDays(today, offset);
    const weekday = weekdayFromCivilDate(civilDate);
    const dayWindows = windows.filter((row) => row.dayOfWeek === weekday);

    for (const window of dayWindows) {
      const start = clockMinutes(window.startTime);
      const end = clockMinutes(window.endTime);
      for (let cursor = start; cursor + intervalMinutes <= end; cursor += intervalMinutes) {
        const clock = minutesToClock(cursor);
        const scheduledAt = zonedCivilToUtc(civilDate, clock, BUSINESS_TIMEZONE);
        if (scheduledAt.getTime() <= now.getTime()) {
          continue;
        }
        if (occupied.has(scheduledAt.getTime())) {
          continue;
        }
        slots.push({
          scheduledAt,
          iso: scheduledAt.toISOString(),
          civilDate,
          timeLabel: formatTimeInBusinessTimezone(scheduledAt),
          dateLabel: formatDateInBusinessTimezone(scheduledAt),
          weekday,
        });
      }
    }
  }

  return slots;
}

export function groupSlotsByDay(slots: AppointmentSlot[]): SlotDay[] {
  const days = new Map<string, SlotDay>();
  for (const slot of slots) {
    const existing = days.get(slot.civilDate);
    if (existing) {
      existing.times.push(slot);
      continue;
    }
    days.set(slot.civilDate, {
      civilDate: slot.civilDate,
      dateLabel: slot.dateLabel,
      times: [slot],
    });
  }
  return [...days.values()];
}

export function slotIsOpen(slots: AppointmentSlot[], scheduledAt: Date): boolean {
  const target = scheduledAt.getTime();
  return slots.some((slot) => slot.scheduledAt.getTime() === target);
}

/** True when generateOpenSlots would offer at least one appointment on that civil date. */
export function hasOpenSlotOnCivilDate(input: {
  availability: AvailabilityWindow[];
  occupied: Date[];
  civilDate: string;
  now?: Date;
}): boolean {
  return generateOpenSlots({
    availability: input.availability,
    occupied: input.occupied,
    now: input.now,
  }).some((slot) => slot.civilDate === input.civilDate);
}

export const SLOT_OCCUPYING_STATUSES: BookingStatus[] = [
  BookingStatus.REQUESTED,
  BookingStatus.ACCEPTED,
  BookingStatus.APPOINTMENT_SCHEDULED,
  BookingStatus.DIAGNOSIS,
  BookingStatus.QUOTE_PENDING,
  BookingStatus.QUOTE_ACCEPTED,
  BookingStatus.INTERVENTION,
  BookingStatus.PAYMENT,
  BookingStatus.COMPLETED,
  BookingStatus.REVIEWED,
];
