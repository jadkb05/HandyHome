"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { copy } from "@/content/en";
import { authClient } from "@/lib/auth/client";
import { dashboardPath, UserRole } from "@/lib/auth/types";
import { registerSchema } from "@/lib/auth/validation";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  USER_ALREADY_EXISTS: copy.authDuplicateEmail,
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: copy.authDuplicateEmail,
};

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    const parsed = registerSchema.safeParse({
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      role: String(formData.get("role") ?? ""),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? copy.authGenericError);
      return;
    }

    setPending(true);
    const name = parsed.data.name;
    const result = await authClient.signUp.email({
      email: parsed.data.email,
      password: parsed.data.password,
      name,
      role: parsed.data.role,
    });
    setPending(false);

    if (result.error) {
      setError(
        AUTH_ERROR_MESSAGES[result.error.code ?? ""] ??
          result.error.message ??
          copy.authGenericError,
      );
      return;
    }

    router.push(dashboardPath(parsed.data.role));
    router.refresh();
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {error ? (
        <p className="form-alert" role="alert" data-testid="auth-error">
          {error}
        </p>
      ) : null}

      <label className="field">
        <span>{copy.fieldName}</span>
        <input type="text" name="name" autoComplete="name" required minLength={2} maxLength={80} />
      </label>

      <label className="field">
        <span>{copy.fieldEmail}</span>
        <input type="email" name="email" autoComplete="email" required />
      </label>

      <label className="field">
        <span>{copy.fieldPassword}</span>
        <input type="password" name="password" autoComplete="new-password" required minLength={8} />
      </label>

      <fieldset className="role-fieldset">
        <legend>{copy.fieldRoleLegend}</legend>
        <label className="role-option">
          <input type="radio" name="role" value={UserRole.CLIENT} required defaultChecked />
          <span>
            <strong>{copy.roleClient}</strong>
            <span className="role-hint">{copy.roleClientHint}</span>
          </span>
        </label>
        <label className="role-option">
          <input type="radio" name="role" value={UserRole.PROFESSIONAL} required />
          <span>
            <strong>{copy.roleProfessional}</strong>
            <span className="role-hint">{copy.roleProfessionalHint}</span>
          </span>
        </label>
      </fieldset>

      <button type="submit" className="button" disabled={pending}>
        {copy.registerSubmit}
      </button>

      <p className="auth-switch">
        {copy.registerHasAccount}{" "}
        <Link href="/login">{copy.registerSignInLink}</Link>
      </p>
    </form>
  );
}
