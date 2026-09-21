import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/db/**/*.test.ts", "tests/auth/**/*.test.ts", "tests/marketplace/**/*.test.ts"],
    fileParallelism: false,
    globalSetup: ["./tests/db/global-setup.ts"],
    setupFiles: ["./tests/db/setup-env.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
