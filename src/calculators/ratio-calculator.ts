import { gcd } from '../lib/math';
import { num } from '../lib/format';
import type { Calculator } from '../lib/types';

const calc: Calculator = {
  slug: 'ratio-calculator',
  name: 'Ratio Calculator',
  short: 'Ratio',
  category: 'math',
  keyword: 'ratio calculator',
  volume: 165000,
  variants: ['aspect ratio calculator', 'proportion calculator', 'simplify ratio calculator', 'scale ratio calculator'],
  title: 'Ratio Calculator – Solve A:B = C:D, Simplify & Scale Ratios',
  description:
    'Solve proportions (find the missing value in A:B = C:D), simplify ratios to lowest terms and scale aspect ratios or recipes, with the working shown.',
  accent: 'missing value found',
  icon: ':',
  inputs: [
    { id: 'a', label: 'A', type: 'number', default: 16 },
    { id: 'b', label: 'B', type: 'number', default: 9 },
    { id: 'c', label: 'C', type: 'number', default: 1920 },
    {
      id: 'solve',
      label: 'Solve for',
      type: 'select',
      default: 'd',
      options: [
        { value: 'd', label: 'D in A:B = C:D' },
        { value: 'simplify', label: 'Simplify A:B only' },
      ],
    },
  ],
  compute(v) {
    const a = +v.a,
      b = +v.b,
      c = +v.c;
    if (!a || !b) return { primary: { label: '', value: '' }, error: 'A and B must be non-zero.' };
    const isInt = Number.isInteger(a) && Number.isInteger(b);
    const g = isInt ? gcd(a, b) : 1;
    const simp = isInt ? `${a / g}:${b / g}` : `${num(a / b, 4)}:1`;
    const rows = [
      { label: 'Simplified A:B', value: simp },
      { label: 'As a decimal (A ÷ B)', value: num(a / b, 6) },
      { label: 'As 1:n', value: `1:${num(b / a, 4)}` },
      { label: 'A as share of total', value: num((a / (a + b)) * 100, 2) + '%' },
    ];
    if (v.solve === 'simplify') return { primary: { label: `${a}:${b} simplified`, value: simp }, rows: rows.slice(1), steps: isInt ? [`GCF(${a}, ${b}) = ${g}`, `${a} ÷ ${g} = ${a / g},  ${b} ÷ ${g} = ${b / g}`] : undefined };
    const d = (b * c) / a;
    return {
      primary: { label: `${a}:${b} = ${c}:D  →  D =`, value: num(d, 6) },
      rows,
      steps: [`Set up the proportion: ${a}/${b} = ${c}/D`, `Cross-multiply: ${a} × D = ${b} × ${c} = ${num(b * c, 6)}`, `Divide: D = ${num(b * c, 6)} ÷ ${a} = ${num(d, 6)}`],
    };
  },
  answer: {
    text: (r) =>
      `For a <strong>16:9</strong> screen that is <strong>1920</strong> pixels wide, the height is <strong>${r.primary.value}</strong>. Cross-multiply 16 × D = 9 × 1920 and divide by 16. The same method solves any proportion A:B = C:D.`,
  },
  intro: [
    'A ratio compares two quantities, like 3 parts flour to 1 part butter, or a 16:9 screen. A proportion says two ratios are equal, which lets you find a missing value by cross-multiplying.',
    'Use this ratio calculator to solve A:B = C:D, reduce a ratio to lowest terms, or convert it to a decimal, a “1:n” form or a percentage share. It is handy for resizing images, scaling recipes, mixing concrete or fuel, and map scales.',
  ],
  formula: {
    expr: 'A : B = C : D   ⇔   A × D = B × C   ⇒   D = B × C ÷ A\nSimplify: A:B = (A ÷ GCF) : (B ÷ GCF)',
    vars: [
      ['GCF', 'greatest common factor of A and B'],
    ],
  },
  examples: [
    { title: 'Resize a 4:3 photo to 800 wide', inputs: { a: 4, b: 3, c: 800 }, explain: (r) => `Height: ${r.primary.value} px.` },
    { title: 'Simplify 45:60', inputs: { a: 45, b: 60, solve: 'simplify' }, explain: (r) => `${r.primary.value}.` },
    { title: 'Recipe: 2 cups for 6 people → 15 people', inputs: { a: 6, b: 2, c: 15 }, explain: (r) => `You need ${r.primary.value} cups.` },
  ],
  analysis() {
    const ar: [string, number, number][] = [
      ['4:3', 4, 3],
      ['3:2', 3, 2],
      ['16:10', 16, 10],
      ['16:9', 16, 9],
      ['21:9', 21, 9],
      ['32:9', 32, 9],
    ];
    return [
      {
        title: 'Common aspect ratios at 1920 pixels wide',
        insight: 'At the same width, a wider ratio means a shorter image. A 1920-wide image is 1440 px tall at 4:3 but only 540 px at 32:9 — a third of the height.',
        chart: { type: 'bar', title: 'Height at 1920 px width by aspect ratio', x: ar.map((a) => a[0]), series: [{ name: 'Height (px)', values: ar.map(([, w, h]) => (1920 * h) / w) }], y: 'int' },
        table: { head: ['Ratio', 'Decimal', 'Height at 1920 wide', 'Typical use'], rows: ar.map(([n, w, h], i) => [n, num(w / h, 3), num((1920 * h) / w, 0), ['Older monitors, iPad', 'Photos (35mm)', 'Laptops', 'HD video, TVs', 'Ultrawide monitors', 'Super-ultrawide'][i]]) },
      },
    ];
  },
  variantQs: [
    { q: 'How do I use this as an aspect ratio calculator?', a: 'Enter the ratio as A:B (for example 16:9), the known width as C, and solve for D to get the height.' },
    { q: 'Is a proportion calculator the same?', a: 'Yes. A proportion is two equal ratios; solving for the missing term is exactly what this tool does.' },
  ],
  tips: [
    'Keep units consistent on both sides of a proportion.',
    'Ratios with decimals can be scaled to whole numbers by multiplying both sides by 10, 100, etc.',
    'For mixtures, add the parts (e.g. 1:3 = 4 parts total) to find each share.',
  ],
  faqs: [
    { q: 'How do you solve a ratio problem?', a: 'Write it as a proportion A/B = C/D, cross-multiply (A × D = B × C) and divide to find the unknown.' },
    { q: 'How do you simplify a ratio?', a: 'Divide both numbers by their greatest common factor. 24:36 → GCF 12 → 2:3.' },
    { q: 'What is the ratio 1920×1080?', a: '16:9. Both numbers divide by 120.' },
    { q: 'How do I split an amount in a ratio?', a: 'Add the ratio parts, divide the amount by the total, then multiply by each part. $500 in 2:3 → $200 and $300.' },
  ],
  sources: [{ label: 'Khan Academy – Ratios and proportions', url: 'https://www.khanacademy.org/math/pre-algebra/pre-algebra-ratios-rates' }],
  related: ['fraction-calculator', 'percentage-calculator', 'gcf-calculator', 'slope-calculator', 'area-calculator'],
};
export default calc;
