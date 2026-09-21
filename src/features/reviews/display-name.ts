/**
 * Public review author label: first name + last initial ("Karim H.").
 * Never derived from an email address; falls back to null when unusable.
 */
export function publicAuthorName(fullName: string): string | null {
  const cleaned = fullName.trim().replace(/\s+/g, " ");
  if (!cleaned || cleaned.includes("@")) {
    return null;
  }
  const parts = cleaned.split(" ");
  const first = parts[0];
  if (parts.length === 1) {
    return first;
  }
  const lastInitial = [...parts[parts.length - 1]][0]?.toUpperCase();
  return lastInitial ? `${first} ${lastInitial}.` : first;
}
