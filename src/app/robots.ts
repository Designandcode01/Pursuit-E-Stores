import type { MetadataRoute } from "next";

import { STORE } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  const base = STORE.siteUrl.replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/account", "/checkout", "/orders", "/api", "/sign-in", "/sign-up"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
