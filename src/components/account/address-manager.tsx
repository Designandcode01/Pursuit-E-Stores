"use client";

import { useActionState, useEffect, useState } from "react";
import { Check, Loader2, MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  deleteAddressAction,
  saveAddressAction,
  setDefaultAddressAction,
} from "@/actions/account";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox, Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PROVINCES, PROVINCE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ActionState, AddressView } from "@/types/commerce";

const initialState: ActionState = { ok: false };

function AddressForm({
  address,
  onDone,
}: {
  address?: AddressView;
  onDone: () => void;
}) {
  const [state, formAction, isPending] = useActionState(saveAddressAction, initialState);

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Address saved.");
      onDone();
    } else if (state.message) {
      toast.error(state.message);
    }
  }, [state, onDone]);

  return (
    <form action={formAction} className="space-y-4">
      {address ? <input type="hidden" name="id" value={address.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="address-label">Label</Label>
          <Input
            id="address-label"
            name="label"
            defaultValue={address?.label ?? "Home"}
            maxLength={60}
            placeholder="Home, Office…"
            className="mt-1.5"
          />
          {state.fieldErrors?.label ? (
            <p className="field-error">{state.fieldErrors.label[0]}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="address-fullName">Full name</Label>
          <Input
            id="address-fullName"
            name="fullName"
            required
            defaultValue={address?.fullName ?? ""}
            autoComplete="name"
            className="mt-1.5"
          />
          {state.fieldErrors?.fullName ? (
            <p className="field-error">{state.fieldErrors.fullName[0]}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="address-phone">Mobile number</Label>
          <Input
            id="address-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            required
            placeholder="0300 1234567"
            defaultValue={address?.phone ?? ""}
            autoComplete="tel"
            className="mt-1.5"
          />
          {state.fieldErrors?.phone ? (
            <p className="field-error">{state.fieldErrors.phone[0]}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="address-city">City</Label>
          <Input
            id="address-city"
            name="city"
            required
            defaultValue={address?.city ?? ""}
            autoComplete="address-level2"
            className="mt-1.5"
          />
          {state.fieldErrors?.city ? (
            <p className="field-error">{state.fieldErrors.city[0]}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="address-province">Province</Label>
          <NativeSelect
            id="address-province"
            name="province"
            required
            defaultValue={address?.province ?? "punjab"}
            className="mt-1.5"
          >
            {PROVINCES.map((province) => (
              <option key={province.value} value={province.value}>
                {province.label}
              </option>
            ))}
          </NativeSelect>
          {state.fieldErrors?.province ? (
            <p className="field-error">{state.fieldErrors.province[0]}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="address-postalCode">Postal code (optional)</Label>
          <Input
            id="address-postalCode"
            name="postalCode"
            inputMode="numeric"
            pattern="\d{5}"
            maxLength={5}
            defaultValue={address?.postalCode ?? ""}
            autoComplete="postal-code"
            className="mt-1.5"
          />
          {state.fieldErrors?.postalCode ? (
            <p className="field-error">{state.fieldErrors.postalCode[0]}</p>
          ) : null}
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="address-street">Street address</Label>
          <Textarea
            id="address-street"
            name="street"
            required
            rows={2}
            minLength={8}
            defaultValue={address?.street ?? ""}
            autoComplete="street-address"
            placeholder="House 12, Street 4, Block C, Gulberg III"
            className="mt-1.5"
          />
          {state.fieldErrors?.street ? (
            <p className="field-error">{state.fieldErrors.street[0]}</p>
          ) : null}
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="address-landmark">Nearest landmark (optional)</Label>
          <Input
            id="address-landmark"
            name="landmark"
            defaultValue={address?.landmark ?? ""}
            placeholder="Near Liberty Market"
            className="mt-1.5"
          />
        </div>
      </div>

      <label className="flex items-start gap-2.5 text-xs text-stone-600">
        <Checkbox name="isDefault" defaultChecked={address?.isDefault} className="mt-0.5" />
        Use this as my default delivery address
      </label>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          {isPending ? "Saving…" : address ? "Save address" : "Add address"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function DeleteAddressForm({ addressId }: { addressId: string }) {
  const [state, formAction, isPending] = useActionState(deleteAddressAction, initialState);

  useEffect(() => {
    if (state.ok) toast.success(state.message ?? "Address removed.");
    else if (state.message) toast.error(state.message);
  }, [state]);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm("Remove this address? This cannot be undone.")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="addressId" value={addressId} />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        disabled={isPending}
        className="text-stone-500 hover:bg-red-50 hover:text-destructive"
      >
        {isPending ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : (
          <Trash2 aria-hidden="true" />
        )}
        Remove
      </Button>
    </form>
  );
}

function SetDefaultForm({ addressId }: { addressId: string }) {
  const [state, formAction, isPending] = useActionState(setDefaultAddressAction, initialState);

  useEffect(() => {
    if (state.ok) toast.success(state.message ?? "Default address updated.");
    else if (state.message) toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name="addressId" value={addressId} />
      <Button type="submit" variant="ghost" size="sm" disabled={isPending}>
        {isPending ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : (
          <Star aria-hidden="true" />
        )}
        Set default
      </Button>
    </form>
  );
}

export function AddressManager({ addresses }: { addresses: AddressView[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AddressView | undefined>(undefined);

  const startNew = () => {
    setEditing(undefined);
    setOpen(true);
  };

  const startEdit = (address: AddressView) => {
    setEditing(address);
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">My account</p>
          <h1 className="mt-2 font-display text-3xl text-stone-900 sm:text-4xl">
            Saved addresses
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Add the addresses you use most. The default is pre-selected at checkout.
          </p>
        </div>
        <Button type="button" onClick={startNew}>
          <Plus aria-hidden="true" /> Add address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white/60 px-6 py-12 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-brand-50 text-brand-700">
            <MapPin className="size-5" aria-hidden="true" />
          </span>
          <p className="mt-4 font-display text-xl text-stone-900">No saved addresses</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Save an address now, or add one during checkout and we will keep it for next time.
          </p>
          <Button type="button" className="mt-4" onClick={startNew}>
            Add your first address
          </Button>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <li
              key={address.id}
              className={cn(
                "flex flex-col rounded-2xl border bg-white p-5",
                address.isDefault ? "border-brand-600 ring-1 ring-brand-600" : "border-border",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-stone-900">
                    {address.label}
                    {address.isDefault ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-brand-800">
                        <Check className="size-2.5" aria-hidden="true" /> Default
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-xs font-medium text-stone-700">{address.fullName}</p>
                </div>
                <MapPin className="size-4 shrink-0 text-brand-700" aria-hidden="true" />
              </div>

              <p className="mt-3 text-xs leading-relaxed text-stone-600">
                {address.street}
                {address.landmark ? `, ${address.landmark}` : ""}
                <br />
                {address.city}, {PROVINCE_LABELS[address.province]}
                {address.postalCode ? ` ${address.postalCode}` : ""}
                <br />
                {address.phone}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-border pt-3">
                <Button type="button" variant="ghost" size="sm" onClick={() => startEdit(address)}>
                  <Pencil aria-hidden="true" /> Edit
                </Button>
                {!address.isDefault ? <SetDefaultForm addressId={address.id} /> : null}
                <div className="ml-auto">
                  <DeleteAddressForm addressId={address.id} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit address" : "Add a new address"}</DialogTitle>
            <DialogDescription>
              We use this only for delivery. You can change it at any time.
            </DialogDescription>
          </DialogHeader>
          <AddressForm
            key={`${editing?.id ?? "new"}-${open}`}
            address={editing}
            onDone={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
