import type { MetadataRoute } from "next";

import { getAllCategorySlugs, getAllProductSlugs } from "@/db/queries/catalog";
import { STORE } from "@/lib/constants";

export const dynamic = "force-dynamic";

const staticRoutes = ["", "/products", "/categories", "/search", "/wishlist", "/cart"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = STORE.siteUrl.replace(/\/$/, "");

  // A cold or unavailable database must not break sitemap generation.
  const [products, categories] = await Promise.all([
    getAllProductSlugs().catch(() => []),
    getAllCategorySlugs().catch(() => []),
  ]);

  const now = new Date();

  return [
    ...staticRoutes.map((route) => ({
      url: `${base}${route}`,
      lastModified: now,
      changeFrequency: route === "" ? ("daily" as const) : ("weekly" as const),
      priority: route === "" ? 1 : 0.7,
    })),
    ...categories.map((category) => ({
      url: `${base}/category/${category.slug}`,
      lastModified: category.updatedAt ?? now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...products.map((product) => ({
      url: `${base}/products/${product.slug}`,
      lastModified: product.updatedAt ?? now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
