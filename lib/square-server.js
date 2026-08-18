// Server-side Square configuration. Everything here reads from the process
// environment and must never be imported from a page or component — the
// access token is a secret and would be inlined into the client bundle.

const HOSTS = {
  sandbox: 'https://connect.squareupsandbox.com',
  production: 'https://connect.squareup.com',
};

// Pinned so a Square API change cannot alter the shape of our requests.
export const SQUARE_API_VERSION = '2025-01-23';

export function squareConfig() {
  const environment =
    (process.env.SQUARE_ENVIRONMENT || 'sandbox').trim().toLowerCase() === 'production'
      ? 'production'
      : 'sandbox';

  return {
    environment,
    host: HOSTS[environment],
    accessToken: process.env.SQUARE_ACCESS_TOKEN || '',
    locationId: process.env.SQUARE_LOCATION_ID || process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || '',
    currency: process.env.SQUARE_CURRENCY || 'USD',
  };
}

/** Call the Square Connect API and return { ok, status, body }. */
export async function squareFetch(path, { method = 'POST', body } = {}) {
  const { host, accessToken } = squareConfig();

  const res = await fetch(`${host}${path}`, {
    method,
    headers: {
      'Square-Version': SQUARE_API_VERSION,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  return { ok: res.ok, status: res.status, body: payload };
}
