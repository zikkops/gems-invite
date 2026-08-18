import { randomUUID } from 'crypto';
import { computeTotal, normalizeSelection, summarize } from '../../lib/pricing';
import { normalizeBuyer, validateBuyer } from '../../lib/buyer';
import { sendOrderNotification } from '../../lib/notify';
import { squareConfig, squareFetch } from '../../lib/square-server';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const { accessToken, locationId, currency } = squareConfig();
  if (!accessToken || !locationId) {
    return res.status(503).json({
      error:
        'Payments are not configured on this server. Set SQUARE_ACCESS_TOKEN and SQUARE_LOCATION_ID.',
    });
  }

  const { sourceId, verificationToken, selection, buyer } = req.body || {};
  if (!sourceId || typeof sourceId !== 'string') {
    return res.status(400).json({ error: 'Missing card token.' });
  }

  // The browser's total is never trusted — it is recomputed from the selection.
  const chosen = normalizeSelection(selection);
  const total = computeTotal(chosen);
  if (total <= 0) {
    return res.status(400).json({ error: 'Select at least one activation before paying.' });
  }

  // The signed order form is part of the deal, not a nicety — no complete
  // form, no charge.
  const details = normalizeBuyer(buyer);
  const { valid, errors } = validateBuyer(details);
  if (!valid) {
    return res.status(400).json({
      error: 'Please complete the order form before paying.',
      fields: errors,
    });
  }

  const { company, signatory, email } = details;
  const note = [company || signatory, summarize(chosen)].filter(Boolean).join(' — ').slice(0, 500);

  let ok, body;
  try {
    ({ ok, body } = await squareFetch('/v2/payments', {
      body: {
        idempotency_key: randomUUID(),
        source_id: sourceId,
        ...(verificationToken ? { verification_token: verificationToken } : {}),
        location_id: locationId,
        amount_money: { amount: total * 100, currency }, // Square works in the smallest unit
        autocomplete: true,
        note,
        ...(email ? { buyer_email_address: email } : {}),
        ...(company ? { reference_id: company.slice(0, 40) } : {}),
      },
    }));
  } catch (e) {
    // Network-level failure: the card was never charged.
    console.error('Square request failed:', e);
    return res.status(502).json({ error: 'Square could not be reached. No charge was made.' });
  }

  if (!ok) {
    const detail = body?.errors?.[0];
    // Square's own message is safe to show — it is written for cardholders.
    console.error('Square payment failed:', JSON.stringify(body?.errors || body));
    return res.status(402).json({
      error: detail?.detail || 'The payment could not be completed. Please try another card.',
      code: detail?.code || null,
    });
  }

  const payment = body?.payment || {};
  const result = {
    id: payment.id,
    status: payment.status,
    receiptUrl: payment.receipt_url || null,
  };

  // The money is already taken, so this is best-effort by design — it logs
  // rather than throws, and the guest sees success either way.
  await sendOrderNotification({
    buyer: details,
    selection: chosen,
    total,
    payment: result,
  });

  return res.status(200).json({
    ok: true,
    paymentId: result.id,
    status: result.status,
    receiptUrl: result.receiptUrl,
    amount: total,
  });
}
