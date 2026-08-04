import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/build", "/faq", "/pricing", "/privacy", "/terms", "/fantasy/schedules", "/fantasy/leagues"],
      disallow: [
        "/api/",
        "/account",
        "/auth/",
        "/season/",
        "/share/",
        "/unsubscribe/",
        "/scorebar-preview",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
