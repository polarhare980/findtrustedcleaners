# Test Plan (Quick)

## Local (dev)
1. `npm i` then `npm run dev`.
2. Visit `/` — homepage loads premium & free cleaner cards without console errors.
3. Click a cleaner card → `/cleaners/:id` profile renders.
4. Services buttons show; duration & span update; selection works.
5. Select a time slot that fits the span → "Request booking" flow triggers:
   - If not logged in → redirected to `/login?next=/cleaners/:id`.
   - After login as a **client**, repeat: POST `/api/clients/purchases` returns 201 with `span`.
6. Contact unlock:
   - While booking is `pending`, POST `/api/clients/contact-unlock` returns 202 and **does not** expose contact.
   - After you set the booking/purchase to `accepted` (via database or admin route), POST unlock returns 200 with `email/phone`.
7. Availability:
   - Pending/accepted overlays appear on profile grid and homepage cards (derived from purchases feed).
8. Legacy API:
   - `GET /api/public/cleaners` and `/api/public/cleaners/:id` both return JSON like their `public-cleaners` counterparts.

## Vercel
- Set environment variables from `.env.example`.
- Redeploy; confirm pages render without 404/405/500 in logs.
- Stripe webhooks: verify the raw-body exemption path is correct for your configured webhook URL.

