# Hunar Bazaar

A production-ready, Pakistan-focused e-commerce storefront built with **Next.js 16 (App Router)**, **TypeScript**, **Drizzle ORM + Neon Postgres**, **Clerk**, and **Tailwind CSS v4**.

Hunar Bazaar sells unstitched lawn, pret, kurtas, shawls, khussa, prayer rugs and handmade craft. Prices are stored as whole PKR, cash on delivery is the default payment method, and the checkout flow is built around Pakistani addresses and couriers.

---

## Contents

- [What's included](#whats-included)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Database](#database)
- [Authentication and roles](#authentication-and-roles)
- [Cloudinary uploads](#cloudinary-uploads)
- [Payments](#payments)
- [Routes](#routes)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Caching and rendering](#caching-and-rendering)
- [Design, responsive and accessibility](#design-responsive-and-accessibility)
- [Deployment](#deployment)
- [Known limitations](#known-limitations)

---

## What's included

**Storefront**

- Editorial home page with hero, collections, featured products, testimonials and trust badges.
- Product listing with category, price, size and colour filters plus sorting and pagination.
- Product detail pages with image gallery, variant picker, live stock, reviews, related products and JSON-LD.
- Instant search dialog backed by `/api/search`, plus a full `/search` results page.
- Cart with variant-level stock limits; guest carts in `localStorage`, merged into the database on sign-in.
- Wishlist that works for guests and signed-in shoppers, with the same merge behaviour.
- Checkout with saved addresses, province dropdown, PK phone validation (`+92`), COD, bank transfer, coupons, and Rs. 250 standard / Rs. 500 express shipping (free standard delivery over Rs. 5,000).
- Order confirmation and order tracking pages, account profile, order history and address book.
- Policy pages: about, contact, FAQ, shipping, returns, privacy and terms.
- Sitemap, robots, Open Graph metadata, JSON-LD, `next/image` everywhere.

**Admin dashboard** (`/admin`, admin-only)

- Revenue, orders, customers and low-stock KPIs with a 14-day sales trend.
- Product CRUD with variants, inventory, image upload (Cloudinary) or image URL, featured flags and publishing.
- Category CRUD, coupon CRUD with usage/expiry state, review moderation.
- Order detail with status flow (pending → confirmed → shipped → delivered / cancelled), tracking number, payment verification and a print-ready invoice.
- Customer list and per-customer order history.

**Platform**

- 15-table Drizzle schema and a checked-in SQL migration.
- Idempotent seed script: 20 products, 151 variants, 40 generated images, 6 categories, 12 reviews, 3 coupons and 6 demo orders.
- Clerk webhook for user sync, role-based admin gate, protected-route proxy.
- Server Actions for every mutation, Zod validation on both sides, rate limiting on search and reviews.
- Loading, error and not-found boundaries across storefront and admin.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16.4 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS v4, Radix primitives, hand-rolled shadcn-style components |
| Language | TypeScript (strict) |
| Database | Neon Postgres via `pg` + `drizzle-orm/node-postgres` |
| Migrations | Drizzle Kit |
| Auth | Clerk v7 (email, Google, phone OTP) |
| Validation | Zod 4 |
| Icons / toasts | Lucide, Sonner |
| Images | `next/image` + Sharp (seed art generation) |
| Hosting | Vercel (recommended) |

---

## Quick start

**Prerequisites:** Node.js ≥ 20.9, npm, a [Neon](https://neon.tech) database and a [Clerk](https://dashboard.clerk.com) application.

```bash
# 1. Install dependencies
npm install

# 2. Configure the environment
cp .env.example .env.local     # Windows: copy .env.example .env.local
#    …then fill in DATABASE_URL, Clerk keys and (optionally) the rest.

# 3. Create the schema
npm run db:migrate

# 4. Load the demo catalog
npm run db:seed

# 5. Start the dev server
npm run dev
```

Open <http://localhost:3000>. The storefront works signed out; `/admin`, `/account`, `/checkout` and `/orders` redirect to `/sign-in`.

> `npm run db:seed` **deletes and re-creates** the catalog, orders, coupons, review authors and demo customers. It is safe to re-run during development, but never point it at production data you care about.

---

## Environment variables

Copy `.env.example` to `.env.local`. Only the first block is required for the storefront to boot.

### Required

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | Neon **pooled** connection string (host ends in `-pooler`). Keep `sslmode=verify-full`; `require` is treated as an alias and logs a security warning. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (`pk_test_…` / `pk_live_…`). |
| `CLERK_SECRET_KEY` | Clerk secret key. Never expose this to the client. |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Svix signing secret (`whsec_…`) for `/api/webhooks/clerk`. Optional in local dev because the app falls back to syncing users on first request. |

### Store configuration

| Variable | Default | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Used for canonical URLs, Open Graph and the sitemap. Set to the production domain. |
| `NEXT_PUBLIC_STORE_NAME` | `Hunar Bazaar` | Brand name in metadata. |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `923001234567` | Digits only, country code first. Powers the floating WhatsApp button and contact page. |
| `NEXT_PUBLIC_STORE_EMAIL` | `hello@hunarbazaar.pk` | Shown on policy and contact pages. |
| `NEXT_PUBLIC_STORE_PHONE` | `+92 300 1234567` | Display phone number. |
| `NEXT_PUBLIC_BANK_NAME` | `Meezan Bank` | Bank transfer instructions. |
| `NEXT_PUBLIC_BANK_ACCOUNT_TITLE` | `Hunar Bazaar (Pvt) Ltd` | Bank transfer instructions. |
| `NEXT_PUBLIC_BANK_ACCOUNT_NUMBER` | `01234567890123` | Bank transfer instructions. |
| `NEXT_PUBLIC_BANK_IBAN` | `PK00MEZN0000000123456789` | Bank transfer instructions. |

### Cloudinary (optional)

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloud name from the Cloudinary dashboard. |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | **Unsigned** upload preset. |

Leave both empty to hide the upload widget; admins can still paste an image URL. See [Cloudinary uploads](#cloudinary-uploads).

### Online payments (disabled by default)

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_ENABLE_ONLINE_PAYMENTS` | `"true"` makes card/JazzCash/Easypaisa selectable. Leave `"false"` until the gateway flow is implemented. |
| `SAFEPAY_API_KEY`, `SAFEPAY_SECRET_KEY` | Reserved for the Safepay integration. |
| `JAZZCASH_MERCHANT_ID`, `JAZZCASH_PASSWORD`, `JAZZCASH_INTEGRITY_SALT` | Reserved for JazzCash. |
| `EASYPAISA_STORE_ID`, `EASYPAISA_HASH_KEY` | Reserved for Easypaisa. |

### Rate limiting (optional)

| Variable | Notes |
| --- | --- |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Reserved for a distributed limiter. The shipped limiter is in-memory; see [Known limitations](#known-limitations). |

---

## Database

The schema lives in `src/db/schema.ts`; the initial migration is checked in at `drizzle/0000_sloppy_star_brand.sql`.

**Tables**

`users`, `addresses`, `categories`, `products`, `product_variants`, `product_images`, `inventory`, `cart_items`, `wishlist_items`, `reviews`, `coupons`, `orders`, `order_items`, `order_status_history`, `coupon_redemptions`.

**Notable conventions**

- Prices are **whole PKR integers** (`integer`), not decimals. `formatPKR()` in `src/lib/format.ts` renders them with `Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR" })` and swaps the locale symbol for `₨`.
- Stock is kept in `inventory` per variant. Checkout runs in a transaction and uses a conditional `UPDATE … WHERE quantity >= n`, so two shoppers cannot buy the same last item.
- Order numbers look like `HB-20260921-7F3K`; demo orders use `HB-YYYYMMDD-100x`.
- Orders snapshot the product name, variant label, SKU, image and unit price in `order_items`, so history survives catalog edits.
- Dates are stored as `timestamptz` and displayed in `Asia/Karachi`.

**Commands**

```bash
npm run db:generate   # generate SQL from schema changes
npm run db:migrate    # apply pending migrations
npm run db:push       # push schema directly (prototyping only)
npm run db:studio     # open Drizzle Studio
npm run db:seed       # wipe + reseed catalog/orders/demo customers
```

If you change `src/db/schema.ts`, run `npm run db:generate` and commit the new SQL file alongside the code.

### What the seed creates

| Data | Count |
| --- | --- |
| Categories | 6 |
| Products | 20 |
| Variants | 151 |
| Product images | 40 (2 per product, in `public/products/`) |
| Reviews | 12 |
| Coupons | 3 (`HUNAR10`, `EID500`, `LAWN15`) |
| Demo orders | 6, across all statuses |

Demo customers (`ayesha.khan@example.com`, etc.) exist so the admin dashboard has realistic data. They have no Clerk account and cannot sign in.

Product imagery is generated locally as SVG art and converted to WebP with Sharp:

```bash
npm run images:generate
```

The script reads `scripts/catalog.json` and writes `public/products/*.webp`, `public/categories/*.webp`, `public/hero.jpg` and `public/og.jpg`. Replace these with real photography before launch — the file names are already referenced by the seed.

---

## Authentication and roles

Clerk handles sign-in, sign-up, email verification, Google OAuth and phone OTP.

1. Create a Clerk application and copy the publishable/secret keys into `.env.local`.
2. In **User & Authentication → Email, Phone, Social**, enable Email address, Phone number and Google.
3. The app uses Clerk's `<SignIn />` / `<SignUp />` components at `/sign-in` and `/sign-up`, with `fallbackRedirectUrl="/"`.

### Protected routes

`src/proxy.ts` (it **must** stay in `src/`, beside `src/app`) runs `clerkMiddleware` and redirects signed-out visitors to `/sign-in?redirect_url=…` for:

- `/admin` and everything under it
- `/account` and everything under it
- `/checkout`
- `/orders` and everything under it

### Making a user an admin

Admin access is granted by Clerk public metadata, not by a database flag:

1. Sign in once so the user exists.
2. In the Clerk dashboard open **Users → [user] → Metadata → Public** and set:

   ```json
   { "role": "admin" }
   ```

3. Save, then reload `/admin`.

`getAdminUser()` in `src/lib/auth.ts` checks `publicMetadata.role === "admin"` on every admin request and mirrors the role into `users.role` so reports and joins stay consistent. Removing the metadata revokes access on the next request.

### Clerk webhook

`POST /api/webhooks/clerk` keeps the `users` table in sync.

1. Expose your local server (e.g. `ngrok http 3000`) or use the production URL.
2. In **Clerk → Webhooks → Add endpoint**, use `https://<host>/api/webhooks/clerk`.
3. Subscribe to `user.created`, `user.updated`, `user.deleted`.
4. Copy the signing secret into `CLERK_WEBHOOK_SIGNING_SECRET`.

The route calls `verifyWebhook()` from `@clerk/nextjs/webhooks`, so unsigned or spoofed requests are rejected. If the webhook is delayed, `getCurrentUser()` lazily creates the row on the next request — the app does not depend on the webhook being instant.

---

## Cloudinary uploads

Product images can be uploaded from the admin product form using an **unsigned** upload preset:

1. In Cloudinary: **Settings → Upload → Add upload preset**, set *Signing mode* to **Unsigned**, and note the preset name.
2. Set `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` and `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` in `.env.local`.
3. Restart the dev server.

Uploads go straight from the browser to Cloudinary; only the resulting URL is saved in `product_images`. `next.config.ts` already allow-lists `res.cloudinary.com` (plus Unsplash and placehold.co for demos, and `img.clerk.com` / `images.clerk.dev` for Clerk profile photos).

Without Cloudinary credentials the upload control is hidden, but admins can paste any HTTPS image URL. Add new hosts to `images.remotePatterns` in `next.config.ts` if you use another CDN.

---

## Payments

| Method | Status |
| --- | --- |
| Cash on delivery (COD) | **Live.** Order is created with `paymentStatus = "unpaid"`; the courier collects cash. |
| Bank transfer | **Live.** Order is created with `paymentStatus = "pending_verification"`; bank details appear at checkout and on the confirmation page. An admin marks the payment as paid from the order screen. |
| Debit/credit card (Safepay) | **Stub.** Hidden unless `NEXT_PUBLIC_ENABLE_ONLINE_PAYMENTS="true"`. |
| JazzCash | **Stub.** Same gate. |
| Easypaisa | **Stub.** Same gate. |

The online methods are deliberately not implemented end-to-end: the checkout action rejects them while the flag is off, and there are `TODO(payments)` markers in `src/actions/checkout.ts` where the gateway session belongs. The integration checklist (including the rule that only a signature-verified server callback may mark an order paid) is in [`src/lib/payments/README.md`](src/lib/payments/README.md).

Bank details shown to customers come from the `NEXT_PUBLIC_BANK_*` variables, so they can be changed without touching code.

---

## Routes

**Storefront**

| Path | Purpose |
| --- | --- |
| `/` | Home |
| `/products` | All products with filters and sorting |
| `/products/[slug]` | Product detail, gallery, variants, reviews |
| `/categories` | Collection index |
| `/category/[slug]` | Category listing |
| `/search?q=` | Search results |
| `/cart` | Cart |
| `/wishlist` | Wishlist |
| `/checkout` | Checkout (signed in) |
| `/orders/[orderNumber]` | Order confirmation / tracking (owner only) |
| `/account`, `/account/orders`, `/account/addresses` | Profile, order history, address book |
| `/pages/about`, `/pages/contact`, `/pages/faq`, `/pages/shipping`, `/pages/returns`, `/pages/privacy`, `/pages/terms` | Policy and info pages |
| `/sign-in`, `/sign-up` | Clerk |

**Admin** (role required)

| Path | Purpose |
| --- | --- |
| `/admin` | Dashboard and sales trend |
| `/admin/products`, `/admin/products/new`, `/admin/products/[id]/edit` | Product CRUD |
| `/admin/categories` | Category CRUD |
| `/admin/orders`, `/admin/orders/[id]` | Orders and status/payment updates |
| `/admin/orders/[id]/invoice` | Print-ready invoice |
| `/admin/customers`, `/admin/customers/[id]` | Customers and their orders |
| `/admin/coupons` | Coupons |
| `/admin/reviews` | Review moderation |

**API / SEO**

| Path | Purpose |
| --- | --- |
| `/api/search?q=` | Typeahead search JSON (rate limited) |
| `/api/webhooks/clerk` | Clerk user sync |
| `/sitemap.xml`, `/robots.txt` | Generated by `src/app/sitemap.ts` and `src/app/robots.ts` |

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server on port 3000 |
| `npm run build` | Production build (Turbopack) |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint (includes React Compiler rules) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:generate` | Generate a migration from schema changes |
| `npm run db:migrate` | Apply migrations to `DATABASE_URL` |
| `npm run db:push` | Push the schema without a migration (prototyping) |
| `npm run db:studio` | Drizzle Studio |
| `npm run db:seed` | Reset and seed catalog, reviews, coupons, demo orders |
| `npm run images:generate` | Regenerate product/category/hero/OG artwork |

---

## Project structure

```
.
├─ drizzle/                     SQL migration + snapshot
├─ public/
│  ├─ products/                 40 generated product images
│  ├─ categories/               6 category images
│  ├─ hero.jpg, og.jpg
├─ scripts/
│  ├─ catalog.json              Seed catalog (products, categories, reviews)
│  ├─ seed.ts                   Idempotent seed script
│  └─ generate-images.mjs       SVG → WebP artwork generator
├─ src/
│  ├─ actions/                  Server Actions (cart, wishlist, checkout, account, reviews, admin)
│  ├─ app/
│  │  ├─ (auth)/                Sign-in / sign-up shell
│  │  ├─ (store)/               Storefront routes
│  │  ├─ admin/                 Admin dashboard
│  │  ├─ api/                   Search + Clerk webhook
│  │  ├─ layout.tsx             Fonts, metadata, providers
│  │  ├─ sitemap.ts, robots.ts
│  ├─ components/
│  │  ├─ ui/                    Button, input, dialog, dropdown, etc.
│  │  ├─ layout/                Header, footer, mobile nav, search dialog, WhatsApp button
│  │  ├─ shop/                  Product cards, gallery, filters, reviews
│  │  ├─ cart/, wishlist/, checkout/, account/, orders/, admin/, seo/
│  ├─ db/
│  │  ├─ schema.ts              15 tables
│  │  ├─ index.ts               Pooled `pg` client + Drizzle
│  │  └─ queries/               Catalog, cart, wishlist, account, admin reads
│  ├─ lib/                      auth, constants, format, validations, coupons, rate limit
│  ├─ types/                    Shared commerce types
│  └─ proxy.ts                  Clerk middleware + protected routes
├─ .env.example
├─ drizzle.config.ts
├─ next.config.ts
└─ package.json
```

---

## Caching and rendering

- Storefront pages are `force-dynamic` because the header, cart and wishlist depend on the session.
- Catalog reads are wrapped in `unstable_cache` under a single `CATALOG_TAG` (defined in `src/db/queries/catalog.ts`), so repeated product queries hit the cache instead of Postgres. TTLs range from 60s (typeahead) to 600s (categories).
- Admin mutations call `updateTag(CATALOG_TAG)` (Next 16's immediate invalidation) after product, category, inventory or review changes, so edits appear on the storefront right away.
- `next/image` handles responsive sizing and AVIF/WebP negotiation; remote hosts are allow-listed in `next.config.ts`.
- Security headers (`nosniff`, `SAMEORIGIN`, referrer policy, permissions policy) are set in `next.config.ts`.

> Next 16 changed the cache APIs: `revalidateTag` now takes a cache-life argument, and `updateTag` is the one to use inside Server Actions for read-your-own-writes. The code follows the Next 16 conventions; don't downgrade them to the Next 14 signatures.

---

## Design, responsive and accessibility

- Palette: deep green `#16a34a` primary with cream and terracotta accents; serif display face for headings, Geist Sans for UI.
- Mobile-first layouts tested at 375, 768, 1024 and 1440 px: sticky header with a slide-out menu, mobile bottom navigation, two-column product grids on small screens, single-column checkout.
- Skeleton loading states, Sonner toasts, and designed empty states for cart, wishlist, search, orders and admin tables.
- WCAG AA-minded: visible focus rings, labelled form controls, `aria-invalid` + inline errors, keyboard-operable dialogs and menus, alt text on every image, `prefers-reduced-motion` respected.
- Locale-correct formatting: `₨` currency via `Intl`, dates in `Asia/Karachi`, `+92` phone masks, province list including Gilgit-Baltistan and AJK.

---

## Deployment

### Vercel (recommended)

1. Push the repository to GitHub and import it in Vercel.
2. Add every variable from `.env.local` to **Project → Settings → Environment Variables**. At minimum: `DATABASE_URL`, the Clerk keys and `NEXT_PUBLIC_SITE_URL`.
3. Use the Neon **pooled** connection string for `DATABASE_URL`. If you also run migrations from CI, use the unpooled string there.
4. Run migrations against the production database **before** the first deploy (from your machine or a CI step):

   ```bash
   DATABASE_URL="postgresql://…" npm run db:migrate
   ```

   Do not run migrations during `next build`; builds can run in parallel and should stay read-only.
5. Deploy. The default build command (`next build`) and output are detected automatically.
6. In Clerk, switch to a **production instance**, add your Vercel domain, and create the production webhook pointing at `https://<domain>/api/webhooks/clerk`.
7. Set `NEXT_PUBLIC_SITE_URL` to the production domain so canonical URLs, Open Graph and the sitemap are correct.
8. Optionally seed demo data once with `npm run db:seed` — or skip it and create products in `/admin`.

### Neon

- Create the project in the region closest to your shoppers (`us-east-1` is a reasonable default for Pakistan-facing demos; choose the nearest available).
- Copy the pooled connection string and keep `sslmode=verify-full`.
- Neon's free tier suspends idle computes; the first request after a pause is slower. That is expected.

### Clerk production checklist

- Production keys (`pk_live_…`, `sk_live_…`) in Vercel.
- Domain added and DNS verified.
- Google OAuth credentials configured for the production domain.
- Phone OTP enabled if you want SMS sign-in (carrier fees apply).
- Webhook secret rotated into `CLERK_WEBHOOK_SIGNING_SECRET`.
- At least one user promoted to `{"role":"admin"}`.

---

## Known limitations

- **Online payments are stubs.** Card, JazzCash and Easypaisa are gated behind `NEXT_PUBLIC_ENABLE_ONLINE_PAYMENTS` and must not be enabled before the server-side verification flow exists. See [`src/lib/payments/README.md`](src/lib/payments/README.md).
- **Rate limiting is in-memory.** It is correct for local development and single-instance demos, but serverless instances do not share memory. Swap `src/lib/rate-limit.ts` for Upstash Ratelimit (or Cloudflare's limiter) before high-traffic production use; the function signature is designed to stay the same.
- **No transactional email.** Order confirmation is shown in-app; there is no email/SMS provider wired up. Add Resend/Postmark and call it from the checkout action if you need receipts by email.
- **Product images are generated artwork.** Replace `public/products/*` with real photography before launch.
- **Bank transfers are verified manually.** There is no bank API integration; an admin checks the reference and marks the order paid.
- **Single currency, single country.** Prices are PKR and shipping addresses are Pakistani provinces only.
- **Clerk development keys** print a warning in the browser console. That is expected until you switch to a production instance.
