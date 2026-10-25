import type { MetadataRoute } from "next";
import { absUrl, siteOrigin } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/desk", "/admin", "/login", "/api"],
    },
    sitemap: absUrl("/sitemap.xml"),
    host: siteOrigin(),
  };
}
