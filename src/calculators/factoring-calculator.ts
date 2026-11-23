import { primeFactors, divisors, gcd } from '../lib/math';
import { num } from '../lib/format';
import type { Calculator, Result, Values } from '../lib/types';

const sup = (n: number) => String(n).replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]);
export function primeString(n: number) {
  const f = primeFactors(n);
  const c: Record<number, number> = {};
  f.forEach((p) => (c[p] = (c[p] || 0) + 1));
  return Object.entries(c)
    .map(([p, e]) => (e > 1 ? `${p}${sup(e)}` : p))
    .join(' × ');
}
const term = (k: number, s: string) => (k === 1 ? s : k === -1 ? '−' + s : `${k}${s}`);
function poly(a: number, b: number, c: number) {
  let s = term(a, 'x²');
  if (b) s += (b > 0 ? ' + ' : ' − ') + (Math.abs(b) === 1 ? 'x' : Math.abs(b) + 'x');
  if (c) s += (c > 0 ? ' + ' : ' − ') + Math.abs(c);
  return s;
}
function lin(p: number, q: number) {
  return `(${p === 1 ? '' : p === -1 ? '−' : p}x ${q >= 0 ? '+' : '−'} ${Math.abs(q)})`;
}

export function factorQuadratic(a: number, b: number, c: number): Result {
  const steps: string[] = [];
  const g = gcd(gcd(a, b), c) * (a < 0 ? -1 : 1);
  const A = a / g,
    B = b / g,
    C = c / g;
  if (Math.abs(g) !== 1) steps.push(`Factor out the GCF ${g}: ${g}(${poly(A, B, C)})`);
  const D = B * B - 4 * A * C;
  steps.push(`Discriminant: b² − 4ac = ${B}² − 4(${A})(${C}) = ${D}`);
  const gpre = Math.abs(g) !== 1 ? String(g) : '';
  if (D >= 0 && Number.isInteger(Math.sqrt(D))) {
    // rational roots: find p,q,r,s with (px+q)(rx+s)
    steps.push(`√${D} = ${Math.sqrt(D)} is a whole number, so the quadratic factors over the integers.`);
    steps.push(`Find two numbers that multiply to a·c = ${A * C} and add to b = ${B}.`);
    const r1n = -B + Math.sqrt(D),
      r2n = -B - Math.sqrt(D),
      den = 2 * A;
    const g1 = gcd(r1n, den) || 1,
      g2 = gcd(r2n, den) || 1;
    let p1 = den / g1,
      q1 = -r1n / g1,
      p2 = den / g2,
      q2 = -r2n / g2;
    if (p1 < 0) [p1, q1] = [-p1, -q1];
    if (p2 < 0) [p2, q2] = [-p2, -q2];
    const lead = A / (p1 * p2);
    const pre = gpre + (lead !== 1 ? String(lead) : '');
    const out = `${pre}${lin(p1, q1)}${lin(p2, q2)}`.replace('(x + 0)', 'x');
    steps.push(`Factored: ${out}`);
    return {
      primary: { label: `${poly(a, b, c)} =`, value: out },
      rows: [
        { label: 'Roots', value: `x = ${num(r1n / den, 6)}, x = ${num(r2n / den, 6)}` },
        { label: 'Discriminant', value: String(D) },
      ],
      steps,
      chart: qChart(a, b, c),
    };
  }
  const roots = D >= 0 ? `x = ${num((-B + Math.sqrt(D)) / (2 * A), 6)}, ${num((-B - Math.sqrt(D)) / (2 * A), 6)}` : `x = ${num(-B / (2 * A), 6)} ± ${num(Math.sqrt(-D) / (2 * A), 6)}i`;
  steps.push(D < 0 ? 'Discriminant is negative: no real roots, so it does not factor over the reals.' : `√${D} is irrational, so it does not factor over the integers.`);
  return {
    primary: { label: `${poly(a, b, c)}`, value: Math.abs(g) !== 1 ? `${g}(${poly(A, B, C)})` : 'Prime (does not factor over integers)' },
    rows: [
      { label: 'Roots', value: roots },
      { label: 'Discriminant', value: String(D) },
    ],
    steps,
    chart: qChart(a, b, c),
  };
}
function qChart(a: number, b: number, c: number) {
  const vx = -b / (2 * a);
  const span = Math.max(5, Math.abs(vx) + 4);
  const xs = Array.from({ length: 81 }, (_, i) => +(vx - span + (2 * span * i) / 80).toFixed(4));
  return { type: 'line' as const, title: `y = ${poly(a, b, c)}`, x: xs, series: [{ name: 'y', values: xs.map((x) => a * x * x + b * x + c) }], y: 'num' as const, numericX: true, xTitle: 'x' };
}

function compute(v: Values): Result {
  if (v.mode === 'quad') {
    const a = Math.round(+v.qa),
      b = Math.round(+v.qb),
      c = Math.round(+v.qc);
    if (!a) return { primary: { label: '', value: '' }, error: 'a must be a non-zero integer.' };
    return factorQuadratic(a, b, c);
  }
  const n = Math.round(+v.n);
  if (!(Math.abs(n) >= 2) || Math.abs(n) > 1e12) return { primary: { label: '', value: '' }, error: 'Enter a whole number between 2 and 1,000,000,000,000.' };
  const d = divisors(n);
  const pf = primeFactors(n);
  const steps: string[] = [];
  let rem = Math.abs(n);
  pf.forEach((p) => {
    steps.push(`${rem} ÷ ${p} = ${rem / p}`);
    rem /= p;
  });
  return {
    primary: { label: `Prime factorization of ${n.toLocaleString('en-US')}`, value: (n < 0 ? '−1 × ' : '') + (pf.length === 1 ? `${pf[0]} (prime)` : primeString(n)) },
    rows: [
      { label: 'Number of factors', value: String(d.length) },
      { label: 'All factors', value: d.length > 40 ? d.slice(0, 40).join(', ') + ' …' : d.join(', ') },
      { label: 'Factor pairs', value: d.slice(0, Math.ceil(d.length / 2)).slice(0, 12).map((x) => `${x}×${Math.abs(n) / x}`).join(', ') },
      { label: 'Is prime?', value: pf.length === 1 ? 'Yes' : 'No' },
    ],
    steps,
  };
}

const calc: Calculator = {
  slug: 'factoring-calculator',
  name: 'Factoring Calculator',
  short: 'Factoring',
  category: 'math',
  keyword: 'factoring calculator',
  volume: 165000,
  variants: ['factor calculator', 'prime factorization calculator', 'factor trinomials calculator', 'factoring quadratics calculator'],
  title: 'Factoring Calculator – Quadratics & Prime Factorization, Steps',
  description:
    'Factor quadratic trinomials like 2x² + 7x + 3 into binomials, or find the prime factorization and all factors of a whole number, with steps and a graph.',
  accent: 'numbers and quadratics',
  icon: '×',
  inputs: [
    {
      id: 'mode',
      label: 'Factor',
      type: 'select',
      default: 'quad',
      options: [
        { value: 'quad', label: 'Quadratic ax² + bx + c' },
        { value: 'int', label: 'A whole number' },
      ],
    },
    { id: 'qa', label: 'a', type: 'number', default: 2, step: 1, showIf: { field: 'mode', in: ['quad'] } },
    { id: 'qb', label: 'b', type: 'number', default: 7, step: 1, showIf: { field: 'mode', in: ['quad'] } },
    { id: 'qc', label: 'c', type: 'number', default: 3, step: 1, showIf: { field: 'mode', in: ['quad'] } },
    { id: 'n', label: 'Number', type: 'number', default: 360, step: 1, showIf: { field: 'mode', in: ['int'] } },
  ],
  compute,
  answer: {
    text: (r) =>
      `<strong>2x² + 7x + 3 factors as ${r.primary.value}</strong>. Find two numbers that multiply to a·c = 6 and add to b = 7 (6 and 1), split the middle term, and group. The roots are ${r.rows![0].value.replace(/x = /g, '')}.`,
  },
  intro: [
    'Factoring rewrites an expression as a product. For whole numbers, that means breaking them into prime factors (360 = 2³ × 3² × 5). For quadratics, it means writing ax² + bx + c as two binomials, which reveals where the graph crosses the x-axis.',
    'This factoring calculator does both, shows the working, and graphs the quadratic so you can see the roots. If a quadratic cannot be factored over the integers, it tells you why and gives the exact roots instead.',
  ],
  formula: {
    expr: 'ax² + bx + c = a(x − r₁)(x − r₂)\nr = (−b ± √(b² − 4ac)) / 2a\nFactors over integers ⇔ b² − 4ac is a perfect square',
    vars: [
      ['b² − 4ac', 'the discriminant'],
      ['r₁, r₂', 'roots of the quadratic'],
    ],
  },
  examples: [
    { title: 'x² − 5x + 6', inputs: { qa: 1, qb: -5, qc: 6 }, explain: (r) => `= ${r.primary.value}.` },
    { title: '6x² + x − 2', inputs: { qa: 6, qb: 1, qc: -2 }, explain: (r) => `= ${r.primary.value}.` },
    { title: 'Prime factors of 1,001', inputs: { mode: 'int', n: 1001 }, explain: (r) => `1,001 = ${r.primary.value}.` },
  ],
  analysis() {
    const ns = Array.from({ length: 100 }, (_, i) => i + 1);
    const counts = ns.map((n) => divisors(n).length);
    const top = ns.map((n, i) => ({ n, c: counts[i] })).sort((a, b) => b.c - a.c || a.n - b.n).slice(0, 5);
    const primes = ns.filter((n, i) => counts[i] === 2).length;
    return [
      {
        title: 'Which numbers up to 100 have the most factors?',
        insight: `Among 1–100, <strong>${top.map((t) => t.n).join(', ')}</strong> have the most factors (${top[0].c}). Numbers built from many small primes — like 60 = 2² × 3 × 5 — are “highly divisible”, which is why 60 minutes and 360 degrees are so convenient. ${primes} numbers in the range are prime.`,
        chart: { type: 'bar', title: 'Number of factors for 1–100', x: ns, series: [{ name: 'Factors', values: counts }], y: 'int', xTitle: 'n' },
      },
    ];
  },
  variantQs: [
    { q: 'Is this a prime factorization calculator?', a: 'Yes. Choose “A whole number” to get the prime factorization in exponent form plus every factor and factor pair.' },
    { q: 'How do I factor trinomials?', a: 'For ax² + bx + c, find two numbers that multiply to a·c and add to b, split the middle term, then factor by grouping.' },
  ],
  tips: [
    'Always pull out a greatest common factor first.',
    'Check your factoring by expanding (FOIL) the result.',
    'If the discriminant isn’t a perfect square, use the quadratic formula instead.',
  ],
  faqs: [
    { q: 'How do you factor a quadratic?', a: 'Look for two numbers that multiply to a·c and add to b. Use them to split bx, group terms, and factor out the common binomial.' },
    { q: 'What is prime factorization?', a: 'Writing a number as a product of primes. Every whole number above 1 has exactly one prime factorization.' },
    { q: 'What if a quadratic can’t be factored?', a: 'It is “prime” over the integers. You can still solve it with the quadratic formula or by completing the square.' },
    { q: 'What are the factors of 360?', a: `360 has ${divisors(360).length} factors: ${divisors(360).join(', ')}.` },
  ],
  sources: [{ label: 'Khan Academy – Factoring quadratics', url: 'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:quadratics-multiplying-factoring' }],
  related: ['gcf-calculator', 'algebra-calculator', 'graphing-calculator', 'fraction-calculator', 'slope-calculator'],
};
export default calc;
