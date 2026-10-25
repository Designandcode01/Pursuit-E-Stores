# Online payment integrations (stubs)

Cash on delivery and bank transfer are fully implemented. Card, JazzCash and
Easypaisa are deliberately **stubbed**: the checkout UI lists them, but they
stay disabled until `NEXT_PUBLIC_ENABLE_ONLINE_PAYMENTS="true"` and the
server-side verification flow described below exists.

`src/actions/checkout.ts` contains the two `TODO(payments)` markers where the
gateway hand-off belongs.

## Ground rules

1. **Never mark an order paid from the browser.** A redirect back from a
   gateway proves nothing. Only a signature-verified server callback may set
   `orders.paymentStatus = "paid"`.
2. **Create the order first, then the session.** The order row is the source of
   truth; the gateway session should carry `orderNumber` in its metadata so the
   callback can find it.
3. **Keep the amount server-side.** Recompute the total from `orderItems`, never
   from a form field.
4. **Idempotency.** Gateways retry callbacks. Store the gateway transaction id
   on the order (or a `payment_events` table) and ignore repeats.
5. **Refunds** are manual for now — set `paymentStatus = "refunded"` from the
   admin order page after the money is returned.

## Safepay (cards)

- Env: `SAFEPAY_API_KEY`, `SAFEPAY_SECRET_KEY`.
- Create a payment session server-side (server-to-server, signed with the
  secret) and redirect to the hosted checkout URL it returns.
- Add a route handler at `src/app/api/webhooks/safepay/route.ts`, verify the
  signature, then update the matching order.
- Docs: <https://docs.safepay.com>

## JazzCash

- Env: `JAZZCASH_MERCHANT_ID`, `JAZZCASH_PASSWORD`, `JAZZCASH_INTEGRITY_SALT`.
- Build the `pp_*` payload, sign it with HMAC-SHA256 using the integrity salt,
  and POST to the JazzCash hosted page.
- Verify `pp_SecureHash` on the return URL **and** confirm via the transaction
  inquiry API before marking the order paid.

## Easypaisa

- Env: `EASYPAISA_STORE_ID`, `EASYPAISA_HASH_KEY`.
- Same shape as JazzCash: signed request, hosted page, then verify the response
  hash and confirm with the inquiry API.

## Wiring it up

1. Fill in the credentials in `.env.local`.
2. Set `NEXT_PUBLIC_ENABLE_ONLINE_PAYMENTS="true"` so the methods become
   selectable (see `PAYMENT_METHODS` in `src/lib/constants.ts`).
3. Replace the `TODO(payments)` block in `src/actions/checkout.ts` with the
   session creation call and redirect.
4. Add the callback route under `src/app/api/webhooks/`.
5. Test in the gateway sandbox with a real end-to-end payment before enabling
   the flag in production.
