import { z } from "zod";
import { SLOT_HORIZON_DAYS } from "@/features/bookings/slots";
import { addCivilDays, civilDateInBusinessTimezone, isValidCivilDate } from "@/lib/datetime";

const optionalText = z
  .string()
  .trim()
  .max(80)
  .optional()
  .transform((value) => (value ? value : undefined));

const optionalDate = z
  .string()
  .trim()
  .max(10)
  .optional()
  .transform((value) => (value ? value : undefined))
  .refine((value) => value === undefined || isValidCivilDate(value), "Date must be a valid calendar day.");

export const searchParamsSchema = z.object({
  service: z
    .string()
    .trim()
    .max(80)
    .regex(/^[a-z0-9-]*$/, "Service must be a slug.")
    .optional()
    .transform((value) => (value ? value : undefined)),
  city: optionalText,
  neighborhood: optionalText,
  date: optionalDate,
  verified: z
    .enum(["", "1", "true", "false", "0"])
    .optional()
    .transform((value) => value === "1" || value === "true"),
  sort: z.enum(["name", "nearest"]).optional().default("name"),
  lat: z.coerce.number().gte(-90).lte(90).optional(),
  lng: z.coerce.number().gte(-180).lte(180).optional(),
  radius: z.coerce.number().gt(0).lte(100).optional(),
});

export type SearchFilters = z.infer<typeof searchParamsSchema>;

export class InvalidSearchParamsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidSearchParamsError";
  }
}

export type SearchDateWindow = {
  min: string;
  max: string;
};

export function searchDateWindow(now = new Date()): SearchDateWindow {
  const min = civilDateInBusinessTimezone(now);
  return { min, max: addCivilDays(min, SLOT_HORIZON_DAYS - 1) };
}

export function parseSearchParams(
  input: Record<string, string | string[] | undefined>,
  options?: { now?: Date },
): SearchFilters {
  const flattened: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(input)) {
    flattened[key] = Array.isArray(value) ? value[0] : value;
  }

  const parsed = searchParamsSchema.safeParse({
    service: flattened.service,
    city: flattened.city,
    neighborhood: flattened.neighborhood,
    date: flattened.date,
    verified: flattened.verified ?? "",
    sort: flattened.sort || "name",
    lat: flattened.lat || undefined,
    lng: flattened.lng || undefined,
    radius: flattened.radius || undefined,
  });

  if (!parsed.success) {
    throw new InvalidSearchParamsError("Those search filters could not be used.");
  }

  const filters = parsed.data;
  if ((filters.lat == null) !== (filters.lng == null)) {
    throw new InvalidSearchParamsError("Location needs both latitude and longitude.");
  }

  if (filters.date) {
    const window = searchDateWindow(options?.now ?? new Date());
    if (filters.date < window.min || filters.date > window.max) {
      throw new InvalidSearchParamsError("Those search filters could not be used.");
    }
  }

  return filters;
}
