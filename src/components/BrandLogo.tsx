import Image from "next/image";
import { BRAND } from "@/lib/brand";

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
};

export function BrandLogo({ className, priority = false }: BrandLogoProps) {
  return (
    <Image
      src={BRAND.logoSrc}
      alt=""
      width={BRAND.logoIntrinsicWidth}
      height={BRAND.logoIntrinsicHeight}
      className={className}
      sizes="(min-width: 48rem) 7rem, 6.5rem"
      priority={priority}
    />
  );
}
