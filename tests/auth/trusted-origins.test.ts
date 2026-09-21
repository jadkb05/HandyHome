import { describe, expect, it } from "vitest";
import { PRODUCTION_ORIGIN, authTrustedOrigins, vercelDeploymentOrigins } from "@/lib/auth/trusted-origins";

describe("auth trusted origins", () => {
  it("always includes the public production origin and BETTER_AUTH_URL", () => {
    const origins = authTrustedOrigins({
      betterAuthUrl: "https://handyhome.vercel.app",
      nodeEnv: "production",
      env: {},
    });
    expect(origins).toContain(PRODUCTION_ORIGIN);
    expect(origins).toContain("https://handyhome.vercel.app");
    expect(origins).not.toContain("*");
  });

  it("adds this deployment's Vercel hosts, not arbitrary vercel.app sites", () => {
    const origins = vercelDeploymentOrigins({
      VERCEL_URL: "handy-home-tawny-git-fix-jadkb05.vercel.app",
      VERCEL_PROJECT_PRODUCTION_URL: "handy-home-tawny.vercel.app",
      VERCEL_BRANCH_URL: "handy-home-tawny-git-fix-jadkb05.vercel.app",
    });
    expect(origins).toContain("https://handy-home-tawny.vercel.app");
    expect(origins).toContain("https://handy-home-tawny-git-fix-jadkb05.vercel.app");
    expect(origins.some((origin) => origin.includes("other-app"))).toBe(false);
  });

  it("keeps localhost origins in non-production", () => {
    const origins = authTrustedOrigins({
      betterAuthUrl: "http://localhost:3000",
      nodeEnv: "test",
      env: {},
    });
    expect(origins).toContain("http://localhost:3000");
    expect(origins).toContain("http://127.0.0.1:3000");
  });
});
