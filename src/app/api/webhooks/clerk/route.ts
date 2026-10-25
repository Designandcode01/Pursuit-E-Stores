import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";

import { db } from "@/db";
import { users } from "@/db/schema";

export const runtime = "nodejs";

/**
 * Clerk → database user sync.
 *
 * Configure in Clerk Dashboard → Webhooks:
 *   Endpoint:  https://your-domain.com/api/webhooks/clerk
 *   Events:    user.created, user.updated, user.deleted
 *   Secret:    copy into CLERK_WEBHOOK_SIGNING_SECRET
 *
 * `verifyWebhook` validates the Svix signature and throws on bad payloads,
 * so this route cannot be used to spoof users.
 */
export async function POST(request: NextRequest) {
  let event;

  try {
    event = await verifyWebhook(request);
  } catch (error) {
    console.error("[clerk-webhook] Signature verification failed", error);
    return new Response("Invalid webhook signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "user.created":
      case "user.updated": {
        const data = event.data;
        const email =
          data.email_addresses.find(
            (address) => address.id === data.primary_email_address_id,
          )?.email_address ??
          data.email_addresses[0]?.email_address;

        if (!email) {
          console.warn(`[clerk-webhook] ${event.type} without an email`, data.id);
          return new Response("Missing email", { status: 200 });
        }

        const phone =
          data.phone_numbers.find(
            (number) => number.id === data.primary_phone_number_id,
          )?.phone_number ?? null;

        const role = data.public_metadata?.role === "admin" ? "admin" : "customer";

        await db
          .insert(users)
          .values({
            clerkId: data.id,
            email,
            firstName: data.first_name,
            lastName: data.last_name,
            phone,
            imageUrl: data.image_url,
            role,
          })
          .onConflictDoUpdate({
            target: users.clerkId,
            set: {
              email,
              firstName: data.first_name,
              lastName: data.last_name,
              phone,
              imageUrl: data.image_url,
              role,
              updatedAt: new Date(),
            },
          });

        break;
      }

      case "user.deleted": {
        if (event.data.id) {
          // Orders keep their address snapshots, so deleting the user row is
          // safe: order.user_id is set to NULL by the FK rule.
          await db.delete(users).where(eq(users.clerkId, event.data.id));
        }
        break;
      }

      default:
        break;
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("[clerk-webhook] Failed to process event", event.type, error);
    // Returning 5xx makes Clerk retry with exponential backoff.
    return new Response("Webhook handler error", { status: 500 });
  }
}
