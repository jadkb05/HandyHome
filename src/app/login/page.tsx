import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthMarketingPanel } from "@/components/auth/AuthMarketingPanel";
import { LoginForm } from "@/components/LoginForm";
import { copy } from "@/content/en";
import { dashboardPath, getCurrentUser, UserRole } from "@/lib/auth";
import { safeInternalPath } from "@/lib/navigation";

export const metadata: Metadata = {
  title: copy.loginTitle,
};

type PageProps = {
  searchParams: Promise<{ from?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const { from } = await searchParams;
  const nextPath = safeInternalPath(from);
  const user = await getCurrentUser();
  if (user) {
    if (user.role === UserRole.CLIENT && nextPath) {
      redirect(nextPath);
    }
    redirect(dashboardPath(user.role));
  }

  return (
    <section className="auth-shell">
      <AuthMarketingPanel />
      <div className="auth-card">
        <h1 className="page-title">{copy.loginTitle}</h1>
        <p className="lead">{copy.loginLead}</p>
        <LoginForm nextPath={nextPath} />
      </div>
    </section>
  );
}
