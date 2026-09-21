export function formatPublicLocation(city: string, neighborhood?: string | null): string {
  const area = neighborhood?.trim();
  if (area) {
    return `${area} · ${city}`;
  }
  return city;
}

export function verificationLabel(verified: boolean): string {
  return verified ? "Verified" : "Not verified";
}
