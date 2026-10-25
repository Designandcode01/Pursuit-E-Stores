import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Lock, ShieldCheck, ShoppingBag } from "lucide-react";

import { CheckoutForm, type SavedAddress } from "@/components/checkout/checkout-form";
import { EmptyState } from "@/components/shop/empty-state";
import { Button } from "@/components/ui/button";
import { getAddresses } from "@/db/queries/account";
import { getCartLines } from "@/db/queries/cart";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your Hunar Bazaar order with cash on delivery or bank transfer.",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?redirect_url=%2Fcheckout");

  const [lines, addresses] = await Promise.all([
    getCartLines(user.id),
    getAddresses(user.id),
  ]);

  const savedAddresses: SavedAddress[] = addresses.map((address) => ({
    id: address.id,
    label: address.label,
    fullName: address.fullName,
    phone: address.phone,
    province: address.province,
    city: address.city,
    postalCode: address.postalCode,
    street: address.street,
    landmark: address.landmark,
    isDefault: address.isDefault,
  }));

  if (lines.length === 0) {
    return (
      <div className="container-page py-10 sm:py-14">
        <p className="eyebrow">Checkout</p>
        <h1 className="mt-2 font-display text-4xl text-stone-900">Your bag is empty</h1>
        <div className="mt-8">
          <EmptyState
            icon={<ShoppingBag className="size-6" aria-hidden="true" />}
            title="Add something before checking out"
            description="Your cart is empty, so there is nothing to pay for yet."
            action={
              <Button asChild>
                <Link href="/products">Shop all products</Link>
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/cart"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-stone-900"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" /> Back to bag
          </Link>
          <h1 className="mt-2 font-display text-3xl text-stone-900 sm:text-4xl">Checkout</h1>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Lock className="size-3.5 text-brand-700" aria-hidden="true" /> Secure
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-brand-700" aria-hidden="true" /> COD available
          </span>
        </div>
      </div>

      <div className="mt-7">
        <CheckoutForm
          lines={lines}
          addresses={savedAddresses}
          defaultName={fullName}
          defaultPhone={user.phone ?? ""}
        />
      </div>

      <p className="mx-auto mt-8 max-w-2xl text-center text-[11px] leading-relaxed text-muted-foreground">
        Need help with your order? Message us on WhatsApp at{" "}
        <Link href="/pages/contact" className="text-brand-800 underline underline-offset-2">
          our support line
        </Link>
        . We never ask for card PINs or one-time passwords.
      </p>
    </div>
  );
}
