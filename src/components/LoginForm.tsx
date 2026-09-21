"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { copy } from "@/content/en";
import { authClient } from "@/lib/auth/client";
import { dashboardPath, isUserRole, UserRole } from "@/lib/auth/types";
import { loginSchema } from "@/lib/auth/validation";

export function LoginForm({ nextPath }: { nextPath?: string | null }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    const parsed = loginSchema.safeParse({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? copy.authGenericError);
      return;
    }

    setPending(true);
    const result = await authClient.signIn.email({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setPending(false);

    if (result.error) {
      setError(copy.authInvalidCredentials);
      return;
    }

    const role = result.data?.user && "role" in result.data.user ? result.data.user.role : undefined;
    if (isUserRole(role) && role === UserRole.CLIENT && nextPath) {
      router.push(nextPath);
    } else {
      router.push(isUserRole(role) ? dashboardPath(role) : "/dashboard");
    }
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
        <span>{copy.fieldEmail}</span>
        <input type="email" name="email" autoComplete="email" required />
      </label>

      <label className="field">
        <span>{copy.fieldPassword}</span>
        <input type="password" name="password" autoComplete="current-password" required />
      </label>

      <button type="submit" className="button" disabled={pending}>
        {copy.loginSubmit}
      </button>

      <p className="auth-switch">
        {copy.loginNoAccount}{" "}
        <Link href="/register">{copy.loginRegisterLink}</Link>
      </p>
    </form>
  );
}
