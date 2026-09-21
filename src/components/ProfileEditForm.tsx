"use client";

import { useActionState } from "react";
import { copy } from "@/content/en";
import { PROFILE_PLACEHOLDER } from "@/features/professionals/completeness";
import {
  updateOwnProviderProfileAction,
  type ProfileActionState,
} from "@/features/professionals/actions";

const initialState: ProfileActionState = { error: null, saved: false, fieldErrors: {} };

type ProfileEditFormProps = {
  profession: string;
  description: string;
  city: string;
  services: { id: string; name: string }[];
  selectedServiceIds: string[];
};

export function ProfileEditForm({
  profession,
  description,
  city,
  services,
  selectedServiceIds,
}: ProfileEditFormProps) {
  const [state, action, pending] = useActionState(updateOwnProviderProfileAction, initialState);
  const errors = state.fieldErrors;
  const professionPlaceholder = profession === PROFILE_PLACEHOLDER;
  const cityPlaceholder = city === PROFILE_PLACEHOLDER;

  return (
    <form className="auth-form profile-form" action={action} noValidate>
      {state.error ? (
        <p className="form-alert" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.saved ? (
        <p className="form-success" role="status">
          {copy.profileSaved}
        </p>
      ) : null}

      <label className="field">
        <span>{copy.fieldProfession}</span>
        <input
          type="text"
          name="profession"
          defaultValue={professionPlaceholder ? "" : profession}
          required
          minLength={2}
          maxLength={80}
          aria-invalid={errors.profession ? true : undefined}
          aria-describedby={errors.profession ? "profession-error" : undefined}
        />
        {errors.profession ? (
          <span id="profession-error" className="field-error">
            {errors.profession}
          </span>
        ) : null}
      </label>

      <label className="field">
        <span>{copy.fieldCity}</span>
        <input
          type="text"
          name="city"
          defaultValue={cityPlaceholder ? "" : city}
          required
          minLength={2}
          maxLength={80}
          aria-invalid={errors.city ? true : undefined}
          aria-describedby={errors.city ? "city-error" : undefined}
        />
        {errors.city ? (
          <span id="city-error" className="field-error">
            {errors.city}
          </span>
        ) : null}
      </label>

      <label className="field">
        <span>{copy.fieldDescription}</span>
        <textarea
          name="description"
          defaultValue={description}
          maxLength={500}
          rows={5}
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={errors.description ? "description-error" : undefined}
        />
        {errors.description ? (
          <span id="description-error" className="field-error">
            {errors.description}
          </span>
        ) : null}
      </label>

      <fieldset
        className="role-fieldset"
        aria-describedby={errors.services ? "services-error" : "services-hint"}
      >
        <legend>{copy.profileServicesLegend}</legend>
        <p id="services-hint" className="role-hint">
          {copy.profileServicesHint}
        </p>
        <div className="slot-list" data-testid="profile-service-options">
          {services.map((service) => (
            <label key={service.id} className="slot-choice">
              <input
                type="checkbox"
                name="serviceIds"
                value={service.id}
                defaultChecked={selectedServiceIds.includes(service.id)}
              />
              <span>{service.name}</span>
            </label>
          ))}
        </div>
        {errors.services ? (
          <span id="services-error" className="field-error">
            {errors.services}
          </span>
        ) : null}
      </fieldset>

      <button type="submit" className="button" disabled={pending}>
        {copy.saveProfile}
      </button>
    </form>
  );
}
