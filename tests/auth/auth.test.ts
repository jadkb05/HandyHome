import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { auth } from "@/lib/auth/auth";
import { ForbiddenError, UnauthorizedError } from "@/lib/auth/errors";
import { assertOwnership, ownerIdFromSession } from "@/lib/auth/ownership";
import {
  getCurrentUserFromHeaders,
  requireAuthFromHeaders,
  requireRoleFromHeaders,
} from "@/lib/auth/session";
import { UserRole, type AuthIdentity } from "@/lib/auth/types";

const prisma = new PrismaClient();
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const origin = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

class CookieJar {
  private readonly cookies = new Map<string, string>();

  apply(responseHeaders: Headers) {
    const lines =
      typeof responseHeaders.getSetCookie === "function"
        ? responseHeaders.getSetCookie()
        : responseHeaders.get("set-cookie")
          ? [responseHeaders.get("set-cookie")!]
          : [];
    for (const line of lines) {
      const [pair] = line.split(";");
      const eq = pair.indexOf("=");
      if (eq === -1) {
        continue;
      }
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1);
      if (!name) {
        continue;
      }
      if (!value || /max-age=0/i.test(line)) {
        this.cookies.delete(name);
        continue;
      }
      this.cookies.set(name, value);
    }
  }

  headers(): Headers {
    const headers = new Headers({ origin });
    if (this.cookies.size > 0) {
      headers.set(
        "cookie",
        [...this.cookies.entries()].map(([name, value]) => `${name}=${value}`).join("; "),
      );
    }
    return headers;
  }
}

async function signUp(input: {
  email: string;
  password: string;
  name: string;
  role: string;
}) {
  const jar = new CookieJar();
  const response = await auth.api.signUpEmail({
    body: {
      email: input.email,
      password: input.password,
      name: input.name,
      role: input.role as "CLIENT" | "PROFESSIONAL",
    },
    headers: jar.headers(),
    asResponse: true,
  });
  jar.apply(response.headers);
  const body = (await response.json()) as {
    user?: { id: string; email: string; role?: string; password?: unknown };
    message?: string;
    code?: string;
  };
  return { status: response.status, body, jar };
}

async function signIn(email: string, password: string, jar = new CookieJar()) {
  const response = await auth.api.signInEmail({
    body: { email, password },
    headers: jar.headers(),
    asResponse: true,
  });
  jar.apply(response.headers);
  const body = (await response.json()) as {
    user?: { id: string; email: string; role?: string; password?: unknown };
    message?: string;
  };
  return { status: response.status, body, jar };
}

async function cleanup() {
  await prisma.favorite.deleteMany({
    where: { client: { email: { contains: suffix } } },
  });
  await prisma.provider.deleteMany({
    where: { user: { email: { contains: suffix } } },
  });
  await prisma.session.deleteMany({
    where: { user: { email: { contains: suffix } } },
  });
  await prisma.account.deleteMany({
    where: { user: { email: { contains: suffix } } },
  });
  await prisma.verification.deleteMany({
    where: { identifier: { contains: suffix } },
  });
  await prisma.user.deleteMany({
    where: { email: { contains: suffix } },
  });
}

beforeAll(async () => {
  await cleanup();
});

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("Phase 3 authentication", () => {
  it("AUTH-01: register CLIENT", async () => {
    const email = `client-${suffix}@test.handyhome.local`;
    const result = await signUp({
      email,
      password: "ValidPass123",
      name: "Auth Client",
      role: UserRole.CLIENT,
    });
    expect(result.status).toBe(200);
    expect(result.body.user?.email).toBe(email);
    expect(result.body.user?.role).toBe(UserRole.CLIENT);
    expect(result.body.user?.password).toBeUndefined();

    const stored = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(stored.role).toBe(UserRole.CLIENT);
    expect(stored.passwordHash).toBeNull();
    const account = await prisma.account.findFirst({ where: { userId: stored.id } });
    expect(account?.password).toBeTruthy();
    expect(account?.password).not.toBe("ValidPass123");
    expect(await prisma.provider.findUnique({ where: { userId: stored.id } })).toBeNull();
  });

  it("AUTH-02: register PROFESSIONAL", async () => {
    const email = `pro-${suffix}@test.handyhome.local`;
    const result = await signUp({
      email,
      password: "ValidPass123",
      name: "Auth Professional",
      role: UserRole.PROFESSIONAL,
    });
    expect(result.status).toBe(200);
    expect(result.body.user?.role).toBe(UserRole.PROFESSIONAL);
    const stored = await prisma.user.findUniqueOrThrow({ where: { email } });
    const provider = await prisma.provider.findUniqueOrThrow({ where: { userId: stored.id } });
    expect(provider.verified).toBe(false);
  });

  it("AUTH-03: duplicate email rejected", async () => {
    const email = `dup-${suffix}@test.handyhome.local`;
    const first = await signUp({
      email,
      password: "ValidPass123",
      name: "First",
      role: UserRole.CLIENT,
    });
    expect(first.status).toBe(200);
    const second = await signUp({
      email,
      password: "ValidPass123",
      name: "Second",
      role: UserRole.CLIENT,
    });
    expect(second.status).toBeGreaterThanOrEqual(400);
  });

  it("AUTH-04: login with valid credentials", async () => {
    const email = `login-${suffix}@test.handyhome.local`;
    await signUp({
      email,
      password: "ValidPass123",
      name: "Login User",
      role: UserRole.CLIENT,
    });
    const result = await signIn(email, "ValidPass123");
    expect(result.status).toBe(200);
    expect(result.body.user?.email).toBe(email);
    expect(result.body.user?.password).toBeUndefined();
  });

  it("AUTH-05: invalid credentials rejected", async () => {
    const email = `invalid-${suffix}@test.handyhome.local`;
    await signUp({
      email,
      password: "ValidPass123",
      name: "Invalid User",
      role: UserRole.CLIENT,
    });
    const wrongPassword = await signIn(email, "WrongPass123");
    expect(wrongPassword.status).toBeGreaterThanOrEqual(400);
    const missing = await signIn(`missing-${suffix}@test.handyhome.local`, "ValidPass123");
    expect(missing.status).toBeGreaterThanOrEqual(400);
  });

  it("AUTH-06: authenticated session can be retrieved", async () => {
    const email = `session-${suffix}@test.handyhome.local`;
    const created = await signUp({
      email,
      password: "ValidPass123",
      name: "Session User",
      role: UserRole.CLIENT,
    });
    const identity = await getCurrentUserFromHeaders(created.jar.headers());
    expect(identity?.email).toBe(email);
    expect(identity?.userId).toBe(created.body.user?.id);
    expect(identity?.role).toBe(UserRole.CLIENT);
  });

  it("AUTH-07: logout invalidates the session", async () => {
    const email = `logout-${suffix}@test.handyhome.local`;
    const created = await signUp({
      email,
      password: "ValidPass123",
      name: "Logout User",
      role: UserRole.CLIENT,
    });
    const userId = created.body.user!.id;
    expect(await prisma.session.count({ where: { userId } })).toBeGreaterThan(0);

    const response = await auth.api.signOut({
      headers: created.jar.headers(),
      asResponse: true,
    });
    created.jar.apply(response.headers);
    expect(response.status).toBe(200);
    expect(await getCurrentUserFromHeaders(created.jar.headers())).toBeNull();
    expect(await prisma.session.count({ where: { userId } })).toBe(0);
  });

  it("AUTH-08: anonymous user cannot access protected helpers", async () => {
    const headers = new Headers({ origin });
    await expect(requireAuthFromHeaders(headers)).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(requireRoleFromHeaders(headers, UserRole.CLIENT)).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it("AUTH-09: CLIENT cannot access PROFESSIONAL protected helpers", async () => {
    const created = await signUp({
      email: `client-iso-${suffix}@test.handyhome.local`,
      password: "ValidPass123",
      name: "Client Isolation",
      role: UserRole.CLIENT,
    });
    await expect(
      requireRoleFromHeaders(created.jar.headers(), UserRole.PROFESSIONAL),
    ).rejects.toBeInstanceOf(ForbiddenError);
    const client = await requireRoleFromHeaders(created.jar.headers(), UserRole.CLIENT);
    expect(client.role).toBe(UserRole.CLIENT);
  });

  it("AUTH-10: PROFESSIONAL cannot access CLIENT-only helpers", async () => {
    const created = await signUp({
      email: `pro-iso-${suffix}@test.handyhome.local`,
      password: "ValidPass123",
      name: "Pro Isolation",
      role: UserRole.PROFESSIONAL,
    });
    await expect(
      requireRoleFromHeaders(created.jar.headers(), UserRole.CLIENT),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("AUTH-11: authenticated identity comes from the server session", async () => {
    const created = await signUp({
      email: `identity-${suffix}@test.handyhome.local`,
      password: "ValidPass123",
      name: "Identity User",
      role: UserRole.CLIENT,
    });
    const fromSession = await requireAuthFromHeaders(created.jar.headers());
    expect(fromSession.userId).toBe(created.body.user?.id);
    expect(fromSession.userId).not.toBe("forged-user-id");
  });

  it("AUTH-12: client-provided userId cannot bypass ownership", () => {
    const identity: AuthIdentity = {
      userId: "session-user-id",
      email: "owner@test.handyhome.local",
      name: "Owner",
      role: UserRole.CLIENT,
    };
    expect(ownerIdFromSession(identity, "attacker-user-id")).toBe("session-user-id");
    expect(() => assertOwnership(identity.userId, "attacker-user-id")).toThrow(ForbiddenError);
  });

  it("rejects an invalid role at registration", async () => {
    const result = await signUp({
      email: `role-${suffix}@test.handyhome.local`,
      password: "ValidPass123",
      name: "Bad Role",
      role: "ADMIN",
    });
    expect(result.status).toBeGreaterThanOrEqual(400);
  });
});
