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

import nodemailer from 'nodemailer';
import { lineItems } from './pricing';

const money = (n) => '$' + n.toLocaleString('en-US');

// Sponsor-supplied text goes into an HTML email, so it is escaped on the way in.
const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );

/** Who gets told about a new order. Comma-separated in the environment. */
export function recipients() {
  return (process.env.ORDER_NOTIFICATION_EMAILS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function composeOrderEmail({ buyer, selection, total, payment, pending }) {
  const lines = lineItems(selection);

  // The sponsor pays on Square's hosted page, so at the moment we send this the
  // payment has been started, not confirmed. Say so rather than claim money we
  // cannot see has arrived.
  const opener = pending
    ? 'A sponsor has signed their selection and been sent to Square to pay.'
    : 'A new sponsorship commitment has been paid in full.';
  const totalLabel = pending ? 'TOTAL TO COLLECT' : 'TOTAL PAID';

  const body = [
    opener,
    '',
    '— THE ORDER —',
    ...lines.map((l) => `  ${l.qty > 1 ? `${l.qty} × ` : ''}${l.name}  ${money(l.total)}`),
    '',
    `  ${totalLabel}: ${money(total)}`,
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

  const row = (label, value) =>
    `<tr><td style="padding:4px 16px 4px 0;color:#6f6456;white-space:nowrap">${label}</td>` +
    `<td style="padding:4px 0;color:#2b2b2b"><b>${esc(value)}</b></td></tr>`;

  const html = `
<div style="font-family:Georgia,'Times New Roman',serif;max-width:640px;margin:0 auto;color:#2b2b2b">
  <div style="background:#0c1730;color:#e9cf93;padding:20px 26px">
    <div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase">New Commitment</div>
    <div style="font-size:26px;margin-top:4px">The Earth Soir&eacute;e</div>
  </div>
  <div style="padding:22px 26px;border:1px solid #e3dccd;border-top:none">
    <p>${
      pending
        ? 'A sponsor has signed their selection and been sent to Square to pay. <b>Confirm the payment in your Square dashboard.</b>'
        : 'A new sponsorship commitment has been <b>paid in full</b>.'
    }</p>

    <h3 style="color:#b8111f;margin-bottom:6px">The Order</h3>
    <table style="width:100%;border-collapse:collapse">
      ${lines
        .map(
          (l) =>
            `<tr><td style="padding:6px 0;border-bottom:1px solid #eee">${
              l.qty > 1 ? `${l.qty} &times; ` : ''
            }${esc(l.name)}</td>` +
            `<td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">${money(
              l.total
            )}</td></tr>`
        )
        .join('')}
      <tr><td style="padding:10px 0;font-size:18px"><b>${pending ? 'Total to collect' : 'Total paid'}</b></td>
      <td style="padding:10px 0;text-align:right;font-size:18px"><b>${money(total)}</b></td></tr>
    </table>

    <h3 style="color:#b8111f;margin-bottom:6px">The Sponsor</h3>
    <table style="border-collapse:collapse">
      ${row('Company / Brand', buyer.company)}
      ${row('Authorized Signatory', buyer.signatory)}
      ${row('Email', buyer.email)}
      ${row('Phone', buyer.phone)}
      ${row('Signed', buyer.signature)}
    </table>

    <h3 style="color:#b8111f;margin-bottom:6px">The Payment</h3>
    <table style="border-collapse:collapse">
      ${row('Square payment ID', payment.id)}
      ${row('Status', payment.status)}
    </table>
    ${
      payment.receiptUrl
        ? `<p><a href="${esc(payment.receiptUrl)}" style="color:#b8111f">View the Square receipt</a></p>`
        : ''
    }
  </div>
</div>`.trim();

  return {
    to: recipients(),
    replyTo: buyer.email || undefined,
    subject: `Earth Soirée — ${money(total)} commitment from ${buyer.company}${
      pending ? ' (payment pending)' : ''
    }`,
    text: body,
    html,
  };
}

/** SMTP settings, or null when the mailbox has not been configured yet. */
export function smtpConfig() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  // 465 is implicit TLS; 587 upgrades with STARTTLS.
  const port = Number(process.env.SMTP_PORT || 465);

  return {
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    // Hostinger rejects a From that is not the authenticated mailbox, so the
    // sender defaults to the account we log in as.
    from: process.env.SMTP_FROM || `Earth Soiree <${user}>`,
  };
}

/** Hand the composed message to the mail transport. */
async function deliver(message) {
  const smtp = smtpConfig();

  if (!smtp || message.to.length === 0) {
    const why = !smtp ? 'no SMTP credentials' : 'no ORDER_NOTIFICATION_EMAILS set';
    console.log(
      `\n=== ORDER NOTIFICATION (not sent — ${why}) ===\n` +
        `To: ${message.to.join(', ') || '(nobody)'}\n` +
        `Subject: ${message.subject}\n\n${message.text}\n` +
        `=== END ORDER NOTIFICATION ===\n`
    );
    return { sent: false, reason: why };
  }

  const { from, ...transportOptions } = smtp;
  const transport = nodemailer.createTransport(transportOptions);

  const info = await transport.sendMail({
    from,
    to: message.to.join(', '),
    subject: message.subject,
    text: message.text,
    html: message.html,
    // A reply goes straight back to the sponsor.
    ...(message.replyTo ? { replyTo: message.replyTo } : {}),
  });

  console.log(`Order notification sent to ${message.to.join(', ')} (${info.messageId})`);
  return { sent: true, messageId: info.messageId, accepted: info.accepted };
}

export async function sendOrderNotification(order) {
  try {
    return await deliver(composeOrderEmail(order));
  } catch (e) {
    // The card is already charged by now. Log loudly — this line is the record
    // of an order whose notification did not arrive — and report success anyway.
    console.error('ORDER NOTIFICATION FAILED (the payment still succeeded):', e);
    console.error('Unnotified order:', JSON.stringify(order));
    return { sent: false, reason: e.message };
  }
}

/** Send a sample order to the configured recipients, to prove the mailbox works. */
export async function sendTestNotification() {
  return deliver(
    composeOrderEmail({
      buyer: {
        company: 'Test Maison (sample order)',
        signatory: 'Test Signatory',
        email: 'test@example.com',
        phone: '+1 310 555 0100',
        signature: 'Test Signatory',
      },
      selection: { mirror: 1, tickets: 2 },
      total: 16000,
      payment: { id: 'TEST-NO-PAYMENT-WAS-MADE', status: 'TEST', receiptUrl: null },
    })
  );
}
