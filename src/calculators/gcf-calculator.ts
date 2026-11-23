import { gcd, lcm, primeFactors } from '../lib/math';
import { primeString } from './factoring-calculator';
import type { Calculator } from '../lib/types';

export const parseInts = (s: string) =>
  String(s)
    .split(/[\s,;]+/)
    .filter(Boolean)
    .map(Number)
    .filter((n) => Number.isFinite(n))
    .map((n) => Math.abs(Math.round(n)));

const calc: Calculator = {
  slug: 'gcf-calculator',
  name: 'GCF Calculator',
  short: 'GCF',
  category: 'math',
  keyword: 'gcf calculator',
  volume: 135000,
  variants: ['greatest common factor calculator', 'gcd calculator', 'lcm calculator', 'hcf calculator'],
  title: 'GCF Calculator – Greatest Common Factor & LCM with Steps',
  description:
    'Find the greatest common factor (GCF/GCD) and least common multiple (LCM) of two or more numbers, with the Euclidean algorithm and prime factors shown.',
  accent: 'and the LCM too',
  icon: 'G',
  inputs: [{ id: 'nums', label: 'Numbers (separate with commas)', type: 'text', default: '48, 180, 300', placeholder: 'e.g. 12, 18, 30', mono: true }],
  compute(v) {
    const ns = parseInts(v.nums).filter((n) => n > 0);
    if (ns.length < 2) return { primary: { label: '', value: '' }, error: 'Enter at least two positive whole numbers.' };
    if (ns.some((n) => n > 1e12)) return { primary: { label: '', value: '' }, error: 'Numbers must be under 1,000,000,000,000.' };
    const g = ns.reduce((a, b) => gcd(a, b));
    const l = ns.reduce((a, b) => lcm(a, b));
    const steps: string[] = [];
    let a = ns[0];
    for (const b0 of ns.slice(1)) {
      let x = Math.max(a, b0),
        y = Math.min(a, b0);
      steps.push(`GCF(${a}, ${b0}) by Euclid:`);
      while (y) {
        steps.push(`  ${x} = ${Math.floor(x / y)} × ${y} + ${x % y}`);
        [x, y] = [y, x % y];
      }
      a = x;
      steps.push(`  → ${x}`);
    }
    return {
      primary: { label: `GCF of ${ns.join(', ')}`, value: String(g) },
      rows: [
        { label: 'LCM', value: l.toLocaleString('en-US') },
        ...ns.slice(0, 6).map((n) => ({ label: `${n} =`, value: primeFactors(n).length ? primeString(n) : '1' })),
        { label: 'GCF prime factors', value: g > 1 ? primeString(g) : '1 (numbers are coprime)' },
      ],
      steps,
    };
  },
  answer: {
    text: (r) =>
      `The greatest common factor of <strong>48, 180 and 300 is ${r.primary.value}</strong>: 48 = 2⁴ × 3, 180 = 2² × 3² × 5 and 300 = 2² × 3 × 5², and the primes they share are 2² × 3 = 12. Their least common multiple is <strong>${r.rows![0].value}</strong>.`,
  },
  intro: [
    'The greatest common factor (GCF) — also called the greatest common divisor (GCD) or highest common factor (HCF) — is the largest whole number that divides each of your numbers exactly. The least common multiple (LCM) is the smallest number they all divide into.',
    'Enter two or more numbers to get both, with the Euclidean algorithm and prime factorizations shown. GCF simplifies fractions and ratios; LCM finds common denominators and lines up repeating schedules.',
  ],
  formula: {
    expr: 'Euclid: GCF(a, b) = GCF(b, a mod b), until the remainder is 0\nLCM(a, b) = a × b ÷ GCF(a, b)\nGCF = product of shared primes at their lowest powers',
    vars: [['a mod b', 'remainder when a is divided by b']],
  },
  examples: [
    { title: 'Simplify 84/126', inputs: { nums: '84, 126' }, explain: (r) => `Divide both by ${r.primary.value}: 2/3.` },
    { title: 'Buses every 12, 18 and 30 min', inputs: { nums: '12, 18, 30' }, explain: (r) => `They all meet again after ${r.rows![0].value} minutes.` },
    { title: 'Coprime numbers', inputs: { nums: '35, 64' }, explain: (r) => `GCF ${r.primary.value}: no shared primes.` },
  ],
  analysis() {
    const N = 30;
    let coprime = 0;
    const share: number[] = [];
    for (let a = 1; a <= N; a++) {
      let c = 0;
      for (let b = 1; b <= N; b++) if (gcd(a, b) === 1) c++;
      coprime += c;
      share.push((c / N) * 100);
    }
    return [
      {
        title: 'How often are two numbers coprime?',
        insight: `Among all pairs from 1 to ${N}, <strong>${((coprime / (N * N)) * 100).toFixed(1)}%</strong> share no common factor other than 1. Mathematically, the probability that two random integers are coprime approaches 6/π² ≈ 60.8%. Primes are coprime to most numbers; even numbers to fewer.`,
        chart: { type: 'bar', title: `Share of 1–${N} coprime with each n`, x: Array.from({ length: N }, (_, i) => i + 1), series: [{ name: 'Coprime share', values: share }], y: 'pct', xTitle: 'n' },
      },
    ];
  },
  variantQs: [
    { q: 'Is GCF the same as GCD or HCF?', a: 'Yes. Greatest common factor, greatest common divisor and highest common factor are three names for the same number.' },
    { q: 'Can this be used as an LCM calculator?', a: 'Yes — the LCM is shown in every result.' },
  ],
  tips: [
    'GCF × LCM = a × b (for two numbers) — a quick way to check your work.',
    'If one number divides the other, the smaller number is the GCF.',
    'Consecutive integers are always coprime.',
  ],
  faqs: [
    { q: 'How do you find the GCF?', a: 'Either list prime factorizations and multiply the shared primes at their lowest powers, or use the Euclidean algorithm of repeated division.' },
    { q: 'What is the GCF of 12 and 18?', a: '6. 12 = 2² × 3 and 18 = 2 × 3², so they share 2 × 3.' },
    { q: 'What is the difference between GCF and LCM?', a: 'GCF is the largest number that divides all of them; LCM is the smallest number all of them divide into.' },
    { q: 'What does coprime mean?', a: 'Two numbers are coprime when their GCF is 1, like 8 and 15.' },
  ],
  sources: [{ label: 'Euclid’s Elements, Book VII, Propositions 1–2', url: 'https://mathcs.clarku.edu/~djoyce/elements/bookVII/propVII2.html' }],
  related: ['factoring-calculator', 'fraction-calculator', 'ratio-calculator', 'average-calculator'],
};
export default calc;
