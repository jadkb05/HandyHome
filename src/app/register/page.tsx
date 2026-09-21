import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthMarketingPanel } from "@/components/auth/AuthMarketingPanel";
import { RegisterForm } from "@/components/RegisterForm";
import { copy } from "@/content/en";
import { dashboardPath, getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: copy.registerTitle,
};

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(dashboardPath(user.role));
  }

  return (
    <section className="auth-shell">
      <AuthMarketingPanel />
      <div className="auth-card">
        <h1 className="page-title">{copy.registerTitle}</h1>
        <p className="lead">{copy.registerLead}</p>
        <RegisterForm />
      </div>
    </section>
  );
}
