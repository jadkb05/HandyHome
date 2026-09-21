import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { ForbiddenError, UnauthorizedError } from "@/lib/auth/errors";
import {
  dashboardPath,
  isUserRole,
  type AuthIdentity,
  type UserRole,
} from "@/lib/auth/types";

export function identityFromSessionUser(user: {
  id: string;
  email: string;
  name: string;
  role?: unknown;
}): AuthIdentity {
  if (!isUserRole(user.role)) {
    throw new ForbiddenError("Authenticated user is missing a valid role.");
  }
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export async function getCurrentUserFromHeaders(
  requestHeaders: Headers,
): Promise<AuthIdentity | null> {
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });
  if (!session) {
    return null;
  }
  return identityFromSessionUser(session.user);
}

export async function getCurrentUser(): Promise<AuthIdentity | null> {
  return getCurrentUserFromHeaders(await headers());
}

export async function requireAuthFromHeaders(requestHeaders: Headers): Promise<AuthIdentity> {
  const user = await getCurrentUserFromHeaders(requestHeaders);
  if (!user) {
    throw new UnauthorizedError();
  }
  return user;
}

export async function requireAuth(): Promise<AuthIdentity> {
  return requireAuthFromHeaders(await headers());
}

export async function requireRoleFromHeaders(
  requestHeaders: Headers,
  role: UserRole,
): Promise<AuthIdentity> {
  const user = await requireAuthFromHeaders(requestHeaders);
  if (user.role !== role) {
    throw new ForbiddenError();
  }
  return user;
}

export async function requireRole(role: UserRole): Promise<AuthIdentity> {
  return requireRoleFromHeaders(await headers(), role);
}

export async function requirePageAuth(): Promise<AuthIdentity> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requirePageRole(role: UserRole): Promise<AuthIdentity> {
  const user = await requirePageAuth();
  if (user.role !== role) {
    redirect(dashboardPath(user.role));
  }
  return user;
}
