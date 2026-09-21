export const BUSINESS_TIMEZONE = "Africa/Casablanca" as const;

export function formatInBusinessTimezone(date: Date, locale = "en-GB"): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: BUSINESS_TIMEZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatAppointmentInBusinessTimezone(date: Date, locale = "en-GB"): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: BUSINESS_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

export function formatTimeInBusinessTimezone(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: BUSINESS_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

export function formatDateInBusinessTimezone(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: BUSINESS_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

/** Calendar date (YYYY-MM-DD) of an instant in the business timezone. */
export function civilDateInBusinessTimezone(instant: Date, timeZone = BUSINESS_TIMEZONE): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (!year || !month || !day) {
    throw new Error("Could not read a civil date.");
  }
  return `${year}-${month}-${day}`;
}

export function addCivilDays(isoDate: string, days: number): string {
  const parsed = parseCivilDate(isoDate);
  const utc = Date.UTC(parsed.year, parsed.month - 1, parsed.day + days);
  const shifted = new Date(utc);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const day = String(shifted.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Weekday of a YYYY-MM-DD calendar date. 0 = Sunday, matching Availability.dayOfWeek. */
export function weekdayFromCivilDate(isoDate: string): number {
  const parsed = parseCivilDate(isoDate);
  return new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day)).getUTCDay();
}

export function parseCivilDate(isoDate: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) {
    throw new Error("Invalid civil date.");
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() + 1 !== month ||
    probe.getUTCDate() !== day
  ) {
    throw new Error("Invalid civil date.");
  }
  return { year, month, day };
}

export function parseClockTime(value: string): { hour: number; minute: number } {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    throw new Error("Invalid clock time.");
  }
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) {
    throw new Error("Invalid clock time.");
  }
  return { hour, minute };
}

/**
 * Convert a civil date + clock time in a named timezone into a UTC Date.
 * Does not use the host or browser local timezone.
 */
export function zonedCivilToUtc(
  isoDate: string,
  clockTime: string,
  timeZone = BUSINESS_TIMEZONE,
): Date {
  const { year, month, day } = parseCivilDate(isoDate);
  const { hour, minute } = parseClockTime(clockTime);
  const asIfUtc = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  const firstOffset = timezoneOffsetMs(asIfUtc, timeZone);
  const firstGuess = asIfUtc - firstOffset;
  const secondOffset = timezoneOffsetMs(firstGuess, timeZone);
  return new Date(asIfUtc - secondOffset);
}

function timezoneOffsetMs(utcMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(utcMs));
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  const asUtc = Date.UTC(read("year"), read("month") - 1, read("day"), read("hour"), read("minute"), read("second"));
  return asUtc - utcMs;
}

export function isValidCivilDate(value: string): boolean {
  try {
    parseCivilDate(value);
    return true;
  } catch {
    return false;
  }
}

/** Day number and short month for a date-block, in the business timezone. */
export function dayAndMonthInBusinessTimezone(date: Date): { day: string; month: string } {
  const day = new Intl.DateTimeFormat("en-GB", { timeZone: BUSINESS_TIMEZONE, day: "numeric" }).format(date);
  const month = new Intl.DateTimeFormat("en-GB", { timeZone: BUSINESS_TIMEZONE, month: "short" }).format(date);
  return { day, month };
}
