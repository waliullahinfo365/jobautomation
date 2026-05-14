import Image from "next/image";
import { BRAND } from "@/lib/brand";

export function BrandIcon({ size = 40 }: { size?: number }) {
  return (
    <Image
      src={BRAND.iconPath}
      alt={BRAND.name}
      width={size}
      height={size}
      priority
    />
  );
}
