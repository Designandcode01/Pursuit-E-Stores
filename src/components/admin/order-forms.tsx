"use client";

import { Loader2, Save } from "lucide-react";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import {
  updateOrderNoteAction,
  updateOrderStatusAction,
  updatePaymentStatusAction,
} from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ORDER_STATUSES, ORDER_STATUS_META, PAYMENT_STATUS_META } from "@/lib/constants";
import type { ActionState, OrderStatus, PaymentStatus } from "@/types/commerce";

const initialState: ActionState = { ok: false };

export function OrderStatusForm({
  orderId,
  status,
  trackingNumber,
}: {
  orderId: string;
  status: OrderStatus;
  trackingNumber: string | null;
}) {
  const [state, formAction, isPending] = useActionState(updateOrderStatusAction, initialState);

  useEffect(() => {
    if (state.ok) toast.success(state.message ?? "Order updated.");
    else if (state.message) toast.error(state.message);
  }, [state]);

  // `defaultValue` only applies on mount, so remount the form whenever the
  // persisted order changes and let the controls show what was saved.
  return (
    <form
      key={`${status}|${trackingNumber ?? ""}`}
      action={formAction}
      className="space-y-3"
    >
      <input type="hidden" name="orderId" value={orderId} />

      <div>
        <Label htmlFor="order-status">Order status</Label>
        <NativeSelect
          id="order-status"
          name="status"
          defaultValue={status}
          className="mt-1.5"
        >
          {ORDER_STATUSES.map((option) => (
            <option key={option} value={option}>
              {ORDER_STATUS_META[option].label}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div>
        <Label htmlFor="trackingNumber">Tracking number</Label>
        <Input
          id="trackingNumber"
          name="trackingNumber"
          defaultValue={trackingNumber ?? ""}
          placeholder="TCS / Leopards consignment"
          className="mt-1.5"
          maxLength={100}
        />
      </div>

      <div>
        <Label htmlFor="status-note">Note for the timeline</Label>
        <Input
          id="status-note"
          name="note"
          placeholder="Optional, e.g. handed to courier"
          className="mt-1.5"
          maxLength={300}
        />
      </div>

      <Button type="submit" size="sm" disabled={isPending} className="w-full">
        {isPending ? (
          <Loader2 aria-hidden="true" className="animate-spin" />
        ) : (
          <Save aria-hidden="true" />
        )}
        {isPending ? "Updating…" : "Update status"}
      </Button>
    </form>
  );
}

export function PaymentStatusForm({
  orderId,
  paymentStatus,
  bankReference,
}: {
  orderId: string;
  paymentStatus: PaymentStatus;
  bankReference: string | null;
}) {
  const [state, formAction, isPending] = useActionState(updatePaymentStatusAction, initialState);

  useEffect(() => {
    if (state.ok) toast.success(state.message ?? "Payment updated.");
    else if (state.message) toast.error(state.message);
  }, [state]);

  // Remount after a save so `defaultValue` reflects the persisted payment.
  return (
    <form
      key={`${paymentStatus}|${bankReference ?? ""}`}
      action={formAction}
      className="space-y-3"
    >
      <input type="hidden" name="orderId" value={orderId} />

      <div>
        <Label htmlFor="payment-status">Payment status</Label>
        <NativeSelect
          id="payment-status"
          name="paymentStatus"
          defaultValue={paymentStatus}
          className="mt-1.5"
        >
          {Object.entries(PAYMENT_STATUS_META).map(([value, meta]) => (
            <option key={value} value={value}>
              {meta.label}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div>
        <Label htmlFor="bankReference">Bank reference / TID</Label>
        <Input
          id="bankReference"
          name="bankReference"
          defaultValue={bankReference ?? ""}
          placeholder="For bank transfers"
          className="mt-1.5"
          maxLength={100}
        />
      </div>

      <Button type="submit" size="sm" variant="secondary" disabled={isPending} className="w-full">
        {isPending ? (
          <Loader2 aria-hidden="true" className="animate-spin" />
        ) : (
          <Save aria-hidden="true" />
        )}
        {isPending ? "Saving…" : "Save payment"}
      </Button>
    </form>
  );
}

export function OrderNoteForm({
  orderId,
  adminNote,
}: {
  orderId: string;
  adminNote: string | null;
}) {
  const [state, formAction, isPending] = useActionState(updateOrderNoteAction, initialState);

  useEffect(() => {
    if (state.ok) toast.success(state.message ?? "Note saved.");
    else if (state.message) toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <div>
        <Label htmlFor="adminNote">Internal note</Label>
        <Textarea
          id="adminNote"
          name="adminNote"
          rows={3}
          maxLength={2000}
          defaultValue={adminNote ?? ""}
          placeholder="Visible only to admins"
          className="mt-1.5"
        />
      </div>
      <Button type="submit" size="sm" variant="outline" disabled={isPending} className="w-full">
        {isPending ? (
          <Loader2 aria-hidden="true" className="animate-spin" />
        ) : (
          <Save aria-hidden="true" />
        )}
        {isPending ? "Saving…" : "Save note"}
      </Button>
    </form>
  );
}
