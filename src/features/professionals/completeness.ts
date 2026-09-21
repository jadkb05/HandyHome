import type { Prisma } from "@prisma/client";

/** Placeholder written when a professional registers, until they edit their profile. */
export const PROFILE_PLACEHOLDER = "Not set yet";

/**
 * A professional is publicly discoverable and bookable only with a real
 * profession, a real city and at least one offered service.
 */
export const publicProviderWhere: Prisma.ProviderWhereInput = {
  profession: { not: PROFILE_PLACEHOLDER },
  city: { not: PROFILE_PLACEHOLDER },
  services: { some: {} },
};

export type ProfileGap = "profession" | "city" | "services";

export function profileGaps(provider: {
  profession: string;
  city: string;
  serviceCount: number;
}): ProfileGap[] {
  const gaps: ProfileGap[] = [];
  if (!provider.profession.trim() || provider.profession === PROFILE_PLACEHOLDER) {
    gaps.push("profession");
  }
  if (!provider.city.trim() || provider.city === PROFILE_PLACEHOLDER) {
    gaps.push("city");
  }
  if (provider.serviceCount === 0) {
    gaps.push("services");
  }
  return gaps;
}

export function isProfilePublic(provider: {
  profession: string;
  city: string;
  serviceCount: number;
}): boolean {
  return profileGaps(provider).length === 0;
}
