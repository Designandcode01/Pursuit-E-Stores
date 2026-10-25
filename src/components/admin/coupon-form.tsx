"use client";

import { Loader2, Save } from "lucide-react";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { saveCouponAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Checkbox, Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/types/commerce";

const initialState: ActionState = { ok: false };

export type CouponDraft = {
  id: string;
  code: string;
  description: string | null;
  type: "percentage" | "fixed";
  value: number;
  minSubtotal: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
};

function toLocalInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export function CouponForm({ coupon }: { coupon: CouponDraft | null }) {
  const [state, formAction, isPending] = useActionState(saveCouponAction, initialState);

  useEffect(() => {
    if (state.message && !state.ok) toast.error(state.message);
  }, [state]);

  const fieldError = (key: string) => state.fieldErrors?.[key]?.[0];

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
    >
      <input type="hidden" name="couponId" value={coupon?.id ?? ""} />

      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl text-stone-900">
          {coupon ? `Edit ${coupon.code}` : "Create a coupon"}
        </h2>
        {coupon ? (
          <a
            href="/admin/coupons"
            className="text-xs font-semibold text-stone-500 hover:text-stone-900"
          >
            Cancel edit
          </a>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="coupon-code">Code</Label>
          <Input
            id="coupon-code"
            name="code"
            required
            maxLength={40}
            defaultValue={coupon?.code ?? ""}
            placeholder="HUNAR10"
            className="mt-1.5 font-mono uppercase"
          />
          {fieldError("code") ? <p className="field-error">{fieldError("code")}</p> : null}
        </div>

        <div>
          <Label htmlFor="coupon-type">Type</Label>
          <NativeSelect
            id="coupon-type"
            name="type"
            defaultValue={coupon?.type ?? "percentage"}
            className="mt-1.5"
          >
            <option value="percentage">Percentage off</option>
            <option value="fixed">Fixed amount off (PKR)</option>
          </NativeSelect>
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="coupon-description">Description</Label>
          <Textarea
            id="coupon-description"
            name="description"
            rows={2}
            maxLength={240}
            defaultValue={coupon?.description ?? ""}
            placeholder="Shown at checkout when the coupon applies"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="coupon-value">Value</Label>
          <Input
            id="coupon-value"
            name="value"
            type="number"
            min={1}
            step={1}
            required
            defaultValue={coupon?.value ?? ""}
            className="mt-1.5"
          />
          {fieldError("value") ? <p className="field-error">{fieldError("value")}</p> : null}
        </div>

        <div>
          <Label htmlFor="coupon-min">Minimum subtotal (PKR)</Label>
          <Input
            id="coupon-min"
            name="minSubtotal"
            type="number"
            min={0}
            step={1}
            defaultValue={coupon?.minSubtotal ?? 0}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="coupon-max">Max discount (PKR)</Label>
          <Input
            id="coupon-max"
            name="maxDiscount"
            type="number"
            min={0}
            step={1}
            defaultValue={coupon?.maxDiscount ?? ""}
            placeholder="Optional cap"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="coupon-limit">Usage limit</Label>
          <Input
            id="coupon-limit"
            name="usageLimit"
            type="number"
            min={1}
            step={1}
            defaultValue={coupon?.usageLimit ?? ""}
            placeholder="Unlimited"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="coupon-starts">Starts at</Label>
          <Input
            id="coupon-starts"
            name="startsAt"
            type="datetime-local"
            defaultValue={toLocalInput(coupon?.startsAt ?? null)}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="coupon-expires">Expires at</Label>
          <Input
            id="coupon-expires"
            name="expiresAt"
            type="datetime-local"
            defaultValue={toLocalInput(coupon?.expiresAt ?? null)}
            className="mt-1.5"
          />
          {fieldError("expiresAt") ? (
            <p className="field-error">{fieldError("expiresAt")}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="isActive" defaultChecked={coupon ? coupon.isActive : true} />
          <span className="text-stone-700">Active</span>
        </label>

        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? (
            <Loader2 aria-hidden="true" className="animate-spin" />
          ) : (
            <Save aria-hidden="true" />
          )}
          {isPending ? "Saving…" : coupon ? "Save coupon" : "Create coupon"}
        </Button>
      </div>
    </form>
  );
}
