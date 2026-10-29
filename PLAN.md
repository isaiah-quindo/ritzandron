# Ritz & Ron — Headless Rebuild Plan

## Context
Ritz & Ron (ritzandron.com.au) is an Australian sterling-silver jewellery shop (charms, charm bracelets, earrings, necklaces, scrunchies, gift boxes; ~148 products, $12–$60 AUD) currently on WooCommerce. The site looks dated, carries placeholder text, and shows injected casino/betting spam posts, so a rebuild is due. Goal: an elegant, clean, fast storefront on a modern headless stack:

- **Next.js** storefront (App Router) — UI, embedded Sanity Studio at `/studio`
- **Medusa v2** — commerce engine: products, prices, stock, cart, orders, customers, admin dashboard
- **Sanity** — homepage, editorial, blog, FAQ/policies, and rich product storytelling (linked to Medusa products by ID, auto-synced)
- **Supabase** — Postgres database for Medusa + Storage (S3-compatible) for product images
- **Square** — payments (custom Medusa payment provider + Square Web Payments SDK)
- **Australia Post** — flat-rate shipping options; staff type tracking numbers in Medusa admin
- **Resend** — transactional email (order confirmation, shipped-with-tracking, password reset)

Decisions made with the user: products entered **manually** in Medusa admin (no WooCommerce migration); Sanity does **content + product enrichment**; **flat-rate** AusPost shipping (free standard over $99, matching today); **hosting decided later** — build and run locally first.

The project folder `C:\Users\saizo\Desktop\Projects\ritzandron` is empty (greenfield). Node 24, npm 11, Docker 28 available.

## Repository layout (npm workspaces monorepo)
```
ritzandron/
  apps/
    backend/      Medusa v2 server + admin (create-medusa-app)
    storefront/   Next.js 15 (from Medusa Next.js starter, restyled) + Sanity Studio at /studio
  packages/
    emails/       React Email templates shared by backend (rendered, sent via Resend)
  docker-compose.yml   Redis for local dev
  .env.example files per app
```
Start from `npx create-medusa-app@latest --with-nextjs-starter` — the starter already has cart, checkout steps, account, order history and region handling, which we restyle rather than rewrite.

## Phase 1 — Foundations
1. Scaffold monorepo; Medusa backend + Next.js starter; git init.
2. Supabase project: use the **direct/session connection string (port 5432)** as `DATABASE_URL` for Medusa (migrations need a non-transaction pooler connection). Run `npx medusa db:migrate`.
3. Supabase Storage bucket `product-images` (public). Configure Medusa's `@medusajs/medusa/file-s3` provider against the Supabase S3 endpoint (`https://<ref>.supabase.co/storage/v1/s3`, `forcePathStyle: true`, S3 access keys from Supabase).
4. Redis via docker-compose; wire Medusa event bus, cache, workflow engine to Redis (`@medusajs/medusa/event-bus-redis`, etc.).
5. Customer auth stays in Medusa (emailpass). **Supabase Auth is not used** — avoids two identity systems.
6. Seed script `apps/backend/src/scripts/seed.ts`: Region "Australia" (AUD, country AU), sales channel, stock location (NSW), **tax-inclusive pricing with 10% GST** tax rate, publishable API key, product categories mirroring today's nav (Silver Charms + sub-categories, Charm Bracelets, Earrings, Necklaces, Scrunchies, Gift Boxes), and the shipping setup in Phase 4.

## Phase 2 — Square payments (custom Medusa payment provider)
Module: `apps/backend/src/modules/square-payment/` (`index.ts` with `ModuleProvider(Modules.PAYMENT, …)`, `service.ts` extending `AbstractPaymentProvider`), registered in `medusa-config.ts` under the payment module with id `square`. Uses the official `square` Node SDK.

Flow:
- Storefront checkout renders Square **Web Payments SDK** card field (plus Apple Pay / Google Pay buttons) → tokenizes to a `sourceId`.
- Storefront updates the payment session data with the token, then calls cart complete.
- `initiatePayment`: return session data (amount, currency AUD, idempotency key).
- `authorizePayment`: Square `CreatePayment` with `autocomplete: false`, `amountMoney` in cents, `locationId`, `buyerEmailAddress`, `referenceId` = cart id; returns `authorized` + Square payment id.
- `capturePayment`: `CompletePayment` (configurable `autoCapture` option to capture immediately on order placement — recommended for simplicity).
- `refundPayment`: `RefundPayment`; `cancelPayment`: `CancelPayment`; `getPaymentStatus`/`retrievePayment`: `GetPayment`.
- `getWebhookActionAndData`: verify Square signature (`WebhooksHelper.isValidWebhookEventSignature`) for `payment.updated`; endpoint at `/hooks/payment/square_square`.
- Enable provider for the Australia region in seed.
- Env: `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, `SQUARE_ENVIRONMENT` (sandbox|production), `SQUARE_WEBHOOK_SIGNATURE_KEY`; storefront `NEXT_PUBLIC_SQUARE_APP_ID`, `NEXT_PUBLIC_SQUARE_LOCATION_ID`.
- Storefront: replace starter's Stripe pieces in `src/modules/checkout/components/payment*` with a `SquareCardForm` component (load `https://sandbox.web.squarecdn.com/v1/square.js` / production URL by env).
- Future option: Square's Afterpay/Clearpay method in the Web Payments SDK (AU supported) — not in v1.

## Phase 3 — Sanity (content + product enrichment)
Studio embedded in Next.js at `apps/storefront/src/app/studio/[[...tool]]/page.tsx` (`next-sanity`).

Schemas (`apps/storefront/src/sanity/schemas/`):
- `siteSettings` — announcement bar ("Free shipping Australia-wide over $99"), socials (Instagram, TikTok, Facebook), footer links, newsletter copy.
- `homePage` — hero (image/video, headline, CTA), featured categories, featured products (references to `product` docs), editorial blocks, testimonial strip.
- `product` — **synced from Medusa**: `medusaId`, `handle`, `title` (read-only), plus editor-owned `story` (portable text), `materials`, `careNotes`, `lifestyleImages`, `seo`.
- `categoryEditorial` — keyed by Medusa category handle: banner image, intro copy.
- `post` (blog — migrate "Taking care of your silver jewellery" etc. by hand), `faq`, `page` (Shipping, Returns & Exchanges, Privacy, About, Care Guide).

Sync: Medusa subscribers `apps/backend/src/subscribers/sanity-product-sync.ts` on `product.created` / `product.updated` / `product.deleted` → workflow upserts `product` doc via `@sanity/client` (write token) with `_id = product-<medusaId>`. Plus a one-off `medusa exec ./src/scripts/sync-sanity.ts` for backfill.

Revalidation: Next.js uses tagged fetches (`products`, `sanity:<type>`); route `src/app/api/revalidate/route.ts` handles Sanity webhook (signature-verified via `next-sanity/webhook`) and a Medusa subscriber pings it on product changes.

## Phase 4 — Shipping (Australia Post, flat rate) & manual tracking
- Fulfillment: Medusa built-in **manual fulfillment provider**, service zone "Australia".
- Shipping options (seeded, editable in admin):
  - **AusPost Parcel Post** — flat fee (e.g. $9.95), **$0 when cart `item_total` ≥ $99** via shipping-option price rules.
  - **AusPost Express Post** — flat fee (e.g. $14.95).
  - Final fees confirmed with client before launch.
- Tracking workflow for staff (no AusPost API):
  1. Admin → Order → **Create fulfillment** → pack and post.
  2. **Mark as shipped** → enter AusPost tracking number (built-in shipment form, tracking number + URL fields).
  3. Small admin widget `apps/backend/src/admin/widgets/auspost-tracking-hint.tsx` on the order page reminding the tracking URL format; the subscriber builds `https://auspost.com.au/mypost/track/details/<number>` if the URL is left blank.
- Subscriber `apps/backend/src/subscribers/shipment-created.ts` on `shipment.created` → loads order, items, fulfillment labels → sends "Your order is on its way" email with tracking link via the Notification module (Resend provider).
- Customer account order page shows status + tracking link (from fulfillment labels).

## Phase 5 — Email (Resend)
- Custom notification provider module `apps/backend/src/modules/resend/` (`AbstractNotificationProviderService`) registered for channel `email`; env `RESEND_API_KEY`, `RESEND_FROM` (e.g. `Ritz & Ron <orders@ritzandron.com.au>`; domain verified in Resend).
- Templates in `packages/emails` (React Email, brand-styled): `order-placed`, `order-shipped` (tracking), `password-reset`, `welcome`, `order-canceled`.
- Subscribers: `order.placed`, `shipment.created`, `auth.password_reset`, `customer.created`, `order.canceled`.
- Newsletter signup in footer → Next.js server action adds contact to a Resend Audience.

## Phase 6 — Storefront design ("elegant and clean")
- Visual system (Tailwind theme tokens in `tailwind.config.js`): warm ivory background, charcoal text, soft champagne/silver accent, generous whitespace, thin hairline dividers; serif display (e.g. Cormorant Garamond) + clean sans body (e.g. Jost/Inter) via `next/font`. Large, consistent square product photography on near-white.
- Pages:
  - Home (Sanity-driven hero, featured categories, new arrivals, editorial/gift-guide block, Instagram strip).
  - Shop / category listing (`/shop`, `/categories/[...handle]`) — filters by category and price, sort; editorial banner from Sanity.
  - Product page — gallery with zoom, price incl. GST, variant selector if any, add to bag, story/materials/care accordions from Sanity, "Add a gift box" upsell, related products.
  - Slide-out cart drawer; free-shipping progress bar ("$X away from free shipping").
  - Checkout — single-page steps: contact/email → address (AU) → shipping option → Square payment → review.
  - Account — login/register, addresses, order history with tracking.
  - Content: About, FAQ, Shipping, Returns & Exchanges, Care Guide, Blog, Contact (form → Resend email to shop).
  - Search — Medusa product search (`q` param) for v1.
- SEO: metadata from Sanity, JSON-LD Product schema, sitemap.ts, robots.ts, OG images; redirects map from old WooCommerce URLs (`/product/<slug>` → `/products/<handle>`, `/product-category/...` → `/categories/...`) in `next.config.js` to keep Google rankings.
- Accessibility and performance: `next/image`, AA contrast, keyboard-navigable drawer/menus.

## Deferred (post-v1)
Wishlist, product reviews, Afterpay via Square, Algolia/Meilisearch search, hosting/deploy (Vercel for storefront + Railway/Render or Medusa Cloud for backend+Redis), domain cut-over.

## Environment variables (summary)
- backend: `DATABASE_URL` (Supabase), `REDIS_URL`, `STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS`, `JWT_SECRET`, `COOKIE_SECRET`, `S3_*` (Supabase Storage), `SQUARE_*`, `RESEND_*`, `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_WRITE_TOKEN`, `STOREFRONT_URL`, `REVALIDATE_SECRET`.
- storefront: `MEDUSA_BACKEND_URL`, `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_READ_TOKEN`, `SANITY_WEBHOOK_SECRET`, `NEXT_PUBLIC_SQUARE_APP_ID`, `NEXT_PUBLIC_SQUARE_LOCATION_ID`, `RESEND_API_KEY` (contact/newsletter).

Accounts the user needs to create/provide: Supabase project, Sanity project, Square developer app (sandbox), Resend account + verified domain.

## Verification (end-to-end, all local)
1. `docker compose up -d` (Redis); `npm run dev` in backend → admin at `localhost:9000/app` loads; seed creates AU region, GST, shipping options.
2. Upload a product image in admin → file lands in Supabase Storage bucket and renders on storefront.
3. Create a product in admin → a matching `product` doc appears in Sanity Studio (`localhost:8000/studio`); add a story → it shows on the product page after webhook revalidation.
4. Checkout with Square sandbox card `4111 1111 1111 1111` → order created in Medusa, payment visible in Square sandbox dashboard; order-confirmation email arrives (Resend test/`delivered@resend.dev`).
5. Cart ≥ $99 → Parcel Post shows $0; under $99 → flat fee.
6. In admin: create fulfillment → mark shipped with a tracking number → "on its way" email arrives with working AusPost link; customer account shows tracking.
7. Refund from admin → refund appears in Square sandbox.
8. Lighthouse on home/product pages (target ≥ 90 performance/accessibility); mobile layout check in browser pane.
