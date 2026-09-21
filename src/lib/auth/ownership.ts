import { ForbiddenError } from "@/lib/auth/errors";
import type { AuthIdentity } from "@/lib/auth/types";

/**
 * Future Booking/Quote/Review queries must use this owner id, never a
 * client-supplied userId/clientId/providerUserId query parameter.
 */
export function ownerIdFromSession(
  identity: AuthIdentity,
  claimedOwnerId?: string | null,
): string {
  void claimedOwnerId;
  return identity.userId;
}

export function assertOwnership(identityUserId: string, resourceOwnerId: string): void {
  if (identityUserId !== resourceOwnerId) {
    throw new ForbiddenError();
  }
}

export function assertRole(
  identity: AuthIdentity,
  allowed: readonly AuthIdentity["role"][],
): void {
  if (!allowed.includes(identity.role)) {
    throw new ForbiddenError();
  }
}
