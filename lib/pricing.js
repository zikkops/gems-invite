// Pricing is computed here so the browser and the API route agree on the
// number. The client uses it to show the running total; the server uses it to
// recompute the charge from the submitted selection, so the amount that
// reaches Square never comes from the browser.
import { activations, patronTiers } from './content-invitation';

const byId = Object.fromEntries(activations.map((a) => [a.id, a]));

// The pledge station is one activation with two mutually exclusive spots, so
// its two selection keys are not activation ids.
const PLEDGE = byId.sdg;

/**
 * Coerce whatever arrived over the wire into a selection we are willing to
 * price: known ids only, quantities clamped to what each activation allows.
 */
export function normalizeSelection(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;

  for (const a of activations) {
    if (a.kind === 'select') {
      if (Number(raw[a.id]) > 0) out[a.id] = 1;
    } else if (a.kind === 'tickets') {
      const qty = Math.floor(Number(raw[a.id]) || 0);
      if (qty > 0) out[a.id] = Math.min(qty, a.maxTickets);
    }
  }

  // Presenting Patron wins if a tampered payload somehow claims both.
  if (Number(raw.sdg_p) > 0) out.sdg_p = 1;
  else if (Number(raw.sdg_g) > 0) out.sdg_g = 1;

  return out;
}

/** Selected activations as order lines, in the order they appear on the page. */
export function lineItems(selection) {
  const lines = [];
  for (const a of activations) {
    if (a.kind === 'pledge') {
      if (selection.sdg_p)
        lines.push({ name: `${a.name} — Presenting Patron`, qty: 1, total: a.amount });
      if (selection.sdg_g)
        lines.push({ name: `${a.name} — Guardian of the Goals`, qty: 1, total: a.guardianAmount });
      continue;
    }
    const qty = selection[a.id] || 0;
    if (qty > 0) lines.push({ name: a.name, qty, total: qty * a.amount });
  }
  return lines;
}

/** Total commitment in whole dollars. */
export function computeTotal(selection) {
  return lineItems(selection).reduce((sum, l) => sum + l.total, 0);
}

/** Highest patron tier reached by a total, or null below the first rung. */
export function currentTier(total) {
  let current = null;
  for (const tier of patronTiers) if (total >= tier.min) current = tier;
  return current;
}

/** "2 × The Evening — Tickets ($1,000); The Mirror ($15,000)" — for the Square note. */
export function summarize(selection) {
  return lineItems(selection)
    .map((l) => (l.qty > 1 ? `${l.qty} × ${l.name}` : l.name) + ` ($${l.total.toLocaleString('en-US')})`)
    .join('; ');
}

export { PLEDGE };
