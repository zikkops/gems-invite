import { useEffect, useRef, useState } from 'react';

// Both ids are publishable — Square treats them as client-side identifiers.
const APP_ID = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || '';
const LOCATION_ID = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || '';

// Sandbox application ids are prefixed by Square, so the right SDK build and
// the right badge follow from the id alone — one less variable to keep in sync.
const isSandbox = APP_ID.startsWith('sandbox-');
const SDK_SRC = isSandbox
  ? 'https://sandbox.web.squarecdn.com/v1/square.js'
  : 'https://web.squarecdn.com/v1/square.js';

export const squareConfigured = Boolean(APP_ID && LOCATION_ID);

/** Load the Web Payments SDK once, however many times this mounts. */
function loadSquareSdk() {
  if (window.Square) return Promise.resolve(window.Square);

  const existing = document.querySelector(`script[src="${SDK_SRC}"]`);
  const script = existing || document.createElement('script');

  const done = new Promise((resolve, reject) => {
    script.addEventListener('load', () => resolve(window.Square));
    script.addEventListener('error', () => reject(new Error('Square could not be reached.')));
  });

  if (!existing) {
    script.src = SDK_SRC;
    script.async = true;
    document.head.appendChild(script);
  }
  return done;
}

export default function SquareCheckout({ total, selection, buyer, validate, onInvalid }) {
  const containerRef = useRef(null);
  const cardRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let card;

    (async () => {
      try {
        const Square = await loadSquareSdk();
        if (cancelled) return;

        const payments = Square.payments(APP_ID, LOCATION_ID);
        card = await payments.card({
          style: {
            input: { fontSize: '16px', color: '#2b2b2b' },
            '.input-container': { borderColor: '#b08a3e', borderRadius: '6px' },
            '.input-container.is-focus': { borderColor: '#b8111f' },
            '.message-text.is-error': { color: '#b8111f' },
          },
        });
        if (cancelled) {
          card.destroy();
          return;
        }
        await card.attach(containerRef.current);
        cardRef.current = card;
        setReady(true);
      } catch (e) {
        if (!cancelled) setError(e.message || 'The card form could not be loaded.');
      }
    })();

    return () => {
      cancelled = true;
      const c = cardRef.current || card;
      cardRef.current = null;
      if (c) c.destroy();
    };
  }, []);

  async function pay() {
    if (!cardRef.current || busy) return;
    setError('');

    // The order form is checked before the card is even tokenized, so an
    // incomplete form never reaches Square.
    if (validate) {
      const { valid, errors } = validate();
      if (!valid) {
        onInvalid?.(errors);
        setError('Please complete the order form above before paying.');
        return;
      }
    }

    setBusy(true);

    try {
      const tokenResult = await cardRef.current.tokenize();
      if (tokenResult.status !== 'OK') {
        throw new Error(
          tokenResult.errors?.[0]?.message || 'Please check the card details and try again.'
        );
      }

      // The server recomputes the amount from `selection`; `total` here is
      // only what the guest was shown.
      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId: tokenResult.token, selection, buyer }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.fields) onInvalid?.(data.fields);
        throw new Error(data.error || 'The payment could not be completed.');
      }

      setResult(data);
    } catch (e) {
      setError(e.message || 'Something went wrong. No charge was made.');
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="payok">
        <div className="h">Thank you — your commitment is confirmed.</div>
        <div className="s">
          ${result.amount.toLocaleString('en-US')} received · payment {result.paymentId}
        </div>
        {result.receiptUrl && (
          <a href={result.receiptUrl} target="_blank" rel="noopener noreferrer">
            View your Square receipt
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="paycard">
      <div className="paycard-label">Card details</div>
      <div ref={containerRef} className="sqcard" />

      {error && <div className="payerr">{error}</div>}

      <button
        type="button"
        className="paybtn"
        onClick={pay}
        disabled={!ready || busy || total <= 0}
      >
        {busy
          ? 'Processing…'
          : total > 0
            ? `Pay $${total.toLocaleString('en-US')}`
            : 'Select your activations above'}
      </button>

      <div className="paynote">
        Card details are entered in fields hosted by Square and never touch this site.
        {isSandbox && ' · Sandbox mode — no real money moves.'}
      </div>
    </div>
  );
}
