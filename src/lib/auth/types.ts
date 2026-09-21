export const UserRole = {
  CLIENT: "CLIENT",
  PROFESSIONAL: "PROFESSIONAL",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export type AuthIdentity = {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
};

export function isUserRole(value: unknown): value is UserRole {
  return value === UserRole.CLIENT || value === UserRole.PROFESSIONAL;
}

export function dashboardPath(role: UserRole): string {
  return role === UserRole.PROFESSIONAL ? "/professional/dashboard" : "/dashboard";
}
