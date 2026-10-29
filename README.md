# Ritz & Ron

Headless rebuild of [ritzandron.com.au](https://ritzandron.com.au): sterling silver jewellery, Australia only.

| Piece | Role |
| --- | --- |
| `apps/storefront` | Next.js 16 storefront (port 8000) + Sanity Studio at `/studio` |
| `apps/backend` | Medusa v2: products, cart, orders, admin (port 9000, admin at `/app`) |
| Supabase | Postgres for Medusa, Storage (S3 API) for product images |
| Square | Card payments (custom provider in `apps/backend/src/modules/square-payment`) |
| Australia Post | Flat-rate shipping; tracking numbers typed in the admin |
| Resend | Order, shipping, password and welcome emails; newsletter and contact form |

See [PLAN.md](PLAN.md) for the architecture.

## Local setup

```bash
npm install
docker compose up -d                 # Postgres + Redis
cp apps/backend/.env.template apps/backend/.env
cp apps/storefront/.env.example apps/storefront/.env.local
cd apps/backend && npx medusa db:migrate   # also seeds region, GST, shipping, categories
npx medusa user -e you@example.com -p <password>
```

Copy the "Storefront" publishable key from the admin (Settings > Publishable API Keys) into
`NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`, then run `npm run dev` from the root.

Every integration is optional locally. Without its keys:

- Square: only the manual test payment shows at checkout.
- Resend: emails are printed to the backend log. Set `MAILTRAP_API_TOKEN` and `MAILTRAP_INBOX_ID`
  in both apps to send them to a Mailtrap test inbox instead, then
  `npx medusa exec ./src/scripts/send-test-emails.ts` sends one of each template.
- Supabase Storage: uploads go to local disk.
- Sanity: content pages say "coming soon" and homepage sections are hidden. Local dev uses the
  `development` dataset; production uses `production`.

### Going live with each service

- **Supabase**: set `DATABASE_URL` (session pooler, port 5432) and `DATABASE_SSL=true`; create a
  public `product-images` bucket and fill in the `S3_*` variables.
- **Square**: set `SQUARE_*` in the backend and `NEXT_PUBLIC_SQUARE_*` in the storefront, re-run
  the seed or enable "pp_square_square" on the Australia region (Settings > Regions). Add a webhook
  for `payment.updated` pointing at `{MEDUSA_BACKEND_URL}/hooks/payment/square_square`.
  Sandbox test card: 4111 1111 1111 1111, any future expiry, any CVV.
- **Resend**: see [Production email](#production-email-resend) below.
- **Sanity**: create a project, set the Sanity variables in both apps, add `http://localhost:8000`
  as a CORS origin, then backfill products with
  `npx medusa exec ./src/scripts/sync-sanity.ts`. Add a webhook (projection `{_type}`) to
  `{storefront}/api/revalidate` signed with `SANITY_WEBHOOK_SECRET`.

## Deploying the backend (Laravel Cloud)

The storefront deploys to Vercel (root directory `apps/storefront`); the backend to Laravel Cloud.

**Create the application**: New application > this repo > region **Asia Pacific (Sydney)**. When
Cloud lists the apps it found, pick root directory `apps/backend`. Runtime: Node 24 (General
Settings > Runtime).

**Resources** (environment canvas), all in Sydney:

- Database: either Laravel Serverless Postgres (Add database; Cloud injects `DATABASE_URL`) or
  Supabase Pro (set `DATABASE_URL` yourself, see `.env.template`). With Laravel Postgres, use the
  default (direct) host, not the `-pooler` host: Medusa's migrations and locks need a session
  connection.
- Cache: Laravel Valkey (Cloud injects `REDIS_URL`, `rediss://`). Turn **Scale to Zero off** in the
  cache's settings.

**App cluster**: Flex 1 GiB, **Scale to Zero off**. Medusa runs background jobs and event
subscribers (order emails, Sanity sync), so it must stay awake.

**Commands** (Settings > Deployments):

| Setting | Value |
| --- | --- |
| Build command | `npm ci --audit false && npx medusa build && cd .medusa/server && npm install --omit=dev --audit false` |
| Deploy command | `cd .medusa/server && npx medusa db:migrate` |
| Start command | `cd .medusa/server && npm run start` |
| Health checks > Readiness endpoint | `/health` |

`medusa start` listens on the `PORT` Cloud provides. The deploy command runs migrations before each
release goes live; if it fails, the previous release keeps serving. If the first build fails at
`npm ci` (lockfile not found from `apps/backend`), use
`cd ../.. && npm ci --audit false && cd apps/backend && npx medusa build && ...` instead.

**Environment variables** (custom values override injected ones; redeploy after changes):

| Variable | Value |
| --- | --- |
| `DATABASE_SSL` | `true` |
| `MEDUSA_BACKEND_URL` | `https://api.ritzandron.com.au` (baked into the admin at build time) |
| `STOREFRONT_URL` | `https://ritzandron.com.au` |
| `STORE_CORS` | `https://ritzandron.com.au` |
| `ADMIN_CORS` | `https://api.ritzandron.com.au` |
| `AUTH_CORS` | `https://ritzandron.com.au,https://api.ritzandron.com.au` |
| `JWT_SECRET`, `COOKIE_SECRET` | long random strings (`openssl rand -hex 32`), not `supersecret` |
| `S3_*` | Supabase Storage; required, because Cloud's disk is wiped on each deploy |
| `SANITY_PROJECT_ID`, `SANITY_WRITE_TOKEN` | as local; `SANITY_DATASET=production` |
| `REVALIDATE_SECRET` | same value as the storefront's |
| `RESEND_*` | see [Production email](#production-email-resend) |
| `SQUARE_*` | production credentials, `SQUARE_ENVIRONMENT=production` |

Don't set `MAILTRAP_*` or `HOST`. At startup the backend warns if Resend, S3, Redis or the secrets
are missing; check the first deploy's logs for those lines.

**Domain**: Settings > Domains > `api.ritzandron.com.au`, then add the DNS record Cloud shows.
The admin is at `https://api.ritzandron.com.au/app`. Point the storefront's
`NEXT_PUBLIC_MEDUSA_BACKEND_URL` at the same URL and redeploy it.

**First deploy with the copied database**: restore the local dump into the production database
before the first deploy, so the deploy command only finds already-applied migrations.

## Production email (Resend)

Mailboxes for `@ritzandron.com.au` are on Namecheap Private Email (MX `privateemail.com`). Resend
only adds records on `send.` and `resend._domainkey`, so incoming mail is unaffected.

1. Resend > Domains > Add `ritzandron.com.au`, picking the sending region closest to Australia.
2. Add the records Resend shows at the DNS host (nameservers `ns1-3.nameserver.net.au`): an MX and
   a TXT (SPF) on `send`, and a TXT (DKIM) on `resend._domainkey`. Leave the existing root MX and
   SPF records alone. Also add `_dmarc` TXT `v=DMARC1; p=none; rua=mailto:info@ritzandron.com.au`
   if there is no DMARC record yet. Wait for Resend to show the domain as Verified.
3. Resend > API Keys > create a "Sending access" key limited to `ritzandron.com.au` for the
   backend, and a "Full access" key for the storefront (adding newsletter contacts needs it).
4. In Resend's contacts area, create a segment for the newsletter and copy its ID.
5. Production environment variables:

   | Variable | Backend | Storefront |
   | --- | --- | --- |
   | `RESEND_API_KEY` | sending key | full-access key |
   | `RESEND_FROM` | `Ritz & Ron <orders@ritzandron.com.au>` | same |
   | `RESEND_REPLY_TO` | `hello@ritzandron.com.au` | |
   | `CONTACT_EMAIL` | | inbox for contact form enquiries |
   | `RESEND_NEWSLETTER_SEGMENT_ID` | | segment ID from step 4 |

   Don't set `MAILTRAP_*` in production. They're ignored when `NODE_ENV=production` anyway, and the
   backend logs a warning at startup if `RESEND_API_KEY` is missing there.
6. Check: place a real order with your own email, submit the contact form, and sign up to the
   newsletter. The two emails should appear under Resend > Emails and the signup in its contacts.

`hello@` and `info@` must be real mailboxes (or aliases) in Private Email so customer replies
arrive.

## Staff guide: dispatching an order

1. Admin > Orders > open the order > **Fulfill items**.
2. Pack and lodge the parcel with Australia Post.
3. On the fulfillment, **Mark as shipped** and paste the AusPost tracking number. Leave the URL blank.
4. The customer gets a "Your order is on its way" email with a tracking link, and the tracking
   shows on their account order page.

## Content guide

Prices, stock, photos and categories: Medusa admin. Homepage, banners, product stories, FAQ,
journal and the content pages (Our story, Jewellery care, Shipping, Returns, Contact, Privacy,
Terms): Sanity Studio at `/studio`.
Shipping fees: Settings > Locations & Shipping (free Parcel Post over $99 is a price rule on that option).
