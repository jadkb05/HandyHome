import { cache } from "react";
import { getPrisma } from "@/lib/db";
import { reviewSummariesFor, summaryOrEmpty } from "@/features/reviews/summary";
import { publicProviderWhere } from "@/features/professionals/completeness";

const professionalCardInclude = {
  user: { select: { id: true, name: true, image: true } },
  services: { include: { service: true } },
} as const;

const professionalProfileInclude = {
  user: { select: { id: true, name: true, image: true } },
  services: { include: { service: true } },
  portfolio: { orderBy: { sortOrder: "asc" as const } },
  availability: { where: { active: true }, orderBy: { dayOfWeek: "asc" as const } },
} as const;

/** Publicly discoverable professionals only (complete profile with a service). */
export async function listProfessionals(options: { limit?: number } = {}) {
  const providers = await getPrisma().provider.findMany({
    where: publicProviderWhere,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: options.limit,
    include: professionalCardInclude,
  });
  const summaries = await reviewSummariesFor(providers.map((provider) => provider.id));
  return providers.map((provider) => ({
    ...provider,
    reviewSummary: summaryOrEmpty(summaries, provider.id),
  }));
}

/** Any provider by id. Callers decide whether an incomplete profile may be shown. */
export const getProfessionalById = cache(async (id: string) => {
  return getPrisma().provider.findUnique({
    where: { id },
    include: professionalProfileInclude,
  });
});

export const getProviderByUserId = cache(async (userId: string) => {
  return getPrisma().provider.findUnique({
    where: { userId },
    include: professionalProfileInclude,
  });
});

export type ListedProfessional = Awaited<ReturnType<typeof listProfessionals>>[number];
export type ProfessionalProfile = NonNullable<Awaited<ReturnType<typeof getProfessionalById>>>;
