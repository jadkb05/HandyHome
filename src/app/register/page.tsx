import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/RegisterForm";
import { Icon } from "@/components/ui/Icon";
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
      <h1 className="page-title">{copy.registerTitle}</h1>
      <p className="lead">{copy.registerLead}</p>
      <RegisterForm />
      </div>
    </section>
  );
}
