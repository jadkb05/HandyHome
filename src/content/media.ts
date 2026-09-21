export const HERO_IMAGE = {
  src: "/images/home/handyhome-hero-services.jpeg",
  alt: "A home-service professional and a homeowner, with icons for plumbing, electrical, painting and other home jobs",
  width: 1024,
  height: 592,
} as const;

export const BRAND_STORY_IMAGE = {
  src: "/images/home/handyhome-superhero.jpeg",
  alt: "Illustrated HandyHome professional flying over neighborhood homes",
  width: 1024,
  height: 592,
} as const;

export const SERVICE_MEDIA: Record<string, { src: string; alt: string }> = {
  plumbing: { src: "/images/services/plumbing.jpg", alt: "Plumbing repair at a home sink" },
  electrical: { src: "/images/services/electrical.jpg", alt: "Electrical installation work" },
  painting: { src: "/images/services/painting.jpg", alt: "Interior wall painting" },
  "air-conditioning": {
    src: "/images/services/air-conditioning.jpg",
    alt: "Air conditioning unit being serviced",
  },
  "appliance-repair": {
    src: "/images/services/appliance-repair.jpg",
    alt: "Home appliance in a kitchen",
  },
  carpentry: { src: "/images/services/carpentry.jpg", alt: "Carpentry and woodwork" },
  cleaning: { src: "/images/services/cleaning.jpg", alt: "Home cleaning in progress" },
  "general-maintenance": {
    src: "/images/services/home-maintenance.jpg",
    alt: "General home maintenance",
  },
};

export const POPULAR_SERVICE_SLUGS = [
  "plumbing",
  "electrical",
  "cleaning",
  "painting",
  "air-conditioning",
  "appliance-repair",
] as const;
