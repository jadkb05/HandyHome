import { ForbiddenError } from "@/lib/auth/errors";
import { assertOwnership, assertRole, ownerIdFromSession } from "@/lib/auth/ownership";
import { UserRole, type AuthIdentity } from "@/lib/auth/types";
import { getPrisma } from "@/lib/db";
import { fieldErrorsFromZod, ProfileValidationError } from "@/features/professionals/errors";
import { providerProfileSchema } from "@/features/professionals/validation";

/**
 * Updates the Provider owned by the authenticated PROFESSIONAL.
 * Client-supplied providerId / userId values cannot select another row.
 */
export async function updateProviderProfileForIdentity(
  identity: AuthIdentity,
  input: unknown,
) {
  assertRole(identity, [UserRole.PROFESSIONAL]);
  const result = providerProfileSchema.safeParse(input);
  if (!result.success) {
    throw new ProfileValidationError(fieldErrorsFromZod(result.error));
  }
  const parsed = result.data;
  const ownerUserId = ownerIdFromSession(identity, parsed.claimedOwnerId);
  const provider = await getPrisma().provider.findUnique({
    where: { userId: ownerUserId },
  });
  if (!provider) {
    throw new ForbiddenError("No professional profile is linked to this account.");
  }
  assertOwnership(identity.userId, provider.userId);
  if (parsed.claimedProviderId && parsed.claimedProviderId !== provider.id) {
    throw new ForbiddenError();
  }

  const serviceIds = parsed.serviceIds ? [...new Set(parsed.serviceIds)] : null;
  if (serviceIds) {
    const known = await getPrisma().service.count({ where: { id: { in: serviceIds } } });
    if (known !== serviceIds.length) {
      throw new ProfileValidationError({ services: "Choose services from the list." });
    }
  }

  const prisma = getPrisma();
  return prisma.$transaction(async (tx) => {
    if (serviceIds) {
      await tx.providerService.deleteMany({
        where: { providerId: provider.id, serviceId: { notIn: serviceIds } },
      });
      await tx.providerService.createMany({
        data: serviceIds.map((serviceId) => ({ providerId: provider.id, serviceId })),
        skipDuplicates: true,
      });
    }
    return tx.provider.update({
      where: { id: provider.id },
      data: {
        profession: parsed.profession,
        description: parsed.description ? parsed.description : null,
        city: parsed.city,
      },
    });
  });
}
