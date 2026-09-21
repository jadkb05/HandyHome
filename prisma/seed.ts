import "./load-env";
import { PrismaClient } from "@prisma/client";
import { auth } from "../src/lib/auth/auth";
import { UserRole } from "../src/lib/auth/types";
import { DEMO_SERVICE_CATALOG } from "../src/features/services/catalog";

const prisma = new PrismaClient();

/** Documented demo-only passwords. Not production credentials.
 *  Playwright creates temporary e2e-*@demo.handyhome.local users in a separate
 *  database and deletes them after the auth spec. They are never seeded here.
 *  Display names are realistic marketplace profiles, not "[DEMO]" labels.
 */
export const DEMO_ACCOUNTS = {
  client: {
    email: "client@demo.handyhome.local",
    password: "DemoClient123!",
    name: "Karim Haddad",
    role: UserRole.CLIENT,
  },
  ahmed: {
    email: "ahmed@demo.handyhome.local",
    password: "DemoProAhmed123!",
    name: "Ahmed El Mansouri",
    role: UserRole.PROFESSIONAL,
  },
  fatima: {
    email: "fatima@demo.handyhome.local",
    password: "DemoProFatima123!",
    name: "Sara Amrani",
    role: UserRole.PROFESSIONAL,
  },
} as const;

type SeedAccount = {
  email: string;
  password: string;
  name: string;
  role: (typeof UserRole)[keyof typeof UserRole];
};

type SeedProfessional = {
  account: SeedAccount;
  phone: string;
  image: string | null;
  profession: string;
  description: string;
  experience: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  serviceSlugs: string[];
  availability: { dayOfWeek: number; startHour: number; endHour: number }[];
  portfolio: { mediaKey: string; url: string; altText: string; title: string; sortOrder: number }[];
};

const EXTRA_ACCOUNTS = {
  youssef: {
    email: "youssef@demo.handyhome.local",
    password: "DemoProYoussef123!",
    name: "Youssef Benali",
    role: UserRole.PROFESSIONAL,
  },
  imane: {
    email: "imane@demo.handyhome.local",
    password: "DemoProImane123!",
    name: "Imane Alaoui",
    role: UserRole.PROFESSIONAL,
  },
  omar: {
    email: "omar@demo.handyhome.local",
    password: "DemoProOmar123!",
    name: "Omar Tazi",
    role: UserRole.PROFESSIONAL,
  },
  nadia: {
    email: "nadia@demo.handyhome.local",
    password: "DemoProNadia123!",
    name: "Nadia Bennani",
    role: UserRole.PROFESSIONAL,
  },
} as const;

const MARKETPLACE_PROFESSIONALS: SeedProfessional[] = [
  {
    account: DEMO_ACCOUNTS.ahmed,
    phone: "+212600000002",
    image: null,
    profession: "Plumber",
    description:
      "Plumbing repairs and installations for apartments and houses around Maarif. Leaks, taps, pipes and water heaters.",
    experience: "10 years",
    city: "Casablanca",
    address: "Maarif",
    latitude: 33.57311,
    longitude: -7.58984,
    serviceSlugs: ["plumbing", "appliance-repair", "general-maintenance"],
    availability: [
      { dayOfWeek: 1, startHour: 8, endHour: 16 },
      { dayOfWeek: 3, startHour: 8, endHour: 16 },
    ],
    portfolio: [
      {
        mediaKey: "marketplace/ahmed/bathroom-pipe",
        url: "/images/portfolio/bathroom-pipe-repair.jpg",
        altText: "Repaired bathroom pipes under a sink",
        title: "Bathroom pipe repair",
        sortOrder: 0,
      },
      {
        mediaKey: "marketplace/ahmed/water-heater",
        url: "/images/portfolio/water-heater.jpg",
        altText: "Installed domestic water heater",
        title: "Water heater installation",
        sortOrder: 1,
      },
      {
        mediaKey: "marketplace/ahmed/sink",
        url: "/images/portfolio/sink-installation.jpg",
        altText: "Newly installed kitchen sink",
        title: "Sink installation",
        sortOrder: 2,
      },
    ],
  },
  {
    account: DEMO_ACCOUNTS.fatima,
    phone: "+212600000003",
    image: null,
    profession: "Electrician",
    description:
      "Electrical repairs and installations for homes in Gauthier. Outlets, lighting and kitchen electrical work.",
    experience: "8 years",
    city: "Casablanca",
    address: "Gauthier",
    latitude: 33.589,
    longitude: -7.632,
    serviceSlugs: ["electrical"],
    availability: [{ dayOfWeek: 2, startHour: 9, endHour: 17 }],
    portfolio: [
      {
        mediaKey: "marketplace/sara/kitchen-electrical",
        url: "/images/portfolio/kitchen-electrical.jpg",
        altText: "Kitchen electrical installation",
        title: "Kitchen electrical work",
        sortOrder: 0,
      },
    ],
  },
  {
    account: EXTRA_ACCOUNTS.youssef,
    phone: "+212600000004",
    image: null,
    profession: "HVAC Technician",
    description: "Air conditioning installation and servicing for homes in Bourgogne.",
    experience: "12 years",
    city: "Casablanca",
    address: "Bourgogne",
    latitude: 33.595,
    longitude: -7.64,
    serviceSlugs: ["air-conditioning"],
    availability: [{ dayOfWeek: 4, startHour: 8, endHour: 16 }],
    portfolio: [
      {
        mediaKey: "marketplace/youssef/ac",
        url: "/images/portfolio/air-conditioning.jpg",
        altText: "Air conditioning unit installed on a wall",
        title: "Air conditioning installation",
        sortOrder: 0,
      },
    ],
  },
  {
    account: EXTRA_ACCOUNTS.imane,
    phone: "+212600000005",
    image: null,
    profession: "Home Cleaner",
    description: "Home cleaning for apartments and houses in Anfa.",
    experience: "6 years",
    city: "Casablanca",
    address: "Anfa",
    latitude: 33.588,
    longitude: -7.665,
    serviceSlugs: ["cleaning"],
    availability: [{ dayOfWeek: 5, startHour: 9, endHour: 17 }],
    portfolio: [
      {
        mediaKey: "marketplace/imane/cleaning",
        url: "/images/portfolio/home-cleaning.jpg",
        altText: "Cleaned home interior",
        title: "Apartment deep clean",
        sortOrder: 0,
      },
    ],
  },
  {
    account: EXTRA_ACCOUNTS.omar,
    phone: "+212600000006",
    image: null,
    profession: "Carpenter",
    description: "Indoor carpentry, fittings and wood repairs in Maarif.",
    experience: "9 years",
    city: "Casablanca",
    address: "Maarif",
    latitude: 33.57,
    longitude: -7.586,
    serviceSlugs: ["carpentry"],
    availability: [{ dayOfWeek: 1, startHour: 9, endHour: 17 }],
    portfolio: [
      {
        mediaKey: "marketplace/omar/carpentry",
        url: "/images/portfolio/carpentry.jpg",
        altText: "Finished carpentry work in a home",
        title: "Built-in woodwork",
        sortOrder: 0,
      },
    ],
  },
  {
    account: EXTRA_ACCOUNTS.nadia,
    phone: "+212600000007",
    image: null,
    profession: "Painter",
    description: "Interior wall painting and finishing for homes in Ain Diab.",
    experience: "7 years",
    city: "Casablanca",
    address: "Ain Diab",
    latitude: 33.5892,
    longitude: -7.6033,
    serviceSlugs: ["painting"],
    availability: [{ dayOfWeek: 3, startHour: 9, endHour: 17 }],
    portfolio: [
      {
        mediaKey: "marketplace/nadia/painting",
        url: "/images/portfolio/interior-painting.jpg",
        altText: "Freshly painted interior wall",
        title: "Interior wall painting",
        sortOrder: 0,
      },
    ],
  },
];

async function signUpDemo(account: SeedAccount) {
  const result = await auth.api.signUpEmail({
    body: {
      email: account.email,
      password: account.password,
      name: account.name,
      role: account.role,
    },
  });
  return result.user.id;
}

async function upsertDemoCatalog() {
  const services = [];
  for (const item of DEMO_SERVICE_CATALOG) {
    const service = await prisma.service.upsert({
      where: { slug: item.slug },
      update: { name: item.name, description: item.description },
      create: { slug: item.slug, name: item.name, description: item.description },
    });
    services.push(service);
  }
  return Object.fromEntries(services.map((service) => [service.slug, service.id])) as Record<
    string,
    string
  >;
}

function clockDate(hour: number) {
  return new Date(Date.UTC(1970, 0, 1, hour, 0, 0, 0));
}

async function seedProfessional(profile: SeedProfessional, serviceIds: Record<string, string>) {
  const userId = await signUpDemo(profile.account);
  await prisma.user.update({
    where: { id: userId },
    data: { phone: profile.phone, image: profile.image },
  });

  const provider = await prisma.provider.update({
    where: { userId },
    data: {
      profession: profile.profession,
      description: profile.description,
      experience: profile.experience,
      city: profile.city,
      address: profile.address,
      latitude: profile.latitude,
      longitude: profile.longitude,
      verified: false,
      availability: {
        create: profile.availability.map((slot) => ({
          dayOfWeek: slot.dayOfWeek,
          startTime: clockDate(slot.startHour),
          endTime: clockDate(slot.endHour),
          active: true,
        })),
      },
      portfolio: {
        create: profile.portfolio,
      },
      services: {
        create: profile.serviceSlugs.map((slug) => ({ serviceId: serviceIds[slug] })),
      },
    },
  });

  return provider;
}

async function main() {
  const demoEmail = { endsWith: "@demo.handyhome.local" as const };
  const demoBooking = {
    OR: [{ client: { email: demoEmail } }, { provider: { user: { email: demoEmail } } }],
  };

  await prisma.payment.deleteMany({ where: { booking: demoBooking } });
  await prisma.quote.deleteMany({ where: { booking: demoBooking } });
  await prisma.diagnosis.deleteMany({ where: { booking: demoBooking } });
  await prisma.review.deleteMany({
    where: {
      OR: [{ client: { email: demoEmail } }, { provider: { user: { email: demoEmail } } }],
    },
  });
  await prisma.booking.deleteMany({ where: demoBooking });
  await prisma.portfolioItem.deleteMany({
    where: { provider: { user: { email: demoEmail } } },
  });
  await prisma.availability.deleteMany({
    where: { provider: { user: { email: { endsWith: "@demo.handyhome.local" } } } },
  });
  await prisma.favorite.deleteMany({
    where: { client: { email: { endsWith: "@demo.handyhome.local" } } },
  });
  await prisma.providerService.deleteMany({
    where: { provider: { user: { email: { endsWith: "@demo.handyhome.local" } } } },
  });
  await prisma.verification.deleteMany({
    where: { identifier: { endsWith: "@demo.handyhome.local" } },
  });
  await prisma.session.deleteMany({
    where: { user: { email: { endsWith: "@demo.handyhome.local" } } },
  });
  await prisma.account.deleteMany({
    where: { user: { email: { endsWith: "@demo.handyhome.local" } } },
  });
  await prisma.provider.deleteMany({
    where: { user: { email: { endsWith: "@demo.handyhome.local" } } },
  });
  await prisma.user.deleteMany({
    where: { email: { endsWith: "@demo.handyhome.local" } },
  });

  const serviceIds = await upsertDemoCatalog();

  const clientId = await signUpDemo(DEMO_ACCOUNTS.client);
  await prisma.user.update({
    where: { id: clientId },
    data: { phone: "+212600000001" },
  });

  const seeded = [];
  for (const profile of MARKETPLACE_PROFESSIONALS) {
    seeded.push(await seedProfessional(profile, serviceIds));
  }

  const ahmed = seeded[0];
  if (ahmed) {
    await prisma.favorite.create({
      data: {
        clientId,
        providerId: ahmed.id,
      },
    });
  }

  console.info("Seeded marketplace catalog and Casablanca-area profiles.");
  console.info({
    client: DEMO_ACCOUNTS.client.email,
    professionals: MARKETPLACE_PROFESSIONALS.map((profile) => profile.account.email),
    catalog: DEMO_SERVICE_CATALOG.map((item) => item.slug),
    verifiedFlags: MARKETPLACE_PROFESSIONALS.map(() => false),
  });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
