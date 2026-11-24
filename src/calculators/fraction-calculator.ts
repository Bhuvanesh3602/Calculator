import { gcd, lcm } from '../lib/math';
import { num } from '../lib/format';
import type { Calculator } from '../lib/types';

type F = { n: number; d: number };
const simp = (f: F): F => {
  if (f.d === 0) return f;
  const g = gcd(f.n, f.d) || 1;
  const s = f.d < 0 ? -1 : 1;
  return { n: (s * f.n) / g, d: (s * f.d) / g };
};
export const show = (f: F) => (f.d === 1 ? `${f.n}` : `${f.n}/${f.d}`);
export function mixed(f: F) {
  if (Math.abs(f.n) < f.d || f.d === 1) return show(f);
  const w = Math.trunc(f.n / f.d);
  const r = Math.abs(f.n % f.d);
  return r ? `${w} ${r}/${f.d}` : `${w}`;
}
/** Parse "3/4", "1 1/2", "-2", "0.75". */
export function parse(s: string): F | null {
  s = String(s).trim();
  let m = /^(-?\d+)\s+(\d+)\/(\d+)$/.exec(s);
  if (m) {
    const w = +m[1],
      n = +m[2],
      d = +m[3];
    return simp({ n: w * d + (w < 0 ? -n : n), d });
  }
  m = /^(-?\d+)\s*\/\s*(-?\d+)$/.exec(s);
  if (m) return +m[2] === 0 ? null : simp({ n: +m[1], d: +m[2] });
  if (/^-?\d*\.?\d+$/.test(s)) {
    const dec = (s.split('.')[1] || '').length;
    return simp({ n: Math.round(+s * 10 ** dec), d: 10 ** dec });
  }
  return null;
}
export function op(a: F, b: F, o: string): { r: F; steps: string[] } {
  switch (o) {
    case '+':
    case '-': {
      const L = lcm(a.d, b.d);
      const an = a.n * (L / a.d),
        bn = b.n * (L / b.d);
      const r = simp({ n: o === '+' ? an + bn : an - bn, d: L });
      return { r, steps: [`Common denominator: LCD(${a.d}, ${b.d}) = ${L}`, `Rewrite: ${an}/${L} ${o} ${bn}/${L}`, `${o === '+' ? 'Add' : 'Subtract'} numerators: ${o === '+' ? an + bn : an - bn}/${L}`, `Simplify: ${show(r)}`] };
    }
    case '*': {
      const r = simp({ n: a.n * b.n, d: a.d * b.d });
      return { r, steps: [`Multiply numerators: ${a.n} × ${b.n} = ${a.n * b.n}`, `Multiply denominators: ${a.d} × ${b.d} = ${a.d * b.d}`, `Simplify: ${show(r)}`] };
    }
    default: {
      const r = simp({ n: a.n * b.d, d: a.d * b.n });
      return { r, steps: [`Flip the second fraction: ${b.n}/${b.d} → ${b.d}/${b.n}`, `Multiply: ${a.n}×${b.d} / ${a.d}×${b.n} = ${a.n * b.d}/${a.d * b.n}`, `Simplify: ${show(r)}`] };
    }
  }
}

const calc: Calculator = {
  slug: 'fraction-calculator',
  name: 'Fraction Calculator',
  short: 'Fraction',
  category: 'math',
  keyword: 'fraction calculator',
  volume: 368000,
  variants: ['mixed number calculator', 'adding fractions calculator', 'simplify fractions calculator', 'fraction to decimal calculator'],
  title: 'Fraction Calculator – Add, Subtract, Multiply & Divide',
  description:
    'Add, subtract, multiply and divide fractions and mixed numbers. Get the simplified answer, mixed number and decimal, with every step of the working shown.',
  accent: 'with every step',
  icon: '½',
  inputs: [
    { id: 'a', label: 'First fraction', type: 'text', default: '3/4', placeholder: 'e.g. 3/4, 1 1/2, 0.6', mono: true },
    {
      id: 'op',
      label: 'Operation',
      type: 'select',
      default: '+',
      options: [
        { value: '+', label: '+ Add' },
        { value: '-', label: '− Subtract' },
        { value: '*', label: '× Multiply' },
        { value: '/', label: '÷ Divide' },
      ],
    },
    { id: 'b', label: 'Second fraction', type: 'text', default: '2/3', placeholder: 'e.g. 2/3', mono: true },
  ],
  compute(v) {
    const a = parse(v.a),
      b = parse(v.b);
    if (!a || !b) return { primary: { label: '', value: '' }, error: 'Enter fractions like 3/4, mixed numbers like 1 1/2, or decimals like 0.75.' };
    if (v.op === '/' && b.n === 0) return { primary: { label: '', value: '' }, error: 'You cannot divide by zero.' };
    const { r, steps } = op(a, b, v.op);
    const sym = { '+': '+', '-': '−', '*': '×', '/': '÷' }[v.op as '+'];
    return {
      primary: { label: `${show(a)} ${sym} ${show(b)} =`, value: show(r) },
      rows: [
        { label: 'Mixed number', value: mixed(r) },
        { label: 'Decimal', value: num(r.n / r.d, 6) },
        { label: 'Percent', value: num((r.n / r.d) * 100, 4) + '%' },
      ],
      steps,
    };
  },
  answer: {
    text: (r) =>
      `<strong>3/4 + 2/3 = ${r.primary.value}</strong> (or ${r.rows![0].value}). Rewrite both over the least common denominator, 12: 9/12 + 8/12 = 17/12. As a decimal that is ${r.rows![1].value}.`,
  },
  intro: [
    'A fraction calculator performs arithmetic on fractions and returns the answer in simplest form. It handles proper fractions, improper fractions, mixed numbers like 2 1/3, negative numbers and decimals.',
    'Every result comes with the steps a teacher would expect: finding the least common denominator, rewriting, combining numerators and simplifying with the <a href="/gcf-calculator/">greatest common factor</a>. To compare two quantities instead of combining them, use the <a href="/ratio-calculator/">ratio calculator</a>.',
  ],
  formula: {
    expr: 'a/b + c/d = (a·d + c·b) / (b·d)   (we use the LCD to keep numbers small)\na/b × c/d = (a·c) / (b·d)\na/b ÷ c/d = (a·d) / (b·c)\nSimplify: divide top and bottom by GCF(n, d)',
    vars: [
      ['LCD', 'least common denominator = LCM of the denominators'],
      ['GCF', 'greatest common factor'],
    ],
  },
  examples: [
    { title: '1 1/2 − 3/8', inputs: { a: '1 1/2', op: '-', b: '3/8' }, explain: (r) => `= ${r.primary.value} = ${r.rows![0].value}.` },
    { title: '2/3 × 9/10', inputs: { a: '2/3', op: '*', b: '9/10' }, explain: (r) => `Simplifies to ${r.primary.value}.` },
    { title: '5/6 ÷ 1/4', inputs: { a: '5/6', op: '/', b: '1/4' }, explain: (r) => `Dividing by 1/4 multiplies by 4: ${r.rows![0].value}.` },
  ],
  analysis() {
    const fr: [string, number][] = [
      ['1/8', 0.125],
      ['1/6', 1 / 6],
      ['1/5', 0.2],
      ['1/4', 0.25],
      ['1/3', 1 / 3],
      ['3/8', 0.375],
      ['1/2', 0.5],
      ['5/8', 0.625],
      ['2/3', 2 / 3],
      ['3/4', 0.75],
      ['7/8', 0.875],
    ];
    return [
      {
        title: 'Common fractions as decimals and percents',
        insight: 'Fractions whose denominators contain only 2s and 5s (like 1/8 or 3/20) become terminating decimals; any other factor (3, 6, 7…) gives a repeating decimal such as 1/3 = 0.333…',
        chart: { type: 'hbar', title: 'Decimal value of common fractions', x: fr.map((f) => f[0]), series: [{ name: 'Decimal', values: fr.map((f) => f[1]) }], y: 'num2' },
        table: { head: ['Fraction', 'Decimal', 'Percent'], rows: fr.map(([f, d]) => [f, num(d, 4), num(d * 100, 2) + '%']) },
      },
    ];
  },
  variantQs: [
    { q: 'Can I use this as a mixed number calculator?', a: 'Yes — type mixed numbers with a space, like 2 1/4. Results are shown as an improper fraction and as a mixed number.' },
    { q: 'How do I simplify fractions?', a: 'Divide the numerator and denominator by their greatest common factor. 18/24 → GCF 6 → 3/4. Every result here is already simplified.' },
    { q: 'How do I convert a fraction to a decimal?', a: 'Divide the numerator by the denominator. The decimal line in the result does it for you.' },
  ],
  tips: [
    'To add or subtract, you need a common denominator; to multiply or divide, you don’t.',
    'Cross-cancel before multiplying to keep numbers small.',
    'Convert mixed numbers to improper fractions before multiplying or dividing.',
  ],
  faqs: [
    { q: 'How do you add fractions with different denominators?', a: 'Find the least common denominator, rewrite each fraction with it, add the numerators and simplify.' },
    { q: 'How do you divide fractions?', a: 'Keep the first fraction, change ÷ to ×, and flip the second fraction (use its reciprocal). Then multiply.' },
    { q: 'What is an improper fraction?', a: 'A fraction whose numerator is larger than its denominator, like 7/4. It equals the mixed number 1 3/4.' },
    { q: 'Can I enter decimals?', a: 'Yes. Decimals are converted to exact fractions first, so 0.25 becomes 1/4.' },
  ],
  sources: [{ label: 'Khan Academy – Fractions', url: 'https://www.khanacademy.org/math/arithmetic/fraction-arithmetic' }],
  related: ['percentage-calculator', 'ratio-calculator', 'gcf-calculator', 'factoring-calculator', 'scientific-calculator'],
};
export default calc;
