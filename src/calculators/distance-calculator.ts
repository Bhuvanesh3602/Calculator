import { num } from '../lib/format';
import type { Calculator, Values } from '../lib/types';

/** Approximate city-centre coordinates (decimal degrees). */
export const CITIES: Record<string, [string, number, number]> = {
  nyc: ['New York', 40.7128, -74.006],
  la: ['Los Angeles', 34.0522, -118.2437],
  chi: ['Chicago', 41.8781, -87.6298],
  hou: ['Houston', 29.7604, -95.3698],
  mia: ['Miami', 25.7617, -80.1918],
  sea: ['Seattle', 47.6062, -122.3321],
  den: ['Denver', 39.7392, -104.9903],
  atl: ['Atlanta', 33.749, -84.388],
  sf: ['San Francisco', 37.7749, -122.4194],
  dc: ['Washington, DC', 38.9072, -77.0369],
  tor: ['Toronto', 43.6532, -79.3832],
  lon: ['London', 51.5074, -0.1278],
  par: ['Paris', 48.8566, 2.3522],
  dxb: ['Dubai', 25.2048, 55.2708],
  del: ['New Delhi', 28.6139, 77.209],
  bom: ['Mumbai', 19.076, 72.8777],
  sin: ['Singapore', 1.3521, 103.8198],
  tyo: ['Tokyo', 35.6762, 139.6503],
  syd: ['Sydney', -33.8688, 151.2093],
  custom: ['Custom coordinates', 0, 0],
};
const R_KM = 6371.0088; // mean Earth radius (IUGG)

export function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const r = Math.PI / 180;
  const dLat = (lat2 - lat1) * r,
    dLon = (lon2 - lon1) * r;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}
export function bearing(lat1: number, lon1: number, lat2: number, lon2: number) {
  const r = Math.PI / 180;
  const y = Math.sin((lon2 - lon1) * r) * Math.cos(lat2 * r);
  const x = Math.cos(lat1 * r) * Math.sin(lat2 * r) - Math.sin(lat1 * r) * Math.cos(lat2 * r) * Math.cos((lon2 - lon1) * r);
  return ((Math.atan2(y, x) / r) + 360) % 360;
}
const pt = (v: Values, k: 'from' | 'to') => (v[k] === 'custom' ? [+v[k + 'Lat'], +v[k + 'Lon']] : CITIES[v[k]].slice(1)) as [number, number];
const opts = Object.entries(CITIES).map(([value, c]) => ({ value, label: c[0] }));
const compass = (d: number) => ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(d / 45) % 8];

const calc: Calculator = {
  slug: 'distance-calculator',
  name: 'Distance Calculator',
  short: 'Distance',
  category: 'construction',
  keyword: 'distance calculator',
  volume: 165000,
  variants: ['distance between cities', 'as the crow flies calculator', 'flight distance calculator', 'latitude longitude distance calculator'],
  title: 'Distance Calculator – Straight-Line Distance Between Cities',
  description:
    'Find the straight-line (great-circle) distance between two cities or coordinates in miles, km and nautical miles, with bearing and rough flight time.',
  accent: 'as the crow flies',
  icon: '↔',
  inputs: [
    { id: 'from', label: 'From', type: 'select', default: 'nyc', options: opts },
    { id: 'fromLat', label: 'From latitude', type: 'number', default: 40.7128, min: -90, max: 90, step: 0.0001, showIf: { field: 'from', in: ['custom'] } },
    { id: 'fromLon', label: 'From longitude', type: 'number', default: -74.006, min: -180, max: 180, step: 0.0001, showIf: { field: 'from', in: ['custom'] } },
    { id: 'to', label: 'To', type: 'select', default: 'la', options: opts },
    { id: 'toLat', label: 'To latitude', type: 'number', default: 34.0522, min: -90, max: 90, step: 0.0001, showIf: { field: 'to', in: ['custom'] } },
    { id: 'toLon', label: 'To longitude', type: 'number', default: -118.2437, min: -180, max: 180, step: 0.0001, showIf: { field: 'to', in: ['custom'] } },
  ],
  compute(v) {
    const [a1, o1] = pt(v, 'from'),
      [a2, o2] = pt(v, 'to');
    if ([a1, o1, a2, o2].some((x) => !isFinite(x))) return { primary: { label: '', value: '' }, error: 'Enter valid coordinates.' };
    const km = haversine(a1, o1, a2, o2);
    const b = bearing(a1, o1, a2, o2);
    const name = (k: string) => (v[k] === 'custom' ? 'custom point' : CITIES[v[k]][0]);
    return {
      primary: { label: `${name('from')} → ${name('to')}`, value: `${num(km * 0.621371, 0)} miles` },
      rows: [
        { label: 'Kilometres', value: num(km, 0) },
        { label: 'Nautical miles', value: num(km / 1.852, 0) },
        { label: 'Initial bearing', value: `${num(b, 1)}° (${compass(b)})` },
        { label: 'Rough flight time', value: km < 1 ? '—' : `${Math.floor(km / 800 + 0.5)}h ${String(Math.round(((km / 800 + 0.5) % 1) * 60)).padStart(2, '0')}m` },
      ],
      note: 'Straight-line distance over the Earth’s surface. Road and flight-path distances are longer. Flight time assumes ~800 km/h cruise plus 30 minutes for take-off and landing.',
    };
  },
  answer: {
    text: (r) =>
      `The straight-line distance from <strong>New York to Los Angeles</strong> is about <strong>${r.primary.value}</strong> (${r.rows![0].value} km), measured along the Earth’s surface. Driving is roughly 2,800 miles because roads don’t follow the great circle.`,
  },
  intro: [
    'A distance calculator measures the shortest path between two points on the globe — the great-circle distance, or “as the crow flies”. It is the basis for flight distances, radio range and shipping estimates.',
    'Pick two cities or enter latitude and longitude for any place. You get miles, kilometres and nautical miles, the compass bearing to start out on, and a rough flight time.',
  ],
  formula: {
    expr: 'a = sin²(Δφ/2) + cos φ₁ · cos φ₂ · sin²(Δλ/2)\nd = 2R · asin(√a)',
    vars: [
      ['φ, λ', 'latitude and longitude in radians'],
      ['R', 'mean Earth radius = 6,371 km'],
    ],
    notes: ['The haversine formula treats the Earth as a sphere; errors versus the ellipsoid are typically under 0.5%.'],
  },
  examples: [
    { title: 'London → Paris', inputs: { from: 'lon', to: 'par' }, explain: (r) => `${r.primary.value} (${r.rows![0].value} km).` },
    { title: 'New Delhi → Mumbai', inputs: { from: 'del', to: 'bom' }, explain: (r) => `${r.rows![0].value} km, heading ${r.rows![2].value}.` },
    { title: 'Sydney → Tokyo', inputs: { from: 'syd', to: 'tyo' }, explain: (r) => `${r.primary.value}; roughly ${r.rows![3].value} in the air.` },
  ],
  analysis() {
    const pairs: [string, string][] = [
      ['nyc', 'lon'],
      ['nyc', 'la'],
      ['lon', 'dxb'],
      ['dxb', 'sin'],
      ['la', 'tyo'],
      ['lon', 'syd'],
      ['sin', 'syd'],
      ['chi', 'mia'],
    ];
    const d = pairs.map(([a, b]) => haversine(CITIES[a][1], CITIES[a][2], CITIES[b][1], CITIES[b][2]) * 0.621371);
    return [
      {
        title: 'Great-circle distances between major cities',
        insight: `London to Sydney is about <strong>${num(d[5], 0)} miles</strong>, close to the longest common passenger route. On flat maps, great-circle routes look curved because the map distorts the sphere.`,
        chart: { type: 'hbar', title: 'Straight-line distance (miles)', x: pairs.map(([a, b]) => `${CITIES[a][0]} – ${CITIES[b][0]}`), series: [{ name: 'Miles', values: d }], y: 'int' },
      },
    ];
  },
  variantQs: [
    { q: 'How do I find the distance between two cities?', a: 'Choose both cities from the lists. For a place not listed, choose “Custom coordinates” and enter its latitude and longitude.' },
    { q: 'What does “as the crow flies” mean?', a: 'The direct straight-line distance, ignoring roads and terrain — the great-circle distance on the globe.' },
  ],
  tips: [
    'Find any coordinates by right-clicking a location in most map apps.',
    'Use negative latitude for south and negative longitude for west.',
    'Driving distance is often 15–30% longer than the straight line.',
  ],
  faqs: [
    { q: 'How far is New York from Los Angeles?', a: `About ${num(haversine(40.7128, -74.006, 34.0522, -118.2437) * 0.621371, 0)} miles in a straight line.` },
    { q: 'What is a nautical mile?', a: 'Exactly 1,852 metres, about 1.15 statute miles. It is used in aviation and shipping.' },
    { q: 'Why is the shortest flight path curved on a map?', a: 'Flat maps distort the round Earth; the shortest path on a sphere (a great circle) appears curved.' },
    { q: 'How accurate is this distance?', a: 'Within about 0.5% of the true ellipsoidal distance — more than enough for travel planning.' },
  ],
  sources: [
    { label: 'Sinnott RW (1984), “Virtues of the Haversine”, Sky & Telescope', url: 'https://en.wikipedia.org/wiki/Haversine_formula' },
    { label: 'IUGG – Mean Earth radius', url: 'https://www.iugg.org/' },
  ],
  related: ['time-calculator', 'area-calculator', 'slope-calculator', 'scientific-calculator'],
};
export default calc;
