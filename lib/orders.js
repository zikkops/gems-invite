// Sponsorship orders, written to the shared GEMS Firestore.
//
// The sponsor pays on Square's hosted page, which reports nothing back here, so
// this document is the only record the organisation holds of who committed to
// what. It is written before the sponsor leaves for Square, and its status says
// plainly that the money has not been confirmed — reconcile against Square.

import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, isConfigured } from './firebase/admin';
import { lineItems } from './pricing';

export const SOURCE = 'gems-invitation';
export const COLLECTION = 'orders';

export { isConfigured as firestoreConfigured };

/**
 * Write one order. Never throws: the sponsor is on their way to pay and must
 * not be stopped by our database. Returns { saved, id } or { saved:false, reason }.
 */
export async function saveOrder({ buyer, selection, total, signDate, meta }) {
  if (!isConfigured()) return { saved: false, reason: 'firebase not configured' };

  try {
    const doc = {
      source: SOURCE,
      type: 'sponsorship',
      // Not `paid` — Square tells us nothing, so an admin confirms this.
      status: 'awaiting-payment',

      company: buyer.company,
      signatory: buyer.signatory,
      name: buyer.signatory, // matches the `submissions` shape the console reads
      email: buyer.email,
      phone: buyer.phone,
      signature: buyer.signature,
      signedOn: signDate || null,

      total,
      currency: 'USD',
      items: lineItems(selection).map((l) => ({
        name: l.name,
        qty: l.qty,
        total: l.total,
      })),
      selection,

      createdAt: FieldValue.serverTimestamp(),
      ...(meta ? { meta } : {}),
    };

    const ref = await adminDb().collection(COLLECTION).add(doc);
    console.log(`Order ${ref.id} saved to Firestore (${SOURCE}, $${total}).`);
    return { saved: true, id: ref.id };
  } catch (e) {
    // Loud, because this is the record of a commitment we may have just lost.
    console.error('ORDER NOT SAVED TO FIRESTORE:', e);
    return { saved: false, reason: e.message };
  }
}
