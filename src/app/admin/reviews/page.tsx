import { Check, EyeOff, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { moderateReviewAction } from "@/actions/admin";
import { AdminFlash } from "@/components/admin/admin-flash";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { PageHeader } from "@/components/admin/page-header";
import { StarRating } from "@/components/shop/star-rating";
import { Badge } from "@/components/ui/badge";
import { getAdminReviews } from "@/db/queries/admin";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Reviews" };

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const reviews = await getAdminReviews();
  const pending = reviews.filter((review) => !review.isApproved);
  const published = reviews.filter((review) => review.isApproved);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reviews"
        description="New reviews are published automatically. Hide anything that breaks the house rules."
      />

      <AdminFlash params={params} />

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-xl text-stone-900">Awaiting review</h2>
          <Badge variant={pending.length > 0 ? "amber" : "secondary"}>{pending.length}</Badge>
        </div>

        {pending.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-300 bg-white px-5 py-8 text-center text-sm text-muted-foreground">
            Nothing waiting. New reviews are auto-approved, so this list fills only if you hide one.
          </p>
        ) : (
          <ul className="space-y-3">
            {pending.map((review) => (
              <li key={review.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <StarRating rating={review.rating} />
                    <p className="mt-1 text-sm font-semibold text-stone-900">
                      {review.title || "Untitled review"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {review.authorName} on{" "}
                      <Link
                        href={`/products/${review.productSlug}`}
                        className="text-brand-700 hover:underline"
                      >
                        {review.productName}
                      </Link>{" "}
                      · {formatDate(review.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <form action={moderateReviewAction}>
                      <input type="hidden" name="reviewId" value={review.id} />
                      <input type="hidden" name="action" value="approve" />
                      <button
                        type="submit"
                        className="inline-flex h-8 items-center gap-1.5 rounded-full bg-brand-700 px-3 text-xs font-semibold text-white hover:bg-brand-800"
                      >
                        <Check aria-hidden="true" className="size-3.5" />
                        Approve
                      </button>
                    </form>
                    <ConfirmForm
                      action={moderateReviewAction}
                      message="Delete this review permanently?"
                    >
                      <input type="hidden" name="reviewId" value={review.id} />
                      <input type="hidden" name="action" value="delete" />
                      <button
                        type="submit"
                        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-stone-300 px-3 text-xs font-semibold text-stone-600 hover:border-red-300 hover:text-red-700"
                      >
                        <Trash2 aria-hidden="true" className="size-3.5" />
                        Delete
                      </button>
                    </ConfirmForm>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-stone-700">{review.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-xl text-stone-900">Published</h2>
          <Badge variant="green">{published.length}</Badge>
        </div>

        {published.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-300 bg-white px-5 py-8 text-center text-sm text-muted-foreground">
            No published reviews yet.
          </p>
        ) : (
          <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            {published.map((review) => (
              <li key={review.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <StarRating rating={review.rating} />
                    <p className="mt-1 text-sm font-semibold text-stone-900">
                      {review.title || "Untitled review"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {review.authorName} on{" "}
                      <Link
                        href={`/products/${review.productSlug}`}
                        className="text-brand-700 hover:underline"
                      >
                        {review.productName}
                      </Link>{" "}
                      · {formatDate(review.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <form action={moderateReviewAction}>
                      <input type="hidden" name="reviewId" value={review.id} />
                      <input type="hidden" name="action" value="hide" />
                      <button
                        type="submit"
                        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-stone-300 px-3 text-xs font-semibold text-stone-600 hover:border-amber-300 hover:text-amber-800"
                      >
                        <EyeOff aria-hidden="true" className="size-3.5" />
                        Hide
                      </button>
                    </form>
                    <ConfirmForm
                      action={moderateReviewAction}
                      message="Delete this review permanently?"
                    >
                      <input type="hidden" name="reviewId" value={review.id} />
                      <input type="hidden" name="action" value="delete" />
                      <button
                        type="submit"
                        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-stone-300 px-3 text-xs font-semibold text-stone-600 hover:border-red-300 hover:text-red-700"
                      >
                        <Trash2 aria-hidden="true" className="size-3.5" />
                        Delete
                      </button>
                    </ConfirmForm>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-stone-700">{review.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
