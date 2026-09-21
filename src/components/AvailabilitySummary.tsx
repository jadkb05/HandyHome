import { copy } from "@/content/en";
import { formatAvailabilityWindow, weekdayName } from "@/lib/availability";

type AvailabilityRow = {
  id: string;
  dayOfWeek: number;
  startTime: Date;
  endTime: Date;
};

export function AvailabilitySummary({ availability }: { availability: AvailabilityRow[] }) {
  if (availability.length === 0) {
    return <p className="section-note">{copy.emptyAvailability}</p>;
  }

  return (
    <ul className="availability-list">
      {availability.map((slot) => (
        <li key={slot.id}>
          <strong>{weekdayName(slot.dayOfWeek)}</strong>
          <span>{formatAvailabilityWindow(slot.startTime, slot.endTime)}</span>
        </li>
      ))}
    </ul>
  );
}
