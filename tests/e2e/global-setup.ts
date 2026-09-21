import { execFileSync, execSync } from "node:child_process";
import { demoDatabaseUrl, e2eDatabaseName, e2eDatabaseUrl } from "./env";
import { deletePlaywrightE2eUsers, prismaAt } from "./e2e-users";

function databaseExistsViaDocker(name: string): boolean | null {
  try {
    const out = execFileSync(
      "docker",
      [
        "compose",
        "exec",
        "-T",
        "postgres",
        "psql",
        "-U",
        "handyhome",
        "-d",
        "handyhome",
        "-tAc",
        `SELECT 1 FROM pg_database WHERE datname='${name}'`,
      ],
      { encoding: "utf8" },
    );
    return out.trim() === "1";
  } catch {
    return null;
  }
}

function createDatabaseViaDocker(name: string) {
  execFileSync(
    "docker",
    [
      "compose",
      "exec",
      "-T",
      "postgres",
      "psql",
      "-U",
      "handyhome",
      "-d",
      "handyhome",
      "-c",
      `CREATE DATABASE ${name}`,
    ],
    { stdio: "inherit" },
  );
}

function createDatabaseViaPsql(adminUrl: string, name: string) {
  const parsed = new URL(adminUrl);
  const env = { ...process.env, PGPASSWORD: decodeURIComponent(parsed.password) };
  const args = [
    "-h",
    parsed.hostname,
    "-p",
    parsed.port || "5432",
    "-U",
    decodeURIComponent(parsed.username),
    "-d",
    parsed.pathname.replace(/^\//, "") || "postgres",
  ];
  const exists = execFileSync(
    "psql",
    [...args, "-tAc", `SELECT 1 FROM pg_database WHERE datname='${name}'`],
    { env, encoding: "utf8" },
  ).trim();
  if (exists !== "1") {
    execFileSync("psql", [...args, "-c", `CREATE DATABASE ${name}`], { env, stdio: "inherit" });
  }
}

export function ensureDatabase(name: string, adminUrl: string) {
  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    throw new Error(`Refusing to create database with unsafe name: ${name}`);
  }

  const dockerExists = databaseExistsViaDocker(name);
  if (dockerExists === true) {
    return;
  }
  if (dockerExists === false) {
    createDatabaseViaDocker(name);
    return;
  }
  createDatabaseViaPsql(adminUrl, name);
}

async function purgePlaywrightE2eUsers(databaseUrl: string) {
  const prisma = prismaAt(databaseUrl);
  try {
    await deletePlaywrightE2eUsers(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

export function runAgainstE2e(command: string, e2eUrl: string) {
  execSync(command, {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: e2eUrl },
  });
}

export default async function globalSetup() {
  const demoUrl = demoDatabaseUrl();
  const e2eUrl = e2eDatabaseUrl();
  const e2eName = e2eDatabaseName(e2eUrl);

  ensureDatabase(e2eName, demoUrl);
  await purgePlaywrightE2eUsers(demoUrl);

  runAgainstE2e("npx prisma migrate deploy", e2eUrl);
  runAgainstE2e("npx tsx prisma/seed.ts", e2eUrl);
  await purgePlaywrightE2eUsers(e2eUrl);

  const check = prismaAt(e2eUrl);
  try {
    const ahmed = await check.user.findUnique({ where: { email: "ahmed@demo.handyhome.local" } });
    if (ahmed?.name !== "Ahmed El Mansouri") {
      throw new Error("Playwright database is missing the seeded Ahmed professional.");
    }
  } finally {
    await check.$disconnect();
  }
}
