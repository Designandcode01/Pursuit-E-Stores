"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Banknote,
  Building2,
  Check,
  CreditCard,
  Loader2,
  Lock,
  MapPin,
  Smartphone,
  Tag,
  Truck,
  X,
} from "lucide-react";
import { useActionState, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { applyCouponAction, placeOrderAction } from "@/actions/checkout";
import { Button } from "@/components/ui/button";
import { Checkbox, Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BANK_DETAILS,
  FREE_SHIPPING_THRESHOLD,
  PAYMENT_METHODS,
  PROVINCES,
  SHIPPING_METHODS,
  shippingFeeFor,
} from "@/lib/constants";
import { formatPKR } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ActionState, CartLine, CouponResult, PaymentMethod, ShippingMethod } from "@/types/commerce";

export type SavedAddress = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  province: string;
  city: string;
  postalCode: string | null;
  street: string;
  landmark: string | null;
  isDefault: boolean;
};

const initialState: ActionState = { ok: false };

const paymentIcons: Record<PaymentMethod, typeof Banknote> = {
  cod: Banknote,
  bank_transfer: Building2,
  card: CreditCard,
  jazzcash: Smartphone,
  easypaisa: Smartphone,
};

function FieldError({ state, name }: { state: ActionState; name: string }) {
  const message = state.fieldErrors?.[name]?.[0];
  return message ? <p className="field-error">{message}</p> : null;
}

export function CheckoutForm({
  lines,
  addresses,
  defaultName,
  defaultPhone,
}: {
  lines: CartLine[];
  addresses: SavedAddress[];
  defaultName: string;
  defaultPhone: string;
}) {
  const [state, formAction, isPending] = useActionState(placeOrderAction, initialState);
  const [selectedAddressId, setSelectedAddressId] = useState(
    addresses.find((address) => address.isDefault)?.id ?? addresses[0]?.id ?? "new",
  );
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("standard");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<CouponResult | null>(null);
  const [isApplying, startApplying] = useTransition();

  const selectedAddress =
    selectedAddressId === "new"
      ? null
      : (addresses.find((address) => address.id === selectedAddressId) ?? null);

  useEffect(() => {
    if (state.message) toast.error(state.message);
  }, [state]);

  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const shippingFee = shippingFeeFor(shippingMethod, subtotal);
  const discount = coupon?.ok ? (coupon.discount ?? 0) : 0;
  const total = Math.max(subtotal + shippingFee - discount, 0);
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  const applyCoupon = () => {
    const code = couponInput.trim();
    if (!code) {
      toast.error("Enter a coupon code.");
      return;
    }
    startApplying(async () => {
      const result = await applyCouponAction(code);
      setCoupon(result);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponInput("");
  };

  return (
    <form action={formAction} className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-start">
      <input type="hidden" name="couponCode" value={coupon?.ok ? (coupon.code ?? "") : ""} />

      <div className="space-y-6">
        {state.message && !state.ok ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {state.message}
          </div>
        ) : null}

        {/* Contact & address */}
        <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-full bg-brand-800 text-[11px] font-bold text-white">
              1
            </span>
            <h2 className="font-display text-xl text-stone-900">Delivery address</h2>
          </div>

          {addresses.length > 0 ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {addresses.map((address) => {
                const active = selectedAddressId === address.id;
                return (
                  <button
                    key={address.id}
                    type="button"
                    onClick={() => setSelectedAddressId(address.id)}
                    className={cn(
                      "rounded-xl border p-3.5 text-left text-xs transition-colors",
                      active
                        ? "border-brand-700 bg-brand-50 ring-1 ring-brand-700"
                        : "border-border bg-white hover:border-stone-400",
                    )}
                    aria-pressed={active}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-stone-900">{address.label}</span>
                      {active ? (
                        <Check className="size-3.5 text-brand-700" aria-hidden="true" />
                      ) : null}
                    </span>
                    <span className="mt-1 block font-medium text-stone-700">
                      {address.fullName} · {address.phone}
                    </span>
                    <span className="mt-0.5 block leading-relaxed text-muted-foreground">
                      {address.street}, {address.city},{" "}
                      {PROVINCES.find((province) => province.value === address.province)?.label ??
                        address.province}
                    </span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setSelectedAddressId("new")}
                className={cn(
                  "rounded-xl border border-dashed p-3.5 text-left text-xs transition-colors",
                  selectedAddressId === "new"
                    ? "border-brand-700 bg-brand-50 ring-1 ring-brand-700"
                    : "border-border bg-white hover:border-stone-400",
                )}
                aria-pressed={selectedAddressId === "new"}
              >
                <span className="flex items-center gap-2 font-semibold text-stone-900">
                  <MapPin className="size-3.5" aria-hidden="true" /> Use a new address
                </span>
                <span className="mt-1 block text-muted-foreground">
                  Enter a different delivery address.
                </span>
              </button>
            </div>
          ) : null}

          <div key={selectedAddressId} className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                name="fullName"
                required
                autoComplete="name"
                defaultValue={selectedAddress?.fullName ?? defaultName}
                className="mt-1.5"
                aria-invalid={Boolean(state.fieldErrors?.fullName)}
              />
              <FieldError state={state} name="fullName" />
            </div>

            <div>
              <Label htmlFor="phone">Mobile number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                required
                inputMode="tel"
                placeholder="0300 1234567"
                autoComplete="tel"
                defaultValue={selectedAddress?.phone ?? defaultPhone}
                className="mt-1.5"
                aria-invalid={Boolean(state.fieldErrors?.phone)}
              />
              <p className="mt-1 text-[10px] text-muted-foreground">
                Pakistani mobile number, used by the courier.
              </p>
              <FieldError state={state} name="phone" />
            </div>

            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                required
                autoComplete="address-level2"
                defaultValue={selectedAddress?.city ?? ""}
                className="mt-1.5"
                aria-invalid={Boolean(state.fieldErrors?.city)}
              />
              <FieldError state={state} name="city" />
            </div>

            <div>
              <Label htmlFor="province">Province</Label>
              <NativeSelect
                id="province"
                name="province"
                required
                defaultValue={selectedAddress?.province ?? "punjab"}
                className="mt-1.5"
                aria-invalid={Boolean(state.fieldErrors?.province)}
              >
                {PROVINCES.map((province) => (
                  <option key={province.value} value={province.value}>
                    {province.label}
                  </option>
                ))}
              </NativeSelect>
              <FieldError state={state} name="province" />
            </div>

            <div>
              <Label htmlFor="postalCode">Postal code (optional)</Label>
              <Input
                id="postalCode"
                name="postalCode"
                inputMode="numeric"
                pattern="\d{5}"
                maxLength={5}
                placeholder="54000"
                autoComplete="postal-code"
                defaultValue={selectedAddress?.postalCode ?? ""}
                className="mt-1.5"
                aria-invalid={Boolean(state.fieldErrors?.postalCode)}
              />
              <FieldError state={state} name="postalCode" />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="street">Street address</Label>
              <Textarea
                id="street"
                name="street"
                required
                rows={2}
                minLength={8}
                autoComplete="street-address"
                placeholder="House 12, Street 4, Block C, Gulberg III"
                defaultValue={selectedAddress?.street ?? ""}
                className="mt-1.5"
                aria-invalid={Boolean(state.fieldErrors?.street)}
              />
              <FieldError state={state} name="street" />
            </div>

            <div>
              <Label htmlFor="landmark">Nearest landmark (optional)</Label>
              <Input
                id="landmark"
                name="landmark"
                placeholder="Near Liberty Market"
                defaultValue={selectedAddress?.landmark ?? ""}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="label">Save as</Label>
              <Input
                id="label"
                name="label"
                defaultValue={selectedAddress?.label ?? "Home"}
                maxLength={60}
                className="mt-1.5"
              />
            </div>

            <label className="flex items-start gap-2.5 text-xs text-stone-600 sm:col-span-2">
              <Checkbox name="saveAddress" defaultChecked={addresses.length === 0} className="mt-0.5" />
              Save this address to my account for faster checkout next time.
            </label>
          </div>
        </section>

        {/* Shipping */}
        <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-full bg-brand-800 text-[11px] font-bold text-white">
              2
            </span>
            <h2 className="font-display text-xl text-stone-900">Delivery method</h2>
          </div>

          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {(Object.keys(SHIPPING_METHODS) as ShippingMethod[]).map((method) => {
              const option = SHIPPING_METHODS[method];
              const fee = shippingFeeFor(method, subtotal);
              const active = shippingMethod === method;
              return (
                <label
                  key={method}
                  className={cn(
                    "cursor-pointer rounded-xl border p-3.5 transition-colors",
                    active
                      ? "border-brand-700 bg-brand-50 ring-1 ring-brand-700"
                      : "border-border bg-white hover:border-stone-400",
                  )}
                >
                  <input
                    type="radio"
                    name="shippingMethod"
                    value={method}
                    checked={active}
                    onChange={() => setShippingMethod(method)}
                    className="sr-only"
                  />
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-stone-900">{option.label}</span>
                    <span className="text-xs font-semibold text-brand-800">
                      {fee === 0 ? "Free" : formatPKR(fee)}
                    </span>
                  </span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    {option.eta}
                  </span>
                  <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">
                    {option.description}
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        {/* Payment */}
        <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-full bg-brand-800 text-[11px] font-bold text-white">
              3
            </span>
            <h2 className="font-display text-xl text-stone-900">Payment method</h2>
          </div>

          <div className="mt-4 space-y-2">
            {(Object.keys(PAYMENT_METHODS) as PaymentMethod[]).map((method) => {
              const option = PAYMENT_METHODS[method];
              const Icon = paymentIcons[method];
              const active = paymentMethod === method;
              return (
                <label
                  key={method}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors",
                    !option.available && "cursor-not-allowed opacity-60",
                    active && option.available
                      ? "border-brand-700 bg-brand-50 ring-1 ring-brand-700"
                      : "border-border bg-white hover:border-stone-400",
                  )}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method}
                    checked={active}
                    onChange={() => setPaymentMethod(method)}
                    disabled={!option.available}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      "mt-0.5 grid size-8 shrink-0 place-items-center rounded-full",
                      active && option.available
                        ? "bg-brand-700 text-white"
                        : "bg-muted text-stone-600",
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-stone-900">{option.label}</span>
                      {!option.available ? (
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-stone-500">
                          Coming soon
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
                      {option.description}
                    </span>
                  </span>
                  {active && option.available ? (
                    <Check className="mt-1.5 size-4 shrink-0 text-brand-700" aria-hidden="true" />
                  ) : null}
                </label>
              );
            })}
          </div>

          {paymentMethod === "cod" ? (
            <p className="mt-3 rounded-xl bg-brand-50 px-3.5 py-2.5 text-[11px] leading-relaxed text-brand-900">
              Keep the exact amount ready. Our courier will collect {formatPKR(total)} on delivery.
            </p>
          ) : null}

          {paymentMethod === "bank_transfer" ? (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-[11px] leading-relaxed text-amber-900">
              <p className="font-semibold">Transfer to our account and share the reference</p>
              <dl className="mt-2 grid gap-1 sm:grid-cols-2">
                <div>
                  <dt className="text-amber-700">Bank</dt>
                  <dd className="font-medium">{BANK_DETAILS.bankName}</dd>
                </div>
                <div>
                  <dt className="text-amber-700">Account title</dt>
                  <dd className="font-medium">{BANK_DETAILS.accountTitle}</dd>
                </div>
                <div>
                  <dt className="text-amber-700">Account number</dt>
                  <dd className="font-medium">{BANK_DETAILS.accountNumber}</dd>
                </div>
                <div>
                  <dt className="text-amber-700">IBAN</dt>
                  <dd className="font-medium">{BANK_DETAILS.iban}</dd>
                </div>
              </dl>
              <p className="mt-2">
                Your order will be marked “awaiting verification” until we confirm the transfer,
                usually within one working day.
              </p>
            </div>
          ) : null}
        </section>

        {/* Notes */}
        <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
          <h2 className="font-display text-xl text-stone-900">Order notes</h2>
          <Label htmlFor="notes" className="mt-3">
            Delivery instructions (optional)
          </Label>
          <Textarea
            id="notes"
            name="notes"
            rows={3}
            maxLength={1000}
            placeholder="Call before delivery, leave with the guard, gift wrap…"
            className="mt-1.5"
          />
          <FieldError state={state} name="notes" />
        </section>
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-28">
        <div className="rounded-2xl border border-border bg-white p-5 sm:p-6">
          <h2 className="font-display text-xl text-stone-900">
            Order summary
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({itemCount} {itemCount === 1 ? "item" : "items"})
            </span>
          </h2>

          <ul className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
            {lines.map((line) => (
              <li key={line.variantId} className="flex gap-3">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-[#f1eadc]">
                  {line.imageUrl ? (
                    <Image src={line.imageUrl} alt="" fill sizes="56px" className="object-cover" />
                  ) : null}
                  <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-stone-800 text-[9px] font-bold text-white">
                    {line.quantity}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-xs font-medium text-stone-900">
                    {line.productName}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{line.variantLabel}</p>
                </div>
                <p className="text-xs font-semibold text-stone-900">
                  {formatPKR(line.unitPrice * line.quantity)}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-5 border-t border-border pt-4">
            <Label htmlFor="coupon" className="text-xs">
              Coupon code
            </Label>
            {coupon?.ok ? (
              <div className="mt-1.5 flex items-center justify-between rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs">
                <span className="inline-flex items-center gap-1.5 font-semibold text-brand-900">
                  <Tag className="size-3.5" aria-hidden="true" />
                  {coupon.code}
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="font-semibold text-brand-800">−{formatPKR(discount)}</span>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-stone-500 hover:text-stone-900"
                    aria-label="Remove coupon"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                </span>
              </div>
            ) : (
              <div className="mt-1.5 flex gap-2">
                <Input
                  id="coupon"
                  value={couponInput}
                  onChange={(event) => setCouponInput(event.target.value.toUpperCase())}
                  placeholder="HUNAR10"
                  maxLength={40}
                  className="h-10 text-xs uppercase"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={applyCoupon}
                  disabled={isApplying}
                  className="h-10 shrink-0"
                >
                  {isApplying ? <Loader2 className="animate-spin" aria-hidden="true" /> : "Apply"}
                </Button>
              </div>
            )}
            {coupon && !coupon.ok ? (
              <p className="field-error">{coupon.message}</p>
            ) : null}
            {coupon?.ok ? (
              <p className="mt-1 text-[10px] text-brand-800">{coupon.message}</p>
            ) : null}
            <FieldError state={state} name="couponCode" />
          </div>

          <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium text-stone-900">{formatPKR(subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="font-medium text-stone-900">
                {shippingFee === 0 ? "Free" : formatPKR(shippingFee)}
              </dd>
            </div>
            {discount > 0 ? (
              <div className="flex items-center justify-between text-brand-800">
                <dt>Discount</dt>
                <dd className="font-medium">−{formatPKR(discount)}</dd>
              </div>
            ) : null}
            <div className="flex items-center justify-between border-t border-border pt-3 text-base">
              <dt className="font-semibold text-stone-900">Total</dt>
              <dd className="font-semibold text-stone-900">{formatPKR(total)}</dd>
            </div>
          </dl>

          {subtotal < FREE_SHIPPING_THRESHOLD && shippingMethod === "standard" ? (
            <p className="mt-2 flex items-start gap-1.5 text-[10px] text-muted-foreground">
              <Truck className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
              Add {formatPKR(FREE_SHIPPING_THRESHOLD - subtotal)} more for free standard delivery.
            </p>
          ) : null}

          <label className="mt-5 flex items-start gap-2.5 text-[11px] leading-relaxed text-stone-600">
            <Checkbox name="terms" required className="mt-0.5" />
            <span>
              I agree to the{" "}
              <Link href="/pages/terms" className="text-brand-800 underline underline-offset-2">
                terms of service
              </Link>{" "}
              and{" "}
              <Link href="/pages/returns" className="text-brand-800 underline underline-offset-2">
                returns policy
              </Link>
              .
            </span>
          </label>
          <FieldError state={state} name="terms" />

          <Button type="submit" size="lg" className="mt-4 w-full" disabled={isPending}>
            {isPending ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <Lock aria-hidden="true" />
            )}
            {isPending ? "Placing order…" : `Place order · ${formatPKR(total)}`}
          </Button>
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            You will receive an order number immediately. No card details are stored.
          </p>
        </div>
      </aside>
    </form>
  );
}
