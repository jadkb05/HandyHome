import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { APIError } from "better-auth/api";
import { getPrisma } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { UserRole } from "@/lib/auth/types";
import { developmentOrigins } from "@/lib/dev-origins";
import { nameSchema, phoneSchema } from "@/lib/auth/validation";
import { PROFILE_PLACEHOLDER } from "@/features/professionals/completeness";

const env = getServerEnv();

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: prismaAdapter(getPrisma(), {
    provider: "postgresql",
  }),
  trustedOrigins: Array.from(
    new Set([
      env.BETTER_AUTH_URL,
      ...(env.NODE_ENV === "production" ? [] : developmentOrigins()),
    ]),
  ),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: false,
  },
  user: {
    additionalFields: {
      role: {
        type: ["CLIENT", "PROFESSIONAL"],
        required: true,
        input: true,
      },
      phone: {
        type: "string",
        required: false,
        input: true,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const role = (user as { role?: string }).role;
          if (role !== UserRole.CLIENT && role !== UserRole.PROFESSIONAL) {
            throw new APIError("BAD_REQUEST", {
              message: "Role must be CLIENT or PROFESSIONAL.",
            });
          }
          const name = nameSchema.safeParse((user as { name?: unknown }).name);
          if (!name.success) {
            throw new APIError("BAD_REQUEST", { message: name.error.issues[0]?.message });
          }
          const phone = (user as { phone?: unknown }).phone;
          if (phone != null && phone !== "") {
            const parsedPhone = phoneSchema.safeParse(phone);
            if (!parsedPhone.success) {
              throw new APIError("BAD_REQUEST", { message: parsedPhone.error.issues[0]?.message });
            }
          }
          return { data: { ...user, name: name.data } };
        },
        after: async (user) => {
          const role = (user as { role?: string }).role;
          if (role !== UserRole.PROFESSIONAL) {
            return;
          }
          await getPrisma().provider.create({
            data: {
              userId: user.id,
              profession: PROFILE_PLACEHOLDER,
              city: PROFILE_PLACEHOLDER,
              verified: false,
            },
          });
        },
      },
    },
  },
  plugins: [nextCookies()],
});
