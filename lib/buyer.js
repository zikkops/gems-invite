// The order form. Shared by the page and the API route so "the form is filled
// in" means the same thing in the browser and on the server — the browser
// check is for the guest, the server check is the one that actually holds.

// This list is the form: the page renders from it and both sides validate
// against it, so a field cannot exist in one place and not the other.
export const BUYER_FIELDS = [
  { key: 'company', label: 'Company / Brand', placeholder: 'Your company' },
  { key: 'signatory', label: 'Authorized Signatory', placeholder: 'Full name' },
  { key: 'email', label: 'Email', type: 'email', placeholder: 'name@company.com' },
  { key: 'phone', label: 'Phone', type: 'tel', placeholder: '+1 ...' },
  {
    key: 'signature',
    label: 'Signature',
    placeholder: 'Type your name to sign',
    className: 'sig',
  },
];

// Deliberately loose: something@something.something. Anything stricter starts
// rejecting valid addresses, and Square verifies the address itself.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const clean = (v) => (typeof v === 'string' ? v.trim() : '');

/** @returns {{valid: boolean, errors: Record<string,string>}} */
export function validateBuyer(buyer) {
  const b = buyer || {};
  const errors = {};

  for (const f of BUYER_FIELDS) {
    if (!clean(b[f.key])) errors[f.key] = `${f.label} is required.`;
  }

  if (!errors.email && !EMAIL.test(clean(b.email))) {
    errors.email = 'Enter a valid email address.';
  }
  // A signature is a name, not a scribble — guard the obvious mis-fill.
  if (!errors.signature && clean(b.signature).length < 2) {
    errors.signature = 'Type your full name to sign.';
  }
  if (!errors.phone && clean(b.phone).replace(/\D/g, '').length < 7) {
    errors.phone = 'Enter a contactable phone number.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/** Trimmed copy of just the fields we keep. */
export function normalizeBuyer(buyer) {
  const b = buyer || {};
  return Object.fromEntries(BUYER_FIELDS.map((f) => [f.key, clean(b[f.key]).slice(0, 254)]));
}
