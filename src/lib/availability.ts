const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function weekdayName(dayOfWeek: number): string {
  return WEEKDAYS[dayOfWeek] ?? `Day ${dayOfWeek}`;
}

/** Availability Time values are stored as clock times, not instants. */
export function formatClockTime(value: Date): string {
  const hours = String(value.getUTCHours()).padStart(2, "0");
  const minutes = String(value.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function formatAvailabilityWindow(startTime: Date, endTime: Date): string {
  return `${formatClockTime(startTime)}–${formatClockTime(endTime)}`;
}
