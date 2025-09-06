Key production fixes applied on 2025-08-27:

1) Removed duplicate API folder at src/app/api/public/cleaners (canonical is src/app/api/public-cleaners/*). Update any client calls accordingly.
2) Home page simplified & de-duped buttons — only “View Profile” remains. Added H1 and footer links (fixes H1/outgoing links/low content).
3) Cleaner Profile flow fixed: selecting a slot no longer auto-creates a pending booking. “Book” button routes to /payment/[cleanerId] and passes slot+price via localStorage.
4) Cleaner Dashboard now shows pending bookings via a new endpoint: GET /api/cleaners/[id]/pending.
5) middleware.js rewritten to a safe no-op with a proper config export. Removed invalid req.user mutation.
6) BookingPaymentForm now uses NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY consistently.
7) SEO & Social: layout.js includes complete metadata (Open Graph + Twitter). Added app/sitemap.js and renamed public/roots.txt -> robots.txt.
8) Blog pages simplified: /blog (index) and /blog/[slug] with AdSense slots and server-side fetch of /api/blogs.
9) Security: scrubbed scripts/test-db.js which contained a hard-coded Mongo URI placeholder.
10) Sitemaps now generated dynamically from app/sitemap.js using NEXT_PUBLIC_SITE_URL (default https://www.findtrustedcleaners.com).

Follow-ups you should do:
- Ensure NEXT_PUBLIC_SITE_URL and NEXT_PUBLIC_ADSENSE_ID are set in Vercel env.
- Verify /api/blogs endpoints return { posts, post } with title/slug/content HTML.
- Confirm Stripe webhook & /api/stripe/payment-intent are functioning and capturing on acceptance (manual capture flow).
- Consider removing public/sitemap.xml to avoid conflicts with app/sitemap.js.
