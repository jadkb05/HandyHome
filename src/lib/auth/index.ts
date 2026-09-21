export { UserRole, dashboardPath, isUserRole, type AuthIdentity } from "@/lib/auth/types";
export {
  getCurrentUser,
  getCurrentUserFromHeaders,
  requireAuth,
  requireAuthFromHeaders,
  requireRole,
  requireRoleFromHeaders,
  requirePageAuth,
  requirePageRole,
} from "@/lib/auth/session";
export { ownerIdFromSession, assertOwnership, assertRole } from "@/lib/auth/ownership";
export { UnauthorizedError, ForbiddenError } from "@/lib/auth/errors";
export { registerSchema, loginSchema, passwordSchema } from "@/lib/auth/validation";
