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

## Payments — Square hosted checkout

The sponsor selects their activations, signs the order form, and the
**Proceed to Secure Payment** button opens the Square payment link
(`PAYMENT_LINK` in `lib/content-invitation.js`) in a new tab, where they type
in the Total Commitment the page showed them.

Nothing about that payment comes back to this site — Square is not told what
was selected, and does not tell us when the money arrives. That is why the
order is emailed on the way out (see below), and why the Square dashboard is
the place to confirm a payment actually landed.

There are no Square API credentials involved. The payment link is a plain URL,
so nothing here needs a secret.

### The order form is required

The Square tab will not open until **an activation is selected and all five
sponsor fields are filled in**. Clicking before then keeps the sponsor on the
page, marks the missing fields, and says why; the button is greyed until the
order is complete.

`lib/buyer.js` defines the form once — the page renders from it and the API
route validates against it independently, so a bypassed browser check still
cannot record an incomplete order.

## The shared GEMS backend

Every paid-through order is written to Firestore in the **same Firebase project
that backs `gems-website`**, so sponsorships appear in that site's admin console
next to the website enquiries. See `gems-website/BACKEND.md` for the project
setup; this app only needs the three server variables.

- Collection **`orders`**, one document per submitted order.
- `source: 'gems-invitation'` — the field the console uses to tell the GEMS
  properties apart.
- `status: 'awaiting-payment'`, never `paid`. Square reports nothing back from a
  hosted checkout, so an admin confirms the money against the Square dashboard.
- Fields: `company`, `signatory` (also copied to `name`), `email`, `phone`,
  `signature`, `signedOn`, `total`, `currency`, `items[]`, the raw `selection`,
  `meta` (ip / user agent / referer) and `createdAt`.

`lib/firebase/admin.js` is a copy of the website's, with one fix: its
`privateKey()` did `replace(/\n/g, '\n')`, which is a no-op — the version here
does `replace(/\n/g, '\n')` so a one-line key from a hosting panel is turned
back into a real PEM. **The website's copy still has the original and will fail
to start on a one-line key.**

The write cannot throw and never blocks the sponsor reaching Square. If it
fails it logs `ORDER NOT SAVED TO FIRESTORE` with the reason, and the
notification email still carries the whole order.
## Order notification emails

When the sponsor clicks through to Square, the page posts the order to
`/api/submit-order`, which emails the full order — line items, total and all
five sponsor fields — to every address in `ORDER_NOTIFICATION_EMAILS`
(comma-separated). The sponsor's own address is set as `Reply-To`, so replying
reaches them directly.

The email is explicit that the money has **not** been confirmed: it says
"sent to Square to pay", labels the figure *Total to collect*, and its subject
carries "(payment pending)". Reconcile it against the Square dashboard.

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

`sendOrderNotification` cannot throw, and the click through to Square is never
blocked on it — a mail problem must not stop a sponsor from paying. Instead it
logs `ORDER NOTIFICATION FAILED` followed by the full order, which is the
record to work from if an email goes missing.

### Setting them on the host

Add the `SMTP_*`, `ORDER_NOTIFICATION_EMAILS` and `NOTIFY_TEST_SECRET`
variables in the hosting panel (hPanel for Hostinger, Settings → Environment
Variables on Vercel), keep `SMTP_PASS` marked sensitive, and redeploy — the
running server only picks them up on restart.

## Structure

- `pages/index.js` — the invitation and the nine sponsorship activations.
  Selection state, the running total, the patron tier and the order form are
  React state; the Presenting Patron and Guardian spots are mutually exclusive.
- `lib/content-invitation.js` — SDG goals, activation copy and patron tiers.
- `lib/pricing.js` — the one place the order is priced. Imported by both the
  page and the API route, so the total shown and the total emailed agree; it
  also clamps quantities, so only what the page offers is ever priced. A
  `pledge` activation owns two mutually exclusive keys, `<id>_p` and `<id>_g`.
- `pages/api/submit-order.js` — reprices the order, checks the form, then saves
  it to Firestore and emails it as the sponsor leaves for Square.
- `lib/orders.js` — the `orders` document shape and the write.
- `lib/firebase/admin.js` — Admin SDK singleton, copied from gems-website.
  Server-only; the browser never touches Firestore.
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

Deployed on Hostinger as a Node app at
<https://invitation.gemsworlddialogue.com/>. API routes need a real Node
server — static hosting would 404 on `/api/*` and the order email would never
be sent.
