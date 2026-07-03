import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";
import { APP_DESCRIPTION } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND.name,
    short_name: BRAND.shortName,
    description: APP_DESCRIPTION,
    start_url: "/today",
    display: "standalone",
    orientation: "portrait",
    background_color: BRAND.backgroundColor,
    theme_color: BRAND.themeColor,
    categories: ["productivity", "business"],
    icons: [
      {
        src: "/brand/logo.jpeg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "any",
      },
      {
        src: "/brand/logo.jpeg",
        sizes: "192x192",
        type: "image/jpeg",
        purpose: "maskable",
      },
      {
        src: "/brand/newjob-guru-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
