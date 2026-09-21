/** Relative in-app path only. Rejects protocol-relative and external URLs. */
export function safeInternalPath(value: string | null | undefined): string | null {
  if (!value || value.length > 200) {
    return null;
  }
  if (!value.startsWith("/") || value.startsWith("//")) {
    return null;
  }
  if (value.includes("\\") || value.includes("://")) {
    return null;
  }
  return value;
}
