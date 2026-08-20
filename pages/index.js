import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import {
  sdgGoals,
  activations,
  patronTiers,
  PAYMENT_LINK,
} from '../lib/content-invitation';
import { computeTotal, pledgeKeys } from '../lib/pricing';
import { BUYER_FIELDS, validateBuyer } from '../lib/buyer';

const fmt = (n) => '$' + n.toLocaleString('en-US');

// "a Pearl Patron" / "an Emerald Patron"
const article = (name) => (/^[AEIOU]/.test(name) ? 'an ' : 'a ');

function tierLabel(total) {
  if (total === 0) return 'Select your activations above';
  let current = null;
  let next = null;
  for (const tier of patronTiers) {
    if (total >= tier.min) current = tier;
    else {
      next = tier;
      break;
    }
  }
  const standing = current ? current.name : 'Supporter';
  if (next) {
    return `${standing}  ·  only ${fmt(next.min - total)} more to ${article(next.name)}${next.name}`;
  }
  return current ? `${standing}  ·  highest standing` : standing;
}

export default function Invitation() {
  // id -> quantity. The pledge station tracks two mutually exclusive spots.
  const [selection, setSelection] = useState({});
  const [signDate, setSignDate] = useState('');

  // Set on the client only, so the server-rendered markup stays stable.
  useEffect(() => {
    const d = new Date();
    setSignDate(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`
    );
  }, []);

  // Buyer details travel with the payment, so they are React state rather
  // than uncontrolled inputs read out of the DOM.
  const [buyer, setBuyer] = useState({
    company: '',
    signatory: '',
    email: '',
    phone: '',
    signature: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const setField = (k) => (e) => {
    setBuyer((b) => ({ ...b, [k]: e.target.value }));
    // Clear a field's complaint as soon as the guest starts fixing it.
    setFormErrors((errs) => (errs[k] ? { ...errs, [k]: undefined } : errs));
  };

  // Handed to the checkout, which refuses to tokenize a card until this passes.
  const checkForm = () => validateBuyer(buyer);

  const showFormErrors = (errs) => {
    setFormErrors(errs);
    const first = BUYER_FIELDS.find((f) => errs[f.key]);
    if (first) document.getElementById(`o-${first.key}`)?.focus();
  };

  const [orderSent, setOrderSent] = useState(false);

  // The payment itself happens on Square's own page, where the sponsor types
  // the total shown above. Nothing comes back to us from there, so the order
  // is sent on the way out — otherwise we would never learn who committed to
  // what. The link is left to open as normal; only an incomplete form stops it.
  const [payError, setPayError] = useState('');

  const handleProceed = (e) => {
    // Nothing chosen means nothing to pay for — Square would be handed a blank
    // amount to type into.
    if (total <= 0) {
      e.preventDefault();
      setPayError('Choose at least one activation above before paying.');
      return;
    }

    const { valid, errors } = validateBuyer(buyer);
    if (!valid) {
      e.preventDefault();
      showFormErrors(errors);
      setPayError('Please complete and sign the order form above before paying.');
      return;
    }

    setPayError('');
    fetch('/api/submit-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selection, buyer, signDate }),
      keepalive: true, // survives the tab losing focus to Square
    })
      .then(() => setOrderSent(true))
      .catch(() => {});
  };

  // Same function the API route uses to price the order, so the figure shown
  // here and the figure charged cannot drift apart.
  const total = useMemo(() => computeTotal(selection), [selection]);

  // Drives the button's appearance only. The click handler re-checks, and the
  // API route checks again, so this is a hint rather than the gate.
  const ready = total > 0 && validateBuyer(buyer).valid;

  const toggle = (id) =>
    setSelection((s) => ({ ...s, [id]: s[id] ? 0 : 1 }));

  const setTickets = (id, qty) =>
    setSelection((s) => ({ ...s, [id]: s[id] === qty ? 0 : qty }));

  // Within one pledge card the two spots are mutually exclusive; the other
  // pledge card is untouched.
  const togglePledge = (a, key) => {
    const { p, g } = pledgeKeys(a);
    setSelection((s) => ({
      ...s,
      [p]: key === p ? (s[p] ? 0 : 1) : 0,
      [g]: key === g ? (s[g] ? 0 : 1) : 0,
    }));
  };

  const isChosen = (a) => {
    if (a.kind !== 'pledge') return Boolean(selection[a.id]);
    const { p, g } = pledgeKeys(a);
    return Boolean(selection[p] || selection[g]);
  };

  return (
    <>
      <Head>
        <title>The Earth Soirée — Invitation &amp; Sponsorship</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="The Earth Soirée on Rodeo Drive, Beverly Hills — an evening convened by GEMS World Dialogue in service of the 17 United Nations Sustainable Development Goals."
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Playfair+Display:ital,wght@0,600;0,700;0,800;0,900;1,600;1,700&family=Libre+Baskerville:wght@400;700&family=Dancing+Script:wght@600&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div id="invitation-page">
        <div className="combined">
          <div className="mast">
            <div className="conv">An Evening Convened by</div>
            <div className="lock">
              <img src="/images/invitation/gems-lockup.png" alt="GEMS" />
              <div className="wd">WORLD DIALOGUE</div>
              <div className="bh">&bull; BEVERLY HILLS &bull;</div>
            </div>
            <div className="ident">
              <span className="ename">The Earth Soir&eacute;e</span>
              <span className="etag">An Everly Evening in a Beverly Soir&eacute;e</span>
            </div>
            <div className="patron">
              <div className="pk">Under the Patronage of</div>
              <div className="pn">His Excellency Philippe Ziade</div>
              <div className="pt">
                Special Envoy to Europe, Africa &amp; the Middle East
              </div>
            </div>
          </div>

          <div className="hero">
            <img
              src="/images/invitation/hero-rodeo-drive.jpg"
              alt="A Holiday Evening on Rodeo Drive"
            />
            <div className="veil" />
            <div className="banner">For The First Time In History</div>
            <div className="cap">
              The World&rsquo;s Most Celebrated Street &mdash; In Service of the World
            </div>
          </div>

          <div className="titlewrap">
            <h1 className="title">
              <span className="l1">Luxury,</span>
              <span className="l2">In All Its Other Forms</span>
            </h1>
            <div className="place">On Rodeo Drive &middot; Beverly Hills</div>
            <p className="tagline">
              The most luxurious gem
              <br />
              on Earth — <b>is Earth.</b>
            </p>
            <p className="lead">
              For the first time in history, on one of the most famous streets in the
              world, luxury is honored in every form it takes — not only the rarest
              stone or the most coveted address, but{' '}
              <b>
                clean water, a full plate, a child in school, a future worth
                inheriting.
              </b>{' '}
              These are the gems no maison can cut, and the only ones we cannot
              replace. An evening for those who wear their wealth as purpose —
              convened in service of the{' '}
              <b>United Nations Sustainable Development Goals.</b>
            </p>
          </div>

          <div className="sdgblock">
            <div className="ey">In Service Of</div>
            <div className="hd">
              The 17 <b>United Nations</b>
              <br />
              Sustainable Development Goals
            </div>
            <div className="sdggrid">
              {sdgGoals.map((goal) => (
                <div className="goal" key={goal.n}>
                  <span className="num" style={{ background: goal.color }}>
                    {goal.n}
                  </span>
                  <span className="nm">{goal.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="program">
            <div className="phead">The Evening Unfolds In Three Acts</div>

            <div className="item">
              <div className="rn">I</div>
              <div>
                <h3>
                  The <span>Red Carpet</span> Arrival
                </h3>
                <p>
                  Champagne and conscience beneath the lights of Beverly Hills &mdash;
                  as a <em>Grammy Award&ndash;winning, world-renowned harpist</em>, who
                  has played for kings, presidents and the world&rsquo;s greatest
                  stages, plays the evening in.
                </p>
              </div>
            </div>

            <div className="item">
              <div className="rn">II</div>
              <div>
                <h3>
                  The <span>Luxury Diplomacy</span> Panel
                </h3>
                <p>
                  Convened with the Gems World Dialogue — maisons, nations and
                  guardians of the planet at one table, where the great houses and
                  heads of state align behind the Global Goals.
                </p>
              </div>
            </div>

            <div className="item">
              <div className="rn">III</div>
              <div>
                <h3>
                  The <span>Gems Earth</span> Awards
                  <span className="by">
                    Trophies by <span className="tif">TIFFANY&nbsp;&amp;&nbsp;CO.</span>
                  </span>
                </h3>
                <p>
                  Bestowed upon the icons of purpose — the visionaries advancing the 17
                  Global Goals. <em>Because the rarest luxury of all is legacy.</em>
                </p>
              </div>
            </div>
          </div>

          <div className="details">
            <div className="when">
              Tuesday <span className="dot">&middot;</span> 1 December{' '}
              <span className="dot">&middot;</span> 2026
            </div>
            <div className="hour">Doors open at 6:30 in the evening</div>
            <div className="addr">
              Two Rodeo Drive &middot; Beverly Hills &middot; California
            </div>
            <div className="dress">Black Tie — By Invitation Only</div>
          </div>

          <div className="foot">
            <div className="motto">Luxury, with purpose.</div>
            <div className="rsvp">
              R.S.V.P. <b>rsvp@gemsworlddialogue.com</b>
            </div>
            <div className="fine">
              A private evening held on the street of Rodeo Drive, Beverly Hills.
            </div>
          </div>

          <div className="pkg">
            <div className="pkg-head">
              <div className="pkg-eye">For Our Partners</div>
              <div className="pkg-title">Sponsorship Activations</div>
              <div className="pkg-orn">
                <span>&#9670;</span>
              </div>
            </div>

            <div className="intro">
              <div className="h">
                When the world&rsquo;s power players unite for good,{' '}
                <b>the media never looks away.</b>
              </div>
              <p>
                Each activation below is a physical, ownable piece of the night on Rodeo
                Drive &mdash; branded end to end.
              </p>
            </div>

            <div className="cards">
              {activations.map((a) => (
                <div
                  className={`card${isChosen(a) ? ' chosen' : ''}`}
                  key={a.id}
                >
                  <div className={`viz${a.titleSponsorOverlay ? ' tsviz' : ''}`}>
                    <img className="photo" src={a.image} alt={a.alt} />
                    {a.titleSponsorOverlay && (
                      <div className="tsblock">
                        <div className="tk">Official Title Sponsor</div>
                        <div className="tscript">The Cartier</div>
                        <div className="tmain">Earth Soir&eacute;e</div>
                        <div className="tsub">Rodeo Drive &middot; Beverly Hills</div>
                      </div>
                    )}
                    <div className="rn">{a.rn}</div>
                  </div>

                  <div className="body">
                    <div className="crow">
                      <div className="cname">
                        {a.name}
                        {a.nameSuffix && (
                          <span
                            style={{
                              fontFamily: "'Cormorant Garamond',serif",
                              fontStyle: 'italic',
                              fontWeight: 600,
                              fontSize: '20px',
                              color: 'var(--gold)',
                            }}
                          >
                            {' '}
                            {a.nameSuffix}
                          </span>
                        )}
                      </div>

                      <div className="pricewrap">
                        <div className="cprice">
                          {a.price}
                          {a.priceNote && (
                            <span style={{ fontSize: '14px', color: '#6f6456' }}>
                              {' '}
                              {a.priceNote}
                            </span>
                          )}
                        </div>

                        {a.kind === 'select' && (
                          <div
                            className={`selbtn${selection[a.id] ? ' on' : ''}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => toggle(a.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                toggle(a.id);
                              }
                            }}
                          >
                            <span className="bx">{selection[a.id] ? '✓' : ''}</span>
                            <span className="lb">
                              {selection[a.id] ? 'Selected' : 'Select'}
                            </span>
                          </div>
                        )}

                        {a.kind === 'pledge' &&
                          [
                            {
                              key: pledgeKeys(a).p,
                              label: a.presentingLabel,
                              amount: a.amount,
                            },
                            {
                              key: pledgeKeys(a).g,
                              label: a.guardianLabel,
                              amount: a.guardianAmount,
                            },
                          ].map((spot) => (
                            <div
                              key={spot.key}
                              className={`selbtn${selection[spot.key] ? ' on' : ''}`}
                              role="button"
                              tabIndex={0}
                              onClick={() => togglePledge(a, spot.key)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  togglePledge(a, spot.key);
                                }
                              }}
                            >
                              <span className="bx">{selection[spot.key] ? '✓' : ''}</span>
                              <span className="lb">
                                {spot.label} &middot; {fmt(spot.amount)}
                              </span>
                            </div>
                          ))}

                        {a.kind === 'tickets' && (
                          <div className="tixopts">
                            {Array.from({ length: a.maxTickets }, (_, i) => i + 1).map(
                              (qty) => (
                                <div
                                  key={qty}
                                  className={`tixopt${
                                    selection[a.id] === qty ? ' on' : ''
                                  }`}
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => setTickets(a.id, qty)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      setTickets(a.id, qty);
                                    }
                                  }}
                                >
                                  {qty}
                                  {qty === 1 ? ' Ticket' : ' Tickets'} &middot;{' '}
                                  {fmt(qty * a.amount)}
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="avail">{a.avail}</div>
                    <div
                      className="cdesc"
                      dangerouslySetInnerHTML={{ __html: a.desc }}
                    />
                    <div className="pdisc">{a.note}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="ordersign">
              <h2>Your Selection &mdash; Confirm &amp; Sign</h2>
              <div className="ordtot">
                <div>
                  <div className="l">Total Commitment</div>
                  <div className="tier">{tierLabel(total)}</div>
                </div>
                <div className="v">{fmt(total)}</div>
              </div>
              <div className="ofields">
                {BUYER_FIELDS.map((f) => (
                  <div
                    className={`ofld${f.className ? ' ' + f.className : ''}${
                      formErrors[f.key] ? ' bad' : ''
                    }`}
                    key={f.key}
                  >
                    <label htmlFor={`o-${f.key}`}>
                      {f.label} <span className="req">*</span>
                    </label>
                    <input
                      id={`o-${f.key}`}
                      type={f.type || 'text'}
                      placeholder={f.placeholder}
                      value={buyer[f.key]}
                      onChange={setField(f.key)}
                      aria-invalid={formErrors[f.key] ? 'true' : undefined}
                    />
                    {formErrors[f.key] && <div className="ferr">{formErrors[f.key]}</div>}
                  </div>
                ))}
                <div className="ofld">
                  <label htmlFor="o-date">Date</label>
                  <input
                    id="o-date"
                    type="date"
                    value={signDate}
                    onChange={(e) => setSignDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="paywrap">
                <a
                  className={`paybtn${ready ? '' : ' notready'}`}
                  href={PAYMENT_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleProceed}
                  aria-disabled={ready ? undefined : 'true'}
                >
                  Proceed to Secure Payment &rarr;
                </a>
                {payError && <div className="payerr">{payError}</div>}
                <div className="paynote">
                  Opens your secure Square checkout &mdash; enter the Total Commitment
                  shown above.
                </div>
                {orderSent && (
                  <div className="paysent">
                    Your selection has been sent to us &mdash; complete the payment in
                    the Square window.
                  </div>
                )}
              </div>
            </div>

            <div className="foot">
              <div className="m">Reserve yours before the carpet is rolled.</div>
              <div className="c">
                Partnerships &middot; <b>rsvp@gemsworlddialogue.com</b>
              </div>
              <div className="f">
                GEMS World Dialogue &middot; Dialogue in Action &middot; Beverly Hills
              </div>
              <div className="disc">
                All brand names and logos shown in this document are placeholders, used
                solely to help visualize the concept, and do not imply any partnership
                or endorsement.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
