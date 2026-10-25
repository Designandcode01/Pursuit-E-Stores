import { NextResponse } from "next/server";

import { quickSearchProducts } from "@/db/queries/catalog";
import { rateLimit } from "@/lib/rate-limit";
import { searchSchema } from "@/lib/validations";

export const runtime = "nodejs";

/**
 * Instant search endpoint used by the header search dialog.
 *
 * In production put a CDN cache in front of this route and/or swap the
 * in-memory limiter for Upstash Ratelimit so limits are shared across
 * serverless instances.
 */
export async function GET(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous";

  const limit = rateLimit(`search:${ip}`, 60, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { results: [], error: "Too many searches. Please try again in a minute." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((limit.retryAfterMs ?? 1000) / 1000)) },
      },
    );
  }

  const url = new URL(request.url);
  const parsed = searchSchema.safeParse({ q: url.searchParams.get("q") ?? "" });

  if (!parsed.success || parsed.data.q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const rows = await quickSearchProducts(parsed.data.q, 6);

    return NextResponse.json(
      {
        results: rows.map((row) => ({
          id: row.id,
          name: row.name,
          slug: row.slug,
          price: row.basePrice,
          compareAtPrice: row.compareAtPrice,
          category: row.categoryName,
          image: row.imageUrl ? { url: row.imageUrl, alt: row.imageAlt } : null,
        })),
      },
      { headers: { "Cache-Control": "private, max-age=30" } },
    );
  } catch (error) {
    console.error("[api/search] Search failed", error);
    return NextResponse.json({ results: [], error: "Search is unavailable right now." }, { status: 500 });
  }
}
