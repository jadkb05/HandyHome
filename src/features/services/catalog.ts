/**
 * Seeded service catalog used by the marketplace demo dataset.
 *
 * OPEN_QUESTIONS T-07 remains unresolved internally. Public copy is
 * customer-facing and must not mention demo/taxonomy status.
 */
export const DEMO_SERVICE_CATALOG = [
  {
    slug: "plumbing",
    name: "Plumbing",
    description: "Repairs, leaks, taps and installations",
  },
  {
    slug: "electrical",
    name: "Electrical",
    description: "Wiring, outlets, lighting and electrical repairs",
  },
  {
    slug: "painting",
    name: "Painting",
    description: "Interior and exterior painting for homes",
  },
  {
    slug: "air-conditioning",
    name: "Air conditioning",
    description: "AC installation, servicing and repair",
  },
  {
    slug: "appliance-repair",
    name: "Appliance repair",
    description: "Household appliances, including water heaters",
  },
  {
    slug: "carpentry",
    name: "Carpentry",
    description: "Woodwork, fittings and indoor carpentry",
  },
  {
    slug: "cleaning",
    name: "Cleaning",
    description: "Home cleaning for apartments and houses",
  },
  {
    slug: "general-maintenance",
    name: "Home maintenance",
    description: "Everyday home repairs and upkeep",
  },
] as const;

export type DemoServiceSlug = (typeof DEMO_SERVICE_CATALOG)[number]["slug"];
