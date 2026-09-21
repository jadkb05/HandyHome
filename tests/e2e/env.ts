import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const PLAYWRIGHT_PORT = 3001;
export const PLAYWRIGHT_ORIGIN = `http://127.0.0.1:${PLAYWRIGHT_PORT}`;

function loadDotEnv() {
  const envPath = resolve(process.cwd(), ".env");
  try {
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }
      const separator = trimmed.indexOf("=");
      if (separator === -1) {
        continue;
      }
      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim().replace(/^"|"$/g, "");
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env is optional when the process already has DATABASE_URL.
  }
}

loadDotEnv();

export function demoDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required for Playwright setup.");
  }
  return url;
}

export function e2eDatabaseUrl(): string {
  if (process.env.E2E_DATABASE_URL) {
    return process.env.E2E_DATABASE_URL;
  }
  const demo = new URL(demoDatabaseUrl());
  demo.pathname = "/handyhome_e2e";
  return demo.toString();
}

export function e2eDatabaseName(url = e2eDatabaseUrl()): string {
  return decodeURIComponent(new URL(url).pathname.replace(/^\//, "").split("/")[0] ?? "handyhome_e2e");
}

/**
 * Vitest database. Kept apart from the demo database (public data) and from
 * the Playwright database. Override with TEST_DATABASE_URL.
 */
export function testDatabaseUrl(): string {
  if (process.env.TEST_DATABASE_URL) {
    return process.env.TEST_DATABASE_URL;
  }
  const demo = new URL(demoDatabaseUrl());
  demo.pathname = "/handyhome_test";
  return demo.toString();
}
