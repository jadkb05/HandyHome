import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

function isProtectedPath(pathname: string): boolean {
  return pathname === "/dashboard" || pathname.startsWith("/professional/");
}

export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  if (isProtectedPath(request.nextUrl.pathname) && !sessionCookie) {
    const login = new URL("/login", request.url);
    login.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/professional/:path*"],
};
