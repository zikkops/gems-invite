// Server-side Firebase, copied from gems-website's lib/firebase/admin.js.
//
// One Firebase project backs the whole of GEMS. This app writes sponsorship
// orders into the same Firestore the website's admin console reads, tagged
// `source: 'gems-invitation'` so the console can tell the properties apart.
// The Admin SDK bypasses security rules, which is why the shared
// `firestore.rules` can deny every client read and write outright.
//
// The browser never touches Firestore — only API routes import this.
import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Environment editors mangle PEM keys in different ways, so accept them all:
 * a one-line value with literal "\n" two-character sequences (Vercel, hPanel),
 * a value wrapped in quotes, or a real multi-line key from a local .env.local.
 */
function privateKey() {
  const raw = process.env.FIREBASE_PRIVATE_KEY || '';
  const unquoted = raw.trim().replace(/^"([\s\S]*)"$/, '$1');
  return unquoted.replace(/\n/g, '\n');
}

/** True when the service account is configured — lets routes fail politely. */
export function isConfigured() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
  );
}

// Next.js reuses the module across requests (and hot-reloads it in dev), so the
// app is created once and looked up thereafter.
function app() {
  if (getApps().length) return getApp();
  if (!isConfigured()) {
    throw new Error(
      'Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.'
    );
  }
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey(),
    }),
  });
}

export const adminDb = () => getFirestore(app());
