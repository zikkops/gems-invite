// The sponsor pays on Square's own hosted page, typing in the total this page
// showed them. Square tells us nothing about that, so this is the only moment
// we learn what was selected — the order is emailed on the way out, before the
// checkout tab takes over.

import { computeTotal, normalizeSelection } from '../../lib/pricing';
import { normalizeBuyer, validateBuyer } from '../../lib/buyer';
import { sendOrderNotification } from '../../lib/notify';
import { saveOrder } from '../../lib/orders';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const { selection, buyer, signDate } = req.body || {};

  const chosen = normalizeSelection(selection);
  const total = computeTotal(chosen);
  if (total <= 0) {
    return res.status(400).json({ error: 'Select at least one activation first.' });
  }

  const details = normalizeBuyer(buyer);
  const { valid, errors } = validateBuyer(details);
  if (!valid) {
    return res.status(400).json({ error: 'Please complete the order form.', fields: errors });
  }

  // Firestore is the durable record; the email is the alert. Both are
  // best-effort and neither may stop the sponsor reaching Square, so they run
  // together and their failures are reported, not thrown.
  const [stored, notified] = await Promise.all([
    saveOrder({
      buyer: details,
      selection: chosen,
      total,
      signDate,
      meta: {
        ip:
          (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
          req.socket?.remoteAddress ||
          null,
        userAgent: req.headers['user-agent'] || null,
        referer: req.headers.referer || null,
      },
    }),
    sendOrderNotification({
      buyer: details,
      selection: chosen,
      total,
      pending: true,
      // No Square payment exists yet — the sponsor is only now being sent to pay.
      payment: {
        id: 'none yet — collected on Square checkout',
        status: `AWAITING PAYMENT${signDate ? ` · signed ${signDate}` : ''}`,
        receiptUrl: null,
      },
    }),
  ]);

  return res.status(200).json({
    ok: true,
    total,
    orderId: stored.id || null,
    saved: stored.saved,
    notified: notified.sent,
  });
}
