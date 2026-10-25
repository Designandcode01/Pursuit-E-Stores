import { Pencil, Power, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { deleteCouponAction, toggleCouponAction } from "@/actions/admin";
import { AdminFlash } from "@/components/admin/admin-flash";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { CouponForm } from "@/components/admin/coupon-form";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { getAdminCoupons } from "@/db/queries/admin";
import { formatDate, formatPKR } from "@/lib/format";
import { firstParam } from "@/lib/search-params";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Coupons" };

export default async function AdminCouponsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const editId = firstParam(params.edit);
  const coupons = await getAdminCoupons();
  const editing = editId ? coupons.find((coupon) => coupon.id === editId) ?? null : null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Coupons"
        description="Percentage or fixed discounts, with minimum spend, caps and usage limits."
      />

      <AdminFlash params={params} />

      <CouponForm
        coupon={
          editing
            ? {
                id: editing.id,
                code: editing.code,
                description: editing.description,
                type: editing.type,
                value: editing.value,
                minSubtotal: editing.minSubtotal,
                maxDiscount: editing.maxDiscount,
                usageLimit: editing.usageLimit,
                startsAt: editing.startsAt,
                expiresAt: editing.expiresAt,
                isActive: editing.isActive,
              }
            : null
        }
      />

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 px-5 py-4">
          <h2 className="font-display text-lg text-stone-900">All coupons</h2>
          <p className="text-xs text-muted-foreground">
            {coupons.length} coupon{coupons.length === 1 ? "" : "s"} · used counts update as orders
            are placed.
          </p>
        </div>

        {coupons.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">
            No coupons yet. Create one above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-stone-50 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Code
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Discount
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Conditions
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Usage
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {coupons.map((coupon) => {
                  const expired = coupon.isExpired;
                  const usedUp = coupon.isExhausted;

                  return (
                    <tr key={coupon.id} className="hover:bg-stone-50/60">
                      <td className="px-4 py-3">
                        <p className="font-mono font-semibold text-stone-900">{coupon.code}</p>
                        {coupon.description ? (
                          <p className="max-w-56 truncate text-[11px] text-muted-foreground">
                            {coupon.description}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 font-medium text-stone-800">
                        {coupon.type === "percentage"
                          ? `${coupon.value}% off`
                          : `${formatPKR(coupon.value)} off`}
                        {coupon.maxDiscount ? (
                          <p className="text-[11px] text-muted-foreground">
                            max {formatPKR(coupon.maxDiscount)}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-600">
                        Min {formatPKR(coupon.minSubtotal)}
                        {coupon.expiresAt ? (
                          <p className="text-[11px] text-muted-foreground">
                            until {formatDate(coupon.expiresAt)}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-600">
                        {coupon.usedCount}
                        {coupon.usageLimit ? ` / ${coupon.usageLimit}` : " used"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <Badge variant={coupon.isActive ? "green" : "secondary"}>
                            {coupon.isActive ? "Active" : "Paused"}
                          </Badge>
                          {expired ? <Badge variant="red">Expired</Badge> : null}
                          {usedUp ? <Badge variant="amber">Limit reached</Badge> : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/coupons?edit=${coupon.id}`}
                            className="grid size-8 place-items-center rounded-md text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                            aria-label={`Edit ${coupon.code}`}
                          >
                            <Pencil aria-hidden="true" className="size-3.5" />
                          </Link>

                          <form action={toggleCouponAction}>
                            <input type="hidden" name="couponId" value={coupon.id} />
                            <input
                              type="hidden"
                              name="isActive"
                              value={coupon.isActive ? "false" : "true"}
                            />
                            <button
                              type="submit"
                              className="grid size-8 place-items-center rounded-md text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                              aria-label={coupon.isActive ? "Pause coupon" : "Activate coupon"}
                            >
                              <Power aria-hidden="true" className="size-3.5" />
                            </button>
                          </form>

                          <ConfirmForm
                            action={deleteCouponAction}
                            message={`Delete coupon ${coupon.code}? This cannot be undone.`}
                          >
                            <input type="hidden" name="couponId" value={coupon.id} />
                            <button
                              type="submit"
                              className="grid size-8 place-items-center rounded-md text-stone-500 hover:bg-red-50 hover:text-red-700"
                              aria-label={`Delete ${coupon.code}`}
                            >
                              <Trash2 aria-hidden="true" className="size-3.5" />
                            </button>
                          </ConfirmForm>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
