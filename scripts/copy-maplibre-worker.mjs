// MapLibre GL 6 locates its web worker with `new URL("./maplibre-gl-worker.mjs", import.meta.url)`.
// Next's bundler rewrites `import.meta.url` to a non-http URL, so MapLibre falls back to
// `new Worker("")` (the page itself) and the basemap never decodes a single tile.
// Serve the worker (and the shared chunk it imports) same-origin and point MapLibre at it
// with `setWorkerUrl` (see src/components/search/SearchMap.tsx). Copied from the installed
// package so the files always match the maplibre-gl version.
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const from = join(root, "node_modules", "maplibre-gl", "dist");
const to = join(root, "public", "maplibre");

mkdirSync(to, { recursive: true });
for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  copyFileSync(join(from, file), join(to, file));
}
