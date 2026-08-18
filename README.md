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

## Structure

- `pages/index.js` — the invitation and the nine sponsorship activations.
  Selection state, the running total, the patron tier and the order form are
  React state; the Presenting Patron and Guardian spots are mutually exclusive.
- `lib/content-invitation.js` — SDG goals, activation copy and patron tiers.
- `styles/invitation.css` — every rule scoped under `#invitation-page`. The
  responsive blocks must stay at the end of the file; the `.pkg` rules above
  them are more specific, so a media query placed earlier loses the cascade.
- `styles/globals.css` — minimal reset only.
- `public/images/invitation/` — the eleven photographs.

## Deployment

Deployed as its own Vercel project so it can be mapped to a subdomain.
