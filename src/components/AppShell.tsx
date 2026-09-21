import type { ReactNode } from "react";
import Link from "next/link";
import { AssistantWidget } from "@/components/AssistantWidget";
import { BrandLogo } from "@/components/BrandLogo";
import { NavLink } from "@/components/NavLink";
import { Icon } from "@/components/ui/Icon";
import { SignOutButton } from "@/components/SignOutButton";
import { NavMenuBehavior } from "@/components/motion/NavMenuBehavior";
import { StickyHeader } from "@/components/motion/StickyHeader";
import { SceneBackdrop } from "@/components/visual/SceneBackdrop";
import { copy } from "@/content/en";
import { dashboardPath, getCurrentUser, UserRole, type AuthIdentity } from "@/lib/auth";

function PrimaryNav({
  user,
  className,
}: {
  user: AuthIdentity | null;
  className: string;
}) {
  return (
    <nav aria-label="Primary" className={className}>
      <NavLink href="/services">{copy.navServices}</NavLink>
      <NavLink href="/professionals">{copy.navProfessionals}</NavLink>
      <NavLink href="/search">{copy.navSearch}</NavLink>
      {user ? (
        <>
          <NavLink href={dashboardPath(user.role)}>
            {user.role === UserRole.PROFESSIONAL ? copy.navProfessionalDashboard : copy.navDashboard}
          </NavLink>
          {user.role === UserRole.PROFESSIONAL ? (
            <NavLink href="/professional/profile">{copy.navProfile}</NavLink>
          ) : null}
          <SignOutButton />
        </>
      ) : (
        <>
          <NavLink href="/login">{copy.navSignIn}</NavLink>
          <Link href="/register" className="button nav-cta">
            {copy.navGetStarted}
          </Link>
        </>
      )}
    </nav>
  );
}

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="brand-lockup" aria-label={copy.homeAria}>
          <BrandLogo className="brand-logo" priority />
        </Link>
        <PrimaryNav user={user} className="site-nav site-nav--desktop" />
        <details className="site-nav-wrap">
          <summary className="nav-toggle">{copy.navMenu}</summary>
          <PrimaryNav user={user} className="site-nav" />
        </details>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="footer-brand">
          <BrandLogo className="brand-logo brand-logo--footer" />
          <p>{copy.footerTagline}</p>
          <Link href="/search" className="button">
            {copy.findProfessional}
            <Icon name="arrow-right" size={18} />
          </Link>
        </div>
        <nav className="footer-nav" aria-label="Footer">
          <div>
            <p className="footer-heading">{copy.footerExplore}</p>
            <Link href="/services">{copy.navServices}</Link>
            <Link href="/professionals">{copy.navProfessionals}</Link>
            <Link href="/search">{copy.navSearch}</Link>
          </div>
          <div>
            <p className="footer-heading">{copy.footerAccount}</p>
            <Link href="/login">{copy.navSignIn}</Link>
            <Link href="/register">{copy.navRegister}</Link>
          </div>
          <div>
            <p className="footer-heading">{copy.productName}</p>
            <Link href="/#how-it-works">{copy.footerHow}</Link>
          </div>
        </nav>
        <p className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {copy.productName}
          </span>
          <span>{copy.footerPlace}</span>
        </p>
      </div>
    </footer>
  );
}

export async function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <SceneBackdrop variant="page" />
      <a className="skip-link" href="#main">
        {copy.skipToContent}
      </a>
      <StickyHeader />
      <NavMenuBehavior />
      <SiteHeader />
      <main id="main" className="app-main">
        {children}
      </main>
      <SiteFooter />
      <AssistantWidget />
    </div>
  );
}
