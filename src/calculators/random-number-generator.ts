import { num } from '../lib/format';
import type { Calculator } from '../lib/types';

/** Uniform random integer in [0, n) from the browser/Node CSPRNG, with rejection sampling to avoid modulo bias. */
export function randBelow(n: number): number {
  if (n <= 1) return 0;
  const c = globalThis.crypto;
  if (!c?.getRandomValues) return Math.floor(Math.random() * n);
  const limit = Math.floor(0x100000000 / n) * n;
  const buf = new Uint32Array(1);
  do c.getRandomValues(buf);
  while (buf[0] >= limit);
  return buf[0] % n;
}
/** Uniform float in [0, 1) with 53 bits of randomness. */
export function randFloat(): number {
  return (randBelow(2 ** 26) * 2 ** 27 + randBelow(2 ** 27)) / 2 ** 53;
}
export function randInts(min: number, max: number, count: number, unique: boolean): number[] {
  const span = max - min + 1;
  if (unique) {
    // Partial Fisher–Yates over a virtual array, so ranges of billions work without allocating them.
    const swapped = new Map<number, number>();
    const out: number[] = [];
    for (let i = 0; i < count; i++) {
      const j = i + randBelow(span - i);
      const vj = swapped.get(j) ?? j;
      swapped.set(j, swapped.get(i) ?? i);
      out.push(min + vj);
    }
    return out;
  }
  return Array.from({ length: count }, () => min + randBelow(span));
}
export function shuffle<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randBelow(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const isServer = typeof window === 'undefined';

const calc: Calculator = {
  slug: 'random-number-generator',
  name: 'Random Number Generator',
  short: 'Random Number',
  category: 'math',
  keyword: 'random number generator',
  volume: 1220000,
  variants: ['random number picker', 'rng', 'random number between 1 and 100', 'lottery number generator', 'random name picker', 'dice roller'],
  title: 'Random Number Generator – True Random, No Repeats, Lists',
  description:
    'Generate random numbers in any range, with or without repeats, random decimals, dice rolls, or pick winners from a list. Uses your browser’s secure randomness.',
  accent: 'fair every time',
  icon: '⚄',
  liveOnLoad: true,
  actionLabel: 'Generate',
  inputs: [
    {
      id: 'mode',
      label: 'Generate',
      type: 'select',
      default: 'int',
      options: [
        { value: 'int', label: 'Whole numbers in a range' },
        { value: 'dec', label: 'Decimal numbers in a range' },
        { value: 'dice', label: 'Dice rolls' },
        { value: 'list', label: 'Pick from a list (names, items)' },
      ],
    },
    { id: 'min', label: 'Minimum', type: 'number', default: 1, step: 1, showIf: { field: 'mode', in: ['int', 'dec'] } },
    { id: 'max', label: 'Maximum', type: 'number', default: 100, step: 1, showIf: { field: 'mode', in: ['int', 'dec'] } },
    { id: 'count', label: 'How many', type: 'number', default: 1, min: 1, max: 10000, step: 1, showIf: { field: 'mode', in: ['int', 'dec', 'list', 'dice'] } },
    {
      id: 'unique',
      label: 'Repeats',
      type: 'select',
      default: 'allow',
      options: [
        { value: 'allow', label: 'Allow repeats' },
        { value: 'unique', label: 'No repeats (each value once)' },
      ],
      showIf: { field: 'mode', in: ['int', 'list'] },
    },
    { id: 'decimals', label: 'Decimal places', type: 'number', default: 2, min: 1, max: 12, step: 1, showIf: { field: 'mode', in: ['dec'] } },
    {
      id: 'sides',
      label: 'Die',
      type: 'select',
      default: '6',
      options: ['4', '6', '8', '10', '12', '20', '100'].map((s) => ({ value: s, label: `d${s} (${s} sides)` })),
      showIf: { field: 'mode', in: ['dice'] },
    },
    { id: 'items', label: 'List (one per line or comma-separated)', type: 'text', default: 'Alex, Sam, Jordan, Priya, Chen, Maria', showIf: { field: 'mode', in: ['list'] } },
    {
      id: 'sort',
      label: 'Order',
      type: 'select',
      default: 'none',
      options: [
        { value: 'none', label: 'As drawn' },
        { value: 'asc', label: 'Sorted ascending' },
        { value: 'desc', label: 'Sorted descending' },
      ],
      showIf: { field: 'mode', in: ['int', 'dec', 'dice'] },
    },
  ],
  compute(v) {
    const count = Math.round(+v.count || 1);
    if (count < 1 || count > 10000) return { primary: { label: '', value: '' }, error: 'Generate between 1 and 10,000 values.' };
    if (isServer) return { primary: { label: 'Your random number', value: 'Press Generate' }, note: 'Numbers are generated in your browser, never on our server, so nobody else sees the same result.' };
    if (v.mode === 'list') {
      const items = String(v.items).split(/\n|,/).map((s) => s.trim()).filter(Boolean);
      if (items.length < 1) return { primary: { label: '', value: '' }, error: 'Enter at least one item.' };
      const unique = v.unique === 'unique';
      if (unique && count > items.length) return { primary: { label: '', value: '' }, error: `Without repeats you can pick at most ${items.length} items.` };
      const picks = unique ? shuffle(items).slice(0, count) : Array.from({ length: count }, () => items[randBelow(items.length)]);
      return {
        primary: { label: count > 1 ? `${count} picks from ${items.length} items` : `Picked from ${items.length} items`, value: picks.slice(0, 50).join(', ') + (picks.length > 50 ? ' …' : '') },
        rows: [{ label: 'Chance of each item per pick', value: `1 in ${items.length} (${num(100 / items.length, 2)}%)` }],
        table: { head: ['#', 'Pick'], rows: picks.map((p, i) => [i + 1, p]) },
      };
    }
    let xs: number[];
    let label: string;
    if (v.mode === 'dice') {
      const s = +v.sides;
      xs = randInts(1, s, count, false);
      label = `${count}d${s}`;
    } else {
      const lo = Math.min(+v.min, +v.max),
        hi = Math.max(+v.min, +v.max);
      if (!isFinite(lo) || !isFinite(hi)) return { primary: { label: '', value: '' }, error: 'Enter a minimum and a maximum.' };
      if (v.mode === 'dec') {
        const d = Math.min(12, Math.max(1, Math.round(+v.decimals || 2)));
        xs = Array.from({ length: count }, () => +(lo + randFloat() * (hi - lo)).toFixed(d));
        label = `between ${lo} and ${hi}`;
      } else {
        const a = Math.ceil(lo),
          b = Math.floor(hi);
        if (b < a) return { primary: { label: '', value: '' }, error: 'There is no whole number in that range.' };
        if (b - a + 1 > 2 ** 32) return { primary: { label: '', value: '' }, error: 'Range too large: keep max − min under 4.29 billion.' };
        if (v.unique === 'unique' && count > b - a + 1) return { primary: { label: '', value: '' }, error: `Only ${b - a + 1} different numbers exist between ${a} and ${b}.` };
        xs = randInts(a, b, count, v.unique === 'unique');
        label = `between ${a} and ${b}`;
      }
    }
    if (v.sort === 'asc') xs.sort((a, b) => a - b);
    if (v.sort === 'desc') xs.sort((a, b) => b - a);
    const sum = xs.reduce((a, b) => a + b, 0);
    const fmt = (x: number) => (v.mode === 'dec' ? String(x) : num(x, 0));
    const shown = xs.slice(0, 200).map(fmt).join(', ') + (xs.length > 200 ? ` … (+${xs.length - 200} more in the table)` : '');
    // Histogram for larger draws
    let chart;
    if (xs.length >= 20) {
      const lo = Math.min(...xs),
        hi = Math.max(...xs);
      const bins = v.mode === 'dice' ? +v.sides : Math.min(20, Math.max(5, Math.round(Math.sqrt(xs.length))));
      const w = v.mode === 'dice' ? 1 : (hi - lo) / bins || 1;
      const counts = new Array(bins).fill(0);
      xs.forEach((x) => counts[v.mode === 'dice' ? x - 1 : Math.min(bins - 1, Math.floor((x - lo) / w))]++);
      chart = { type: 'bar' as const, title: 'How often each range came up', x: counts.map((_, i) => (v.mode === 'dice' ? String(i + 1) : num(lo + i * w, 1))), series: [{ name: 'Count', values: counts }], y: 'int' as const };
    }
    return {
      primary: { label: count > 1 ? `${count} random numbers ${label}` : `Random number ${label}`, value: shown },
      rows: [
        ...(count > 1 ? [{ label: 'Sum', value: num(sum, 6) }, { label: 'Average', value: num(sum / count, 4) }, { label: 'Lowest / highest', value: `${fmt(Math.min(...xs))} / ${fmt(Math.max(...xs))}` }] : []),
        { label: 'Source', value: typeof globalThis.crypto?.getRandomValues === 'function' ? 'Web Crypto CSPRNG (unbiased)' : 'Math.random (fallback)' },
      ],
      chart,
      table: count > 1 ? { head: ['#', 'Value'], rows: xs.map((x, i) => [i + 1, fmt(x)]) } : undefined,
    };
  },
  answer: {
    text: () =>
      'Set a <strong>minimum and maximum</strong>, choose how many numbers you want, and press <strong>Generate</strong>. Each whole number in the range has exactly the same chance of being picked. For example, a number between 1 and 100 has a 1-in-100 chance. Choose “No repeats” for raffles and lotteries, where each value can come up only once.',
  },
  intro: [
    'A random number generator (RNG) picks numbers by chance within a range you choose. It is useful for raffles and giveaways, picking a student or a winner, games, statistics samples and settling decisions fairly.',
    'This generator uses your browser’s cryptographic random source (the Web Crypto API). It applies rejection sampling, so every value is exactly equally likely, without the small bias that simple “random × range” code can have. The numbers are created on your device and never sent to our server. Beyond whole numbers, it can produce decimals, roll any common die and pick names from a list without repeats.',
  ],
  formula: {
    expr: 'value = min + U(0, max − min + 1)\nU(0, n) = r mod n, where r is a 32-bit CSPRNG value and r is re-drawn if r ≥ ⌊2³² ÷ n⌋ × n\nNo repeats: partial Fisher–Yates shuffle',
    vars: [
      ['CSPRNG', 'cryptographically secure pseudo-random number generator (crypto.getRandomValues)'],
      ['Rejection sampling', 'discards the few raw values that would make some results more likely than others'],
    ],
  },
  examples: [
    { title: 'Lottery-style: 6 numbers from 1–49, no repeats', inputs: { mode: 'int', min: 1, max: 49, count: 6, unique: 'unique', sort: 'asc' }, explain: () => 'Six different numbers, sorted. Odds of matching all six: 1 in 13,983,816.' },
    { title: 'Roll 3 six-sided dice', inputs: { mode: 'dice', sides: '6', count: 3 }, explain: () => 'Three independent rolls from 1 to 6. The total ranges from 3 to 18, and 10 or 11 is the most likely sum.' },
    { title: 'Pick a winner from a list', inputs: { mode: 'list', count: 1 }, explain: () => 'One name, each with a 1-in-6 chance.' },
  ],
  analysis() {
    const sums = Array.from({ length: 11 }, (_, i) => i + 2);
    const ways = sums.map((s) => 6 - Math.abs(s - 7));
    return [
      {
        title: 'One die is flat; two dice make a peak',
        insight: 'Each face of a single die is equally likely. Add two dice together, though, and 7 comes up six times as often as 2 or 12, because there are six ways to make 7 and only one way to make 2. Summing random numbers pushes results toward the middle: this is the start of the bell curve.',
        chart: { type: 'bar', title: 'Ways to roll each total with two dice (out of 36)', x: sums, series: [{ name: 'Ways', values: ways }], y: 'int' },
      },
      {
        title: 'Your odds in common draws',
        insight: 'For draws without repeats, the number of possible results grows very fast, which is why lotteries are so hard to win.',
        table: {
          head: ['Draw', 'Possible results', 'Chance of a specific result'],
          rows: [
            ['1 number from 1–10', '10', '10%'],
            ['1 number from 1–100', '100', '1%'],
            ['Pick 3 (000–999)', '1,000', '0.1%'],
            ['6 from 49 (any order)', '13,983,816', '1 in 13,983,816'],
            ['Powerball (5 of 69 + 1 of 26)', '292,201,338', '1 in 292,201,338'],
          ],
        },
      },
    ];
  },
  variantQs: [
    { q: 'How do I pick a random number between 1 and 100?', a: 'Leave Minimum at 1 and Maximum at 100, then press Generate. Each number has a 1% chance.' },
    { q: 'Can it pick random names?', a: 'Yes. Choose “Pick from a list”, paste names one per line or separated by commas, and choose how many to pick, with or without repeats.' },
    { q: 'Is this a lottery number generator?', a: 'It can generate lottery-style picks, such as 6 different numbers from 1 to 49. No generator can improve your odds: every combination is equally likely.' },
  ],
  tips: [
    'For a fair raffle, number the tickets, choose “No repeats” and draw as many winners as you need in one go.',
    'Share the page link before drawing so everyone can see the settings. The link stores the range, not the result.',
    'Need a password rather than a number? Use our password generator.',
  ],
  faqs: [
    { q: 'Are these numbers truly random?', a: 'They come from a cryptographically secure generator that your operating system seeds with physical randomness, such as hardware timing noise. They are unpredictable and suitable for draws and games.' },
    { q: 'Does it ever repeat numbers?', a: 'Only if “Allow repeats” is chosen. Then each draw is independent, so the same number can come up twice. Choose “No repeats” to get each value at most once.' },
    { q: 'Can I generate negative or decimal numbers?', a: 'Yes. Enter a negative minimum for negative numbers, or choose “Decimal numbers” and set the decimal places.' },
    { q: 'Is my result stored anywhere?', a: 'No. Numbers are generated in your browser and are not sent to or saved on our server.' },
  ],
  sources: [
    { label: 'MDN – Crypto.getRandomValues()', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues' },
    { label: 'NIST SP 800-90A – Recommendation for random number generation', url: 'https://csrc.nist.gov/pubs/sp/800/90/a/r1/final' },
  ],
  related: ['password-generator', 'percentage-calculator', 'standard-deviation-calculator', 'average-calculator', 'scientific-calculator'],
};
export default calc;
