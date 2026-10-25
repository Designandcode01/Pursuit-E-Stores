import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/shop/pagination";
import { getAdminCustomers } from "@/db/queries/admin";
import { formatDate, formatNumber, formatPKR } from "@/lib/format";
import { firstParam } from "@/lib/search-params";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Customers" };

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = firstParam(params.q)?.trim() ?? "";
  const page = Math.max(Number(firstParam(params.page) ?? 1) || 1, 1);
  const result = await getAdminCustomers({ q, page });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Customers"
        description="Everyone who has created an account. Guest orders appear under Orders only."
      />

      <form
        method="get"
        className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label htmlFor="customer-search" className="text-xs font-semibold text-stone-700">
            Search customers
          </label>
          <div className="relative mt-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="customer-search"
              name="q"
              defaultValue={q}
              placeholder="Name, email or phone"
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm">
            Search
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/customers">Reset</Link>
          </Button>
        </div>
      </form>

      <p className="text-xs text-muted-foreground">
        {formatNumber(result.total)} customer{result.total === 1 ? "" : "s"}
        {q ? ` matching “${q}”` : ""}.
      </p>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        {result.items.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-muted-foreground">
            No customers found. Customers are created automatically when someone signs in.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-stone-50 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Customer
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Phone
                  </th>
                  <th scope="col" className="px-4 py-3 text-center font-semibold">
                    Orders
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Lifetime value
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Last order
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {result.items.map((customer) => {
                  const name =
                    [customer.firstName, customer.lastName].filter(Boolean).join(" ") ||
                    customer.email.split("@")[0];

                  return (
                    <tr key={customer.id} className="hover:bg-stone-50/60">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/customers/${customer.id}`}
                          className="font-semibold text-stone-900 hover:text-brand-700"
                        >
                          {name}
                        </Link>
                        <p className="text-[11px] text-muted-foreground">{customer.email}</p>
                      </td>
                      <td className="px-4 py-3 text-stone-600">{customer.phone ?? "—"}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={customer.orderCount === 0 ? "secondary" : "green"}>
                          {customer.orderCount}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-stone-900">
                        {formatPKR(customer.totalSpent)}
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-600">
                        {customer.lastOrderAt ? formatDate(customer.lastOrderAt) : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-600">
                        {formatDate(customer.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination
        basePath="/admin/customers"
        params={{ q }}
        page={result.page}
        totalPages={result.totalPages}
      />
    </div>
  );
}
