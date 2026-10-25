"use server";

import { and, desc, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { addresses, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { firstZodMessage, zodFieldErrors } from "@/lib/action-utils";
import { addressSchema, profileSchema } from "@/lib/validations";
import type { ActionState } from "@/types/commerce";

const addressIdSchema = z.object({ addressId: z.string().uuid() });

export async function updateProfileAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in again to update your profile." };

  const parsed = profileSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: firstZodMessage(parsed.error),
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  await db
    .update(users)
    .set({
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName ?? null,
      phone: parsed.data.phone ?? null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  revalidatePath("/account");
  revalidatePath("/checkout");

  return { ok: true, message: "Profile updated." };
}

export async function saveAddressAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in again to save an address." };

  const idValue = formData.get("id");
  const id = typeof idValue === "string" && idValue.length > 0 ? idValue : undefined;

  const parsed = addressSchema.safeParse({
    label: formData.get("label") || "Home",
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    province: formData.get("province"),
    city: formData.get("city"),
    postalCode: formData.get("postalCode"),
    street: formData.get("street"),
    landmark: formData.get("landmark"),
    isDefault: formData.get("isDefault") === "on",
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: firstZodMessage(parsed.error),
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  try {
    await db.transaction(async (tx) => {
      const existing = await tx
        .select({ id: addresses.id })
        .from(addresses)
        .where(eq(addresses.userId, user.id));
      const makeDefault = parsed.data.isDefault || existing.length === 0;

      if (makeDefault) {
        await tx
          .update(addresses)
          .set({ isDefault: false })
          .where(eq(addresses.userId, user.id));
      }

      if (id) {
        const [owned] = await tx
          .select({ id: addresses.id })
          .from(addresses)
          .where(and(eq(addresses.id, id), eq(addresses.userId, user.id)))
          .limit(1);
        if (!owned) throw new Error("Address not found");

        await tx
          .update(addresses)
          .set({
            label: parsed.data.label,
            fullName: parsed.data.fullName,
            phone: parsed.data.phone,
            province: parsed.data.province,
            city: parsed.data.city,
            postalCode: parsed.data.postalCode ?? null,
            street: parsed.data.street,
            landmark: parsed.data.landmark ?? null,
            isDefault: makeDefault,
            updatedAt: new Date(),
          })
          .where(and(eq(addresses.id, id), eq(addresses.userId, user.id)));
      } else {
        await tx.insert(addresses).values({
          userId: user.id,
          label: parsed.data.label,
          fullName: parsed.data.fullName,
          phone: parsed.data.phone,
          province: parsed.data.province,
          city: parsed.data.city,
          postalCode: parsed.data.postalCode ?? null,
          street: parsed.data.street,
          landmark: parsed.data.landmark ?? null,
          isDefault: makeDefault,
        });
      }
    });
  } catch (error) {
    console.error("[account] saveAddress failed", error);
    return { ok: false, message: "We could not save that address. Please try again." };
  }

  revalidatePath("/account");
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");

  return { ok: true, message: id ? "Address updated." : "Address saved." };
}

export async function deleteAddressAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in again." };

  const parsed = addressIdSchema.safeParse({ addressId: formData.get("addressId") });
  if (!parsed.success) return { ok: false, message: "Invalid address." };

  try {
    await db.transaction(async (tx) => {
      const [target] = await tx
        .select({ id: addresses.id, isDefault: addresses.isDefault })
        .from(addresses)
        .where(and(eq(addresses.id, parsed.data.addressId), eq(addresses.userId, user.id)))
        .limit(1);

      if (!target) throw new Error("Address not found");

      await tx
        .delete(addresses)
        .where(and(eq(addresses.id, target.id), eq(addresses.userId, user.id)));

      if (target.isDefault) {
        const [next] = await tx
          .select({ id: addresses.id })
          .from(addresses)
          .where(and(eq(addresses.userId, user.id), ne(addresses.id, target.id)))
          .orderBy(desc(addresses.createdAt))
          .limit(1);
        if (next) {
          await tx
            .update(addresses)
            .set({ isDefault: true })
            .where(eq(addresses.id, next.id));
        }
      }
    });
  } catch (error) {
    console.error("[account] deleteAddress failed", error);
    return { ok: false, message: "We could not remove that address." };
  }

  revalidatePath("/account");
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");

  return { ok: true, message: "Address removed." };
}

export async function setDefaultAddressAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in again." };

  const parsed = addressIdSchema.safeParse({ addressId: formData.get("addressId") });
  if (!parsed.success) return { ok: false, message: "Invalid address." };

  const [owned] = await db
    .select({ id: addresses.id })
    .from(addresses)
    .where(and(eq(addresses.id, parsed.data.addressId), eq(addresses.userId, user.id)))
    .limit(1);

  if (!owned) return { ok: false, message: "Address not found." };

  await db.transaction(async (tx) => {
    await tx
      .update(addresses)
      .set({ isDefault: false })
      .where(eq(addresses.userId, user.id));
    await tx
      .update(addresses)
      .set({ isDefault: true })
      .where(and(eq(addresses.id, owned.id), eq(addresses.userId, user.id)));
  });

  revalidatePath("/account");
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");

  return { ok: true, message: "Default address updated." };
}
