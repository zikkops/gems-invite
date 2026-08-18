# GEMS — The Earth Soirée invitation

A standalone Next.js (Pages Router) site for the Earth Soirée invitation and
sponsorship page, split out of `gems-website` so it can be deployed to its own
subdomain.

The page is served at the site root (`/`), since the subdomain already names it.

## Local development

```
npm install
npm run dev      # http://localhost:3000
```

## Payments — Square

Card details are collected on the page itself with Square's **Web Payments
SDK**: the card fields are iframes hosted by Square, so no card number ever
reaches this site or its server. The browser tokenizes the card, posts the
token to `/api/create-payment`, and that route charges it through the Square
Payments API.

The amount is **recomputed on the server** from the submitted selection
(`lib/pricing.js`), so a tampered browser cannot change the price.

### Where the credentials come from

All of them live in the Square Developer Dashboard —
<https://developer.squareup.com/apps>. Sign in with the Square account that
should receive the money, create (or open) an application, then use the
**Sandbox / Production** switch in the left rail: each environment has its own
separate set of credentials.

| Variable | Where to find it | Secret? |
| --- | --- | --- |
| `SQUARE_ACCESS_TOKEN` | App → **Credentials** → Access token | **Yes** — server only |
| `SQUARE_LOCATION_ID` | App → **Locations** → the location that takes the money | No, but kept server-side |
| `SQUARE_ENVIRONMENT` | `sandbox` while testing, `production` when live | — |
| `NEXT_PUBLIC_SQUARE_APPLICATION_ID` | App → **Credentials** → Application ID | No — sent to the browser |
| `NEXT_PUBLIC_SQUARE_LOCATION_ID` | Same value as `SQUARE_LOCATION_ID` | No — sent to the browser |

Sandbox application ids start with `sandbox-sq0idb-` and production ids with
`sq0idp-`; the page reads that prefix to decide which SDK build to load, so
there is no separate environment flag on the client.

Taking **real** cards additionally requires the Square account to be fully
activated (business and bank details completed) and the application to have
gone through **Production activation** in the dashboard.

### Setting them locally

```
cp .env.example .env.local     # .env.local is gitignored — never commit it
```

Fill in the five values and restart `npm run dev`. With no credentials set the
page falls back to the old hosted Square payment link (`PAYMENT_LINK` in
`lib/content-invitation.js`), so it never ends up with a dead checkout.

Test cards for sandbox: `4111 1111 1111 1111`, any future expiry, any CVV,
postal code `94103`.

### The order form is required

All five sponsor fields must be filled in before a card is even tokenized.
`lib/buyer.js` defines the form once; the page renders from it and both the
browser and the API route validate against it, so the server rejects an
incomplete order even if the browser check is bypassed.

## Order notification emails

After every successful payment, `lib/notify.js` emails the full order — line
items, total, all five sponsor fields, the Square payment id and receipt link —
to every address in `ORDER_NOTIFICATION_EMAILS` (comma-separated). The
sponsor's own address is set as `Reply-To`, so replying reaches them directly.

Delivery is SMTP via nodemailer. The four variables it needs:

| Variable | Value |
| --- | --- |
| `SMTP_HOST` | `smtp.hostinger.com` |
| `SMTP_PORT` | `465` (implicit TLS) or `587` (STARTTLS) |
| `SMTP_USER` | the full mailbox address, e.g. `info@gemsworlddialogue.com` |
| `SMTP_PASS` | that **mailbox's** password — not the hPanel login |

Create the mailbox first in hPanel under **Emails → gemsworlddialogue.com**,
then read its settings from **Connect apps & devices**. Hostinger rejects a
`From` that is not the authenticated mailbox, so `SMTP_USER` must be a real
mailbox on the domain; the `From` header defaults to it.

With any of them missing the message is logged rather than sent, so an order is
still recoverable from the server log.

### Verifying delivery

Set `NOTIFY_TEST_SECRET` to a long random string and call:

```
curl "https://invitation.gemsworlddialogue.com/api/test-notification?secret=YOUR_SECRET"
```

It sends a clearly-labelled sample order to the real recipients without taking
a card. The endpoint returns 404 while `NOTIFY_TEST_SECRET` is unset, so it is
off unless deliberately switched on.

### Failure behaviour

`sendOrderNotification` cannot throw. The card has already been charged by the
time it runs, so a mail failure must never surface to the sponsor as a failed
payment — instead it logs `ORDER NOTIFICATION FAILED` followed by the full
order, which is the record to work from if an email goes missing.

Separately, Square emails its own receipt to the sponsor, because the route
passes their address as `buyer_email_address`.

### Setting them on Vercel

Project → **Settings → Environment Variables**. Add the same five keys, keep
`SQUARE_ACCESS_TOKEN` marked as sensitive, and set `SQUARE_ENVIRONMENT` to
`production` for the production environment. Redeploy after changing them —
the `NEXT_PUBLIC_` ones are baked in at build time.

## Structure

- `pages/index.js` — the invitation and the nine sponsorship activations.
  Selection state, the running total, the patron tier and the order form are
  React state; the Presenting Patron and Guardian spots are mutually exclusive.
- `lib/content-invitation.js` — SDG goals, activation copy and patron tiers.
- `lib/pricing.js` — the one place the order is priced. Imported by both the
  page and the API route, so the total shown and the total charged agree; it
  also clamps quantities, so the server prices only what the page offers.
- `lib/square-server.js` — Square host, pinned API version and the access
  token. Server-only; importing it from a component would leak the token.
- `pages/api/create-payment.js` — takes the card token, reprices the order and
  creates the Square payment.
- `components/SquareCheckout.js` — loads the Web Payments SDK, mounts the card
  form and reports the result.
- `lib/buyer.js` — the order form's field list and its validation, shared by
  the page and the API route.
- `lib/notify.js` — composes and sends the order email over SMTP.
- `pages/api/test-notification.js` — secret-gated sample send, for checking the
  mailbox works.
- `styles/invitation.css` — every rule scoped under `#invitation-page`. The
  responsive blocks must stay at the end of the file; the `.pkg` rules above
  them are more specific, so a media query placed earlier loses the cascade.
- `styles/globals.css` — minimal reset only.
- `public/images/invitation/` — the eleven photographs.

## Deployment

Deployed as its own Vercel project so it can be mapped to a subdomain.
