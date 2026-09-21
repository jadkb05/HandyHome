import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { Icon } from "@/components/ui/Icon";
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
      <aside className="auth-aside" aria-hidden="true">
        <p className="auth-aside__title">{copy.authAsideTitle}</p>
        <ul className="auth-aside__list">
          <li>
            <Icon name="check" size={18} />
            {copy.authAside1}
          </li>
          <li>
            <Icon name="check" size={18} />
            {copy.authAside2}
          </li>
          <li>
            <Icon name="check" size={18} />
            {copy.authAside3}
          </li>
        </ul>
      </aside>
      <div className="auth-card">
      <h1 className="page-title">{copy.loginTitle}</h1>
      <p className="lead">{copy.loginLead}</p>
      <LoginForm nextPath={nextPath} />
      </div>
    </section>
  );
}
