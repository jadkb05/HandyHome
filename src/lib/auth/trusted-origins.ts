import { developmentOrigins } from "@/lib/dev-origins";

/** Public production origin. Not a secret. Used so Vercel env drift cannot drop it. */
export const PRODUCTION_ORIGIN = "https://handy-home-tawny.vercel.app";

function httpsOriginFromHost(value: string | undefined): string | null {
  const host = value?.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!host || host.includes("/") || host.includes(" ")) {
    return null;
  }
  return `https://${host}`;
}

/**
 * Origins for this Vercel project only. Never "*".
 * VERCEL_URL / VERCEL_BRANCH_URL cover preview deployments of this app.
 */
export function vercelDeploymentOrigins(env: Record<string, string | undefined> = process.env): string[] {
  const origins = new Set<string>([PRODUCTION_ORIGIN]);
  for (const key of ["VERCEL_URL", "VERCEL_PROJECT_PRODUCTION_URL", "VERCEL_BRANCH_URL"] as const) {
    const origin = httpsOriginFromHost(env[key]);
    if (origin) {
      origins.add(origin);
    }
  }
  return [...origins];
}

export function authTrustedOrigins(options: {
  betterAuthUrl: string;
  nodeEnv: string;
  env?: Record<string, string | undefined>;
}): string[] {
  const origins = new Set<string>([options.betterAuthUrl, ...vercelDeploymentOrigins(options.env)]);
  if (options.nodeEnv !== "production") {
    for (const origin of developmentOrigins()) {
      origins.add(origin);
    }
  }
  return [...origins];
}
