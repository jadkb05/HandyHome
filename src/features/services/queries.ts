import { cache } from "react";
import { getPrisma } from "@/lib/db";
import { publicProviderWhere } from "@/features/professionals/completeness";
import { reviewSummariesFor, summaryOrEmpty } from "@/features/reviews/summary";

const serviceListInclude = {
  _count: { select: { providers: { where: { provider: publicProviderWhere } } } },
} as const;

const serviceDetailInclude = {
  providers: {
    where: { provider: publicProviderWhere },
    include: {
      provider: {
        include: {
          user: { select: { id: true, name: true, image: true } },
          services: { include: { service: true } },
        },
      },
    },
  },
} as const;

export async function listServices() {
  return getPrisma().service.findMany({
    orderBy: { name: "asc" },
    include: serviceListInclude,
  });
}

export const getServiceBySlug = cache(async (slug: string) => {
  const service = await getPrisma().service.findUnique({
    where: { slug },
    include: serviceDetailInclude,
  });
  if (!service) {
    return null;
  }
  const summaries = await reviewSummariesFor(service.providers.map((item) => item.providerId));
  return {
    ...service,
    providers: service.providers.map((item) => ({
      ...item,
      provider: { ...item.provider, reviewSummary: summaryOrEmpty(summaries, item.providerId) },
    })),
  };
});

export type ListedService = Awaited<ReturnType<typeof listServices>>[number];
export type ServiceDetail = NonNullable<Awaited<ReturnType<typeof getServiceBySlug>>>;
