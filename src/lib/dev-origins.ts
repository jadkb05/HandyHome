import { networkInterfaces } from "node:os";

function isPrivateIPv4(address: string): boolean {
  const parts = address.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }
  const [a, b] = parts;
  if (a === 10) {
    return true;
  }
  if (a === 192 && b === 168) {
    return true;
  }
  if (a === 172 && b != null && b >= 16 && b <= 31) {
    return true;
  }
  return false;
}

/** Hostnames allowed to hit the Next.js dev server from the local network. */
export function developmentRequestHosts(): string[] {
  const hosts = new Set(["localhost", "127.0.0.1"]);
  const extra = process.env.DEV_PUBLIC_HOST?.trim();
  if (extra) {
    hosts.add(extra.replace(/^https?:\/\//, "").replace(/:\d+$/, "").replace(/\/$/, ""));
  }
  for (const nets of Object.values(networkInterfaces())) {
    for (const net of nets ?? []) {
      const family = net.family === "IPv4";
      if (!family || net.internal || !isPrivateIPv4(net.address)) {
        continue;
      }
      hosts.add(net.address);
    }
  }
  return [...hosts];
}

export function developmentOrigins(ports: number[] = [3000, 3001]): string[] {
  const origins: string[] = [];
  for (const host of developmentRequestHosts()) {
    for (const port of ports) {
      origins.push(`http://${host}:${port}`);
    }
  }
  return origins;
}
