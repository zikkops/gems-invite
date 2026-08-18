// Order notifications.
//
// Sending is not wired up yet — that happens once the site is on Hostinger and
// we know which SMTP account it may send through. Until then this composes the
// message and logs it, so a paid order is always recoverable from the server
// log and switching on real delivery is a single change in `deliver()`.
//
// Nothing in here may throw: the card has already been charged by the time it
// runs, so a notification failure must never turn a successful payment into an
// error for the guest.

import { lineItems } from './pricing';

const money = (n) => '$' + n.toLocaleString('en-US');

/** Who gets told about a new order. Comma-separated in the environment. */
export function recipients() {
  return (process.env.ORDER_NOTIFICATION_EMAILS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function composeOrderEmail({ buyer, selection, total, payment }) {
  const lines = lineItems(selection);

  const body = [
    'A new sponsorship commitment has been paid in full.',
    '',
    '— THE ORDER —',
    ...lines.map((l) => `  ${l.qty > 1 ? `${l.qty} × ` : ''}${l.name}  ${money(l.total)}`),
    '',
    `  TOTAL PAID: ${money(total)}`,
    '',
    '— THE SPONSOR —',
    `  Company / Brand:       ${buyer.company}`,
    `  Authorized Signatory:  ${buyer.signatory}`,
    `  Email:                 ${buyer.email}`,
    `  Phone:                 ${buyer.phone}`,
    `  Signed:                ${buyer.signature}`,
    '',
    '— THE PAYMENT —',
    `  Square payment ID:     ${payment.id}`,
    `  Status:                ${payment.status}`,
    `  Receipt:               ${payment.receiptUrl || '(none)'}`,
  ].join('\n');

  return {
    to: recipients(),
    subject: `Earth Soirée — ${money(total)} commitment from ${buyer.company}`,
    text: body,
  };
}

/**
 * Hand the composed message to a mail transport.
 *
 * TODO (after the Hostinger deploy): replace the log with a real send —
 * nodemailer against the Hostinger mailbox, or a transactional API. The
 * message is already built; only this function needs to change.
 */
async function deliver(message) {
  console.log(
    `\n=== ORDER NOTIFICATION (not yet sent — no transport configured) ===\n` +
      `To: ${message.to.join(', ') || '(no ORDER_NOTIFICATION_EMAILS set)'}\n` +
      `Subject: ${message.subject}\n\n${message.text}\n` +
      `=== END ORDER NOTIFICATION ===\n`
  );
  return { sent: false, reason: 'no transport configured' };
}

export async function sendOrderNotification(order) {
  try {
    return await deliver(composeOrderEmail(order));
  } catch (e) {
    console.error('Order notification failed (the payment still succeeded):', e);
    return { sent: false, reason: e.message };
  }
}
