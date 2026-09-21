import { demoDatabaseUrl, e2eDatabaseName, testDatabaseUrl } from "../e2e/env";
import { ensureDatabase, runAgainstE2e } from "../e2e/global-setup";

/**
 * Vitest runs against its own database so test rows never land in the public
 * demo data. The database is created if missing, migrated with the committed
 * migrations (never `migrate dev`), and seeded with the demo catalog.
 */
export default function setup() {
  const testUrl = testDatabaseUrl();
  if (testUrl === demoDatabaseUrl()) {
    throw new Error("Refusing to run Vitest against the demo database. Set TEST_DATABASE_URL.");
  }
  ensureDatabase(e2eDatabaseName(testUrl), demoDatabaseUrl());
  runAgainstE2e("npx prisma migrate deploy", testUrl);
  runAgainstE2e("npx tsx prisma/seed.ts", testUrl);
}
