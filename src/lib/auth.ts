import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db";
import { users, type User } from "@/db/schema";

/**
 * Per-request caches. React's `cache` prevents multiple layout/page/action
 * calls from re-verifying the session or re-fetching Clerk's user object.
 */
export const getSession = cache(async () => {
  const session = await auth();
  return {
    userId: session.userId,
    sessionId: session.sessionId,
    sessionClaims: session.sessionClaims,
  };
});

export const getClerkUser = cache(async () => {
  const { userId } = await getSession();
  if (!userId) return null;
  try {
    return await currentUser();
  } catch (error) {
    // A Clerk outage should not take the storefront down for signed-out
    // shoppers. Signed-in users will be asked to retry.
    console.error("[auth] Unable to load Clerk user", error);
    return null;
  }
});

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const { userId } = await getSession();
  if (!userId) return null;

  try {
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (existing) return existing;

    // Webhooks are the primary sync path, but this fallback makes the app
    // resilient when a webhook is delayed (or during local development).
    const clerkUser = await getClerkUser();
    if (!clerkUser) return null;

    const email =
      clerkUser.emailAddresses.find(
        (address) => address.id === clerkUser.primaryEmailAddressId,
      )?.emailAddress ??
      clerkUser.emailAddresses[0]?.emailAddress ??
      `${userId}@clerk.local`;

    const role = clerkUser.publicMetadata?.role === "admin" ? "admin" : "customer";
    const phone = clerkUser.phoneNumbers.find(
      (number) => number.id === clerkUser.primaryPhoneNumberId,
    )?.phoneNumber;

    const [created] = await db
      .insert(users)
      .values({
        clerkId: userId,
        email,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        phone,
        imageUrl: clerkUser.imageUrl,
        role,
      })
      .onConflictDoUpdate({
        target: users.clerkId,
        set: {
          email,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          imageUrl: clerkUser.imageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();

    return created ?? null;
  } catch (error) {
    console.error("[auth] Failed to load or sync the database user", error);
    return null;
  }
});

/**
 * Admin access is granted by Clerk's public metadata:
 *   publicMetadata.role === "admin"
 *
 * Clerk is the source of truth. The database role is a mirror used for reports
 * and joins, so promoting *and demoting* a user in Clerk takes effect on the
 * next request. If Clerk itself is unreachable we fall back to the mirrored
 * role so an outage does not lock admins out of the dashboard.
 */
export const getAdminUser = cache(async (): Promise<User | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const clerkUser = await getClerkUser();

  if (!clerkUser) {
    // Clerk could not be reached. Trust the last synced role.
    return user.role === "admin" ? { ...user, role: "admin" } : null;
  }

  const clerkIsAdmin = clerkUser.publicMetadata?.role === "admin";

  if (!clerkIsAdmin) {
    if (user.role === "admin") {
      try {
        await db
          .update(users)
          .set({ role: "customer", updatedAt: new Date() })
          .where(eq(users.id, user.id));
      } catch (error) {
        console.error("[auth] Failed to revoke admin role", error);
      }
    }
    return null;
  }

  if (user.role !== "admin") {
    try {
      await db
        .update(users)
        .set({ role: "admin", updatedAt: new Date() })
        .where(eq(users.id, user.id));
    } catch (error) {
      console.error("[auth] Failed to sync admin role", error);
    }
  }

  return { ...user, role: "admin" };
});

export function displayName(user: Pick<User, "firstName" | "lastName" | "email"> | null) {
  if (!user) return "Guest";
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || user.email.split("@")[0] || "Guest";
}
