"use client";

import { useActionState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { updateProfileAction } from "@/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/types/commerce";

const initialState: ActionState = { ok: false };

export function ProfileForm({
  firstName,
  lastName,
  phone,
  email,
}: {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, initialState);

  useEffect(() => {
    if (state.ok) toast.success(state.message ?? "Profile updated.");
    else if (state.message) toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction} className="rounded-2xl border border-border bg-white p-5 sm:p-6">
      <h2 className="font-display text-xl text-stone-900">Personal details</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Used for order confirmations and delivery. Your email is managed by your sign-in account.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="firstName">First name</Label>
          <Input
            id="firstName"
            name="firstName"
            required
            maxLength={120}
            autoComplete="given-name"
            defaultValue={firstName}
            className="mt-1.5"
            aria-invalid={Boolean(state.fieldErrors?.firstName)}
          />
          {state.fieldErrors?.firstName ? (
            <p className="field-error">{state.fieldErrors.firstName[0]}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="lastName">Last name</Label>
          <Input
            id="lastName"
            name="lastName"
            maxLength={120}
            autoComplete="family-name"
            defaultValue={lastName}
            className="mt-1.5"
          />
          {state.fieldErrors?.lastName ? (
            <p className="field-error">{state.fieldErrors.lastName[0]}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="phone">Mobile number</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            placeholder="0300 1234567"
            autoComplete="tel"
            defaultValue={phone}
            className="mt-1.5"
            aria-invalid={Boolean(state.fieldErrors?.phone)}
          />
          {state.fieldErrors?.phone ? (
            <p className="field-error">{state.fieldErrors.phone[0]}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
            readOnly
            disabled
            className="mt-1.5 bg-muted"
          />
          <p className="mt-1 text-[10px] text-muted-foreground">
            Change your email from the account menu in the header.
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Save aria-hidden="true" />}
          {isPending ? "Saving…" : "Save changes"}
        </Button>
        {state.ok ? <p className="text-xs font-medium text-brand-800">Saved.</p> : null}
      </div>
    </form>
  );
}
