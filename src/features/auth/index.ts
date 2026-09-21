/** Auth domain boundary. Production-grade hosted auth is out of 0€ demo scope. */
export {
  UserRole,
  getCurrentUser,
  requireAuth,
  requireRole,
  dashboardPath,
} from "@/lib/auth";
export type { AuthIdentity } from "@/lib/auth";
