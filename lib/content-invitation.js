// Content for the Earth Soirée invitation & sponsorship page (/invitation).
// Extracted from the GEMS Earth Soirée flyer handoff.

export const sdgGoals = [
  { n: '01', color: '#E5243B', name: 'No Poverty' },
  { n: '02', color: '#DDA63A', name: 'Zero Hunger' },
  { n: '03', color: '#4C9F38', name: 'Good Health & Well-Being' },
  { n: '04', color: '#C5192D', name: 'Quality Education' },
  { n: '05', color: '#FF3A21', name: 'Gender Equality' },
  { n: '06', color: '#26BDE2', name: 'Clean Water & Sanitation' },
  { n: '07', color: '#FCC30B', name: 'Affordable & Clean Energy' },
  { n: '08', color: '#A21942', name: 'Decent Work & Growth' },
  { n: '09', color: '#FD6925', name: 'Industry & Innovation' },
  { n: '10', color: '#DD1367', name: 'Reduced Inequalities' },
  { n: '11', color: '#FD9D24', name: 'Sustainable Cities' },
  { n: '12', color: '#BF8B2E', name: 'Responsible Consumption' },
  { n: '13', color: '#3F7E44', name: 'Climate Action' },
  { n: '14', color: '#0A97D9', name: 'Life Below Water' },
  { n: '15', color: '#56C02B', name: 'Life on Land' },
  { n: '16', color: '#00689D', name: 'Peace & Justice' },
  { n: '17', color: '#19486A', name: 'Partnerships for the Goals' },
];

const PLACEHOLDER_NOTE =
  'All brand names and logos shown are placeholders to help visualize the concept and do not imply any partnership or endorsement.';

// `select` = single on/off choice, `pledge` = the presenting spot OR one of the
// supporting spots (mutually exclusive, keyed `<id>_p` / `<id>_g`),
// `tickets` = quantity of 1–6 seats.
export const activations = [
  {
    id: 'title',
    rn: '01',
    image: '/images/invitation/01-title-sponsor.jpg',
    alt: 'Official Title Sponsor',
    titleSponsorOverlay: true,
    name: 'Official Title Sponsor',
    price: '$35,000',
    avail: 'One only',
    amount: 35000,
    kind: 'select',
    desc:
      'One name, and the night becomes theirs. The title sponsor does not attend the evening &mdash; they preside over it: the patron whose name the whole occasion is spoken in. From the first headline to the last broadcast, the world calls it <b>&ldquo;the [Your Brand] Earth Soir&eacute;e on Rodeo Drive&rdquo;</b> &mdash; the way the great houses lend their name to a cup, a race, a season. Not a logo beside the night, but the name the night is <b>remembered by</b>. To hold the title is to hold the evening itself &mdash; and everything the cameras carry out into the world.',
    note: PLACEHOLDER_NOTE,
  },
  {
    id: 'diplomacy',
    rn: '02',
    image: '/images/invitation/02-diplomacy-panel.jpg',
    alt: 'The Luxury Diplomacy Panel',
    name: 'The Luxury Diplomacy Panel',
    price: '$25,000',
    avail:
      'Choose your place — one Presenting Patron spot · four Supporting House spots',
    amount: 25000,
    guardianAmount: 5000,
    kind: 'pledge',
    presentingLabel: 'Presenting Patron',
    guardianLabel: 'Supporting House',
    desc:
      'Own the room where nations and maisons meet. The evening’s marquee conversation — heads of state, great houses and guardians of the planet at one table — convened, and <b>fueled by [Your Brand]</b>. Your name opens the panel, sits on the stage, and rides every story written about what was said. Others buy visibility; this buys <b>authority</b> — a brand seen not as a logo, but as a statesman. The panel carries five names only: one <b>Presenting Patron</b>, whose mark opens the conversation and rides every story written about what was said, and four <b>Supporting Houses</b> beside it.',
    note: PLACEHOLDER_NOTE,
  },
  {
    id: 'sdg',
    rn: '03',
    image: '/images/invitation/03-sdg-pledge-station.jpg',
    alt: 'The SDG Pledge Station',
    name: 'The SDG Pledge Station',
    price: '$25,000',
    avail: 'Choose your place — one Presenting Patron spot · four Guardian spots',
    amount: 25000,
    guardianAmount: 5000,
    kind: 'pledge',
    presentingLabel: 'Presenting Patron',
    guardianLabel: 'Guardian of the Goals',
    desc:
      'Every guest steps to the luminous arch, chooses a Global Goal, and pledges it on camera &mdash; the engine room of the evening&rsquo;s press. The arch carries five names only: one <b>Presenting Patron</b>, whose mark crowns the station and rides every frame filmed before it, and four <b>Guardians of the Goals</b> beside it &mdash; the houses the night remembers as the ones who drove the 17 forward.',
    note: PLACEHOLDER_NOTE,
  },
  {
    id: 'mirror',
    rn: '04',
    image: '/images/invitation/04-mirror.jpg',
    alt: 'The Mirror Moment',
    name: 'The Mirror',
    price: '$15,000',
    avail: 'One available, fully branded',
    amount: 15000,
    kind: 'select',
    desc:
      'What is the first thing every guest wants the moment the limousine door opens &mdash; gown on, black tie set, cameras already watching? A mirror. And <b>no red carpet in the world has ever offered one.</b> We will &mdash; framed in your brand. Two cameras, one through the glass and one facing them, capture the pause: that unguarded second every VIP takes to perfect themselves before the walk begins. It becomes the night&rsquo;s most magnetic highlight reel &mdash; and <b>your brand’s name is on the mirror all of them are looking into.</b>',
    note: PLACEHOLDER_NOTE,
  },
  {
    id: 'panels',
    rn: '05',
    image: '/images/invitation/05-exceptional-few.jpg',
    alt: 'The Exceptional Few',
    name: 'The Exceptional Few',
    nameSuffix: '— Panels',
    price: '$10,000',
    avail: 'Per panel · 10 each side of the carpet',
    amount: 10000,
    kind: 'select',
    desc:
      'History remembers names, not just logos. A luminous colonnade lines the carpet &mdash; the faces of those who chose to lead when leading was optional, each bound to a Global Goal they carry forward. <b>To walk it is to walk among conviction made visible</b>; to belong to it is to be counted, that night and in the record that endures, among the exceptional few.',
    note: PLACEHOLDER_NOTE,
  },
  {
    id: 'stepr',
    rn: '06',
    image: '/images/invitation/06-step-and-repeat.jpg',
    alt: 'The Step and Repeat',
    name: 'The Step & Repeat',
    price: '$10,000',
    avail: 'Per logo · 10 logos on a 20-ft wall',
    amount: 10000,
    kind: 'select',
    desc:
      'The wall every camera shoots against. A step-and-repeat never prints a logo once — it tiles each mark again and again across the full twenty feet, so a brand lands in frame wherever a guest happens to stand. <b>Only ten brands share the wall</b>, each repeating without end, in every posed photograph that leaves the night.',
    note: PLACEHOLDER_NOTE,
  },
  {
    id: 'coffret',
    rn: '07',
    image: '/images/invitation/07-coffret.jpg',
    alt: 'The Coffret',
    name: 'The Coffret',
    price: '$2,500',
    priceNote: 'per placement',
    avail: 'Ten placements available · one hundred coffrets, one for each guest',
    amount: 2500,
    kind: 'select',
    desc:
      'As the night closes, each one of our 100 by-invitation-only esteemed guests departs with the Coffret &mdash; a curated case of gifts including a <b>Louis Vuitton card holder in Monogram coated canvas</b>, presented in its maison box with ribbon. A placement of your product in the Coffret positions your name as <b>part of the evening&rsquo;s final gesture</b> &mdash; carried out beneath the lights of Rodeo Drive, opened in one hundred of the most influential households in Beverly Hills, and kept long after the night becomes a story.',
    note: PLACEHOLDER_NOTE,
  },
  {
    id: 'pedestal',
    rn: '08',
    image: '/images/invitation/08-maison-pedestal.jpg',
    alt: 'The Maison Pedestal',
    name: 'The Maison Pedestal',
    price: '$1,500',
    avail: 'Ten available · $1,500 each',
    amount: 1500,
    kind: 'select',
    desc:
      'A sculpted pedestal on the carpet itself, crowned with your emblem carved in three dimensions &mdash; the way the great houses present their icons. Ten pedestals line the walk like statuary, each one a maison&rsquo;s mark rendered as art, standing in the frame of every arrival photograph on Rodeo Drive.',
    note: PLACEHOLDER_NOTE,
  },
  {
    id: 'tickets',
    rn: '09',
    image: '/images/invitation/09-evening-tickets.jpg',
    alt: 'Evening Tickets',
    name: 'The Evening — Tickets',
    price: '$500',
    priceNote: 'per guest',
    avail: 'Choose your party of one to six',
    amount: 500,
    kind: 'tickets',
    maxTickets: 6,
    desc:
      'A place at the heart of the evening &mdash; champagne and hors d&rsquo;oeuvres beneath the lights of Rodeo Drive, the strings of a Grammy Award&ndash;winning, world-renowned harpist, the Luxury Diplomacy Panel, the GEMS Earth Awards, and a pledge of your own before the night ends. Black tie.',
    note: PLACEHOLDER_NOTE,
  },
];

export const patronTiers = [
  { min: 15000, name: 'Pearl Patron' },
  { min: 50000, name: 'Ruby Patron' },
  { min: 100000, name: 'Sapphire Patron' },
  { min: 200000, name: 'Emerald Patron' },
  { min: 300000, name: 'Diamond Patron' },
];

export const PAYMENT_LINK = 'https://square.link/u/wia66lA8';
