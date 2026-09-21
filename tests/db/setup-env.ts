import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function readDotEnv(): string {
  try {
    return readFileSync(resolve(process.cwd(), ".env"), "utf8");
  } catch {
    return "";
  }
}

for (const line of readDotEnv().split("\n")) {
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

if (!process.env.BETTER_AUTH_SECRET) {
  process.env.BETTER_AUTH_SECRET = "dev-only-handyhome-auth-secret-32chars-min";
}
if (!process.env.BETTER_AUTH_URL) {
  process.env.BETTER_AUTH_URL = "http://localhost:3000";
}

// Never touch the demo database from Vitest: point Prisma at the test database.
// (tests/db/global-setup.ts creates and migrates it.)
{
  const base = new URL(process.env.DATABASE_URL ?? "postgresql://handyhome:handyhome@localhost:5432/handyhome");
  base.pathname = "/handyhome_test";
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? base.toString();
}
