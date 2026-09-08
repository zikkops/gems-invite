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

function privateKey() {
  let v = String(process.env.FIREBASE_PRIVATE_KEY || '');

  // Some dashboards wrap the whole value in quotes.
  v = v.replace(/^(['"])([\s\S]*)\1$/, '$2');

  // Hostinger's environment panel escapes shell-special characters on the way
  // in — the same thing that turned the SMTP password's `$` into `\$`. Applied
  // to a key whose lines are separated by literal `\n`, it delivers `\\n`, and
  // the unescape below would then leave a stray backslash at the head of every
  // line. The key looks present and parses as nothing: app/invalid-credential.
  v = v.replace(/\\\\n/g, '\\n');

  // The ordinary case: literal `\n` standing in for the real line breaks. A key
  // pasted with real newlines passes through untouched.
  v = v.replace(/\\n/g, '\n');

  return v;
}

/**
 * Does the key have the shape of one? Checked before Firebase is handed it,
 * because "configured" and "usable" are not the same thing — a mangled key is
 * present, non-empty, and completely useless.
 */
export function privateKeyLooksValid() {
  const v = privateKey();
  return (
    v.startsWith('-----BEGIN PRIVATE KEY-----') &&
    v.trimEnd().endsWith('-----END PRIVATE KEY-----') &&
    // A real key runs to ~28 base64 lines; a mangled one collapses to one or two.
    v.split('\n').filter(Boolean).length > 5 &&
    // Nothing in a decoded key is a backslash. One left over means the
    // unescaping above did not fully undo what the panel did.
    !v.includes('\\')
  );
}

/** True when the service account is configured AND the key survived the trip. */
export function isConfigured() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY &&
      privateKeyLooksValid()
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
