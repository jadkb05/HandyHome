"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { copy } from "@/content/en";
import { Icon } from "@/components/ui/Icon";
import {
  createBookingAction,
  type CreateBookingActionState,
} from "@/features/bookings/actions";
import type { OfferedBookingService } from "@/features/bookings/types";
import type { SlotDay } from "@/features/bookings/slots";

const initialState: CreateBookingActionState = { error: null, bookingId: null };

type BookingFormProps = {
  providerId: string;
  providerName: string;
  services: OfferedBookingService[];
  days: SlotDay[];
  selectedDate: string | null;
};

export function BookingForm({
  providerId,
  services,
  days,
  selectedDate,
}: BookingFormProps) {
  const [state, action, pending] = useActionState(createBookingAction, initialState);
  const [activeDate, setActiveDate] = useState(
    days.find((day) => day.civilDate === selectedDate)?.civilDate ?? days[0]?.civilDate ?? null,
  );
  const selectedDay = days.find((day) => day.civilDate === activeDate) ?? days[0];
  const singleService = services.length === 1;
  const [serviceId, setServiceId] = useState<string | null>(singleService ? services[0].id : null);
  const [timeIso, setTimeIso] = useState<string | null>(null);
  const chosenService = services.find((service) => service.id === serviceId);
  const chosenSlot = days.flatMap((day) => day.times).find((slot) => slot.iso === timeIso);

  if (state.bookingId) {
    return (
      <div className="booking-confirmation" data-testid="booking-confirmation">
        <span className="booking-confirmation__icon">
          <Icon name="check" size={28} />
        </span>
        <p className="form-success" role="status">
          {copy.bookSuccess}
        </p>
        <p>
          {copy.bookingStatus}:{" "}
          <strong data-testid="booking-status">{copy.bookSuccessStatus}</strong>
        </p>
        <div className="notice" data-testid="booking-next-steps">
          <p className="notice__title">{copy.bookHelpTitle}</p>
          <p>{copy.bookHelpBody}</p>
        </div>
        <Link href="/dashboard" className="button">
          {copy.bookViewDashboard}
        </Link>
      </div>
    );
  }

  if (!selectedDay) {
    return <p className="empty-state">{copy.bookingNoSlots}</p>;
  }

  return (
    <form className="booking-form" action={action} data-testid="booking-form">
      {state.error ? (
        <p className="form-alert" role="alert" data-testid="booking-error">
          {state.error}
        </p>
      ) : null}

      <fieldset className="booking-services">
        <legend>{copy.bookChooseService}</legend>
        <div className="slot-list" data-testid="booking-services">
          {services.map((service) => (
            <label key={service.id} className="slot-choice">
              <input
                type="radio"
                name="serviceId"
                value={service.id}
                required
                defaultChecked={singleService}
                onChange={() => setServiceId(service.id)}
              />
              <span>{service.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="booking-dates">
        <legend>{copy.bookDate}</legend>
        <div className="slot-list">
          {days.map((day) => {
            const selected = day.civilDate === selectedDay.civilDate;
            return (
              <button
                key={day.civilDate}
                type="button"
                className="slot-option"
                data-selected={selected ? "true" : "false"}
                aria-pressed={selected}
                onClick={() => {
                  setActiveDate(day.civilDate);
                  setTimeIso(null);
                }}
              >
                {day.dateLabel}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="booking-times">
        <legend>{copy.bookTimes}</legend>
        <div className="slot-list" data-testid="booking-slots">
          {selectedDay.times.map((slot) => (
            <label key={slot.iso} className="slot-choice">
              <input
                type="radio"
                name="scheduledAt"
                value={slot.iso}
                required
                checked={timeIso === slot.iso}
                onChange={() => setTimeIso(slot.iso)}
              />
              <span>{slot.timeLabel}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <p className="section-note" data-testid="timezone-note">
        <Icon name="clock" size={16} /> {copy.bookTimezone}
      </p>

      <p className="booking-summary" data-ready={chosenService && chosenSlot ? "true" : "false"}>
        <Icon name={chosenService && chosenSlot ? "check" : "calendar"} size={18} />
        <span>
          {chosenService && chosenSlot
            ? `${chosenService.name} · ${chosenSlot.dateLabel} · ${chosenSlot.timeLabel}`
            : copy.bookSummaryEmpty}
        </span>
      </p>

      <input type="hidden" name="providerId" value={providerId} />

      <button type="submit" className="button" disabled={pending}>
        {copy.bookConfirm}
      </button>
    </form>
  );
}
