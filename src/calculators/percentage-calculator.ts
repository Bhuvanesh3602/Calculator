import { num } from '../lib/format';
import type { Calculator, Result, Values } from '../lib/types';

const MODES = [
  { value: 'of', label: 'What is X% of Y?' },
  { value: 'is', label: 'X is what % of Y?' },
  { value: 'whole', label: 'X is Y% of what?' },
  { value: 'add', label: 'Increase Y by X%' },
  { value: 'sub', label: 'Decrease Y by X%' },
  { value: 'diff', label: '% difference between X and Y' },
];

export function percent(v: Values): Result {
  const x = +v.x,
    y = +v.y;
  if (!isFinite(x) || !isFinite(y)) return { primary: { label: '', value: '' }, error: 'Enter two numbers.' };
  const n = (a: number) => num(a, 4);
  switch (v.mode) {
    case 'of': {
      const r = (x / 100) * y;
      return { primary: { label: `${n(x)}% of ${n(y)}`, value: n(r) }, steps: [`Convert ${n(x)}% to a decimal: ${n(x)} ÷ 100 = ${n(x / 100)}`, `Multiply: ${n(x / 100)} × ${n(y)} = ${n(r)}`] };
    }
    case 'is': {
      if (y === 0) return { primary: { label: '', value: '' }, error: 'Y cannot be zero.' };
      const r = (x / y) * 100;
      return { primary: { label: `${n(x)} is this % of ${n(y)}`, value: n(r) + '%' }, steps: [`Divide: ${n(x)} ÷ ${n(y)} = ${n(x / y)}`, `Multiply by 100: ${n(x / y)} × 100 = ${n(r)}%`] };
    }
    case 'whole': {
      if (y === 0) return { primary: { label: '', value: '' }, error: 'The percentage cannot be zero.' };
      const r = x / (y / 100);
      return { primary: { label: `${n(x)} is ${n(y)}% of`, value: n(r) }, steps: [`Convert ${n(y)}% to a decimal: ${n(y / 100)}`, `Divide: ${n(x)} ÷ ${n(y / 100)} = ${n(r)}`] };
    }
    case 'add': {
      const r = y * (1 + x / 100);
      return { primary: { label: `${n(y)} increased by ${n(x)}%`, value: n(r) }, rows: [{ label: 'Amount added', value: n(r - y) }], steps: [`Multiplier: 1 + ${n(x)} ÷ 100 = ${n(1 + x / 100)}`, `${n(y)} × ${n(1 + x / 100)} = ${n(r)}`] };
    }
    case 'sub': {
      const r = y * (1 - x / 100);
      return { primary: { label: `${n(y)} decreased by ${n(x)}%`, value: n(r) }, rows: [{ label: 'Amount removed', value: n(y - r) }], steps: [`Multiplier: 1 − ${n(x)} ÷ 100 = ${n(1 - x / 100)}`, `${n(y)} × ${n(1 - x / 100)} = ${n(r)}`] };
    }
    default: {
      const avg = (Math.abs(x) + Math.abs(y)) / 2;
      if (avg === 0) return { primary: { label: '', value: '' }, error: 'Both numbers are zero.' };
      const r = (Math.abs(x - y) / avg) * 100;
      return {
        primary: { label: `% difference between ${n(x)} and ${n(y)}`, value: n(r) + '%' },
        steps: [`Absolute difference: |${n(x)} − ${n(y)}| = ${n(Math.abs(x - y))}`, `Average: (${n(Math.abs(x))} + ${n(Math.abs(y))}) ÷ 2 = ${n(avg)}`, `${n(Math.abs(x - y))} ÷ ${n(avg)} × 100 = ${n(r)}%`],
      };
    }
  }
}

const calc: Calculator = {
  slug: 'percentage-calculator',
  name: 'Percentage Calculator',
  short: 'Percentage',
  category: 'math',
  keyword: 'percentage calculator',
  volume: 673000,
  variants: ['percent of calculator', 'percent of is calculator', 'find percentage calculator', 'percentage of what calculator', 'percent percentage calculator'],
  title: 'Percentage Calculator – 6 Percent Problems, Step by Step',
  description:
    'Solve any percentage problem: X% of Y, what percent X is of Y, the whole from a part, increases, decreases and percent difference, with working shown.',
  accent: 'six problems, one tool',
  icon: '%',
  inputs: [
    { id: 'mode', label: 'Question', type: 'select', default: 'of', options: MODES },
    { id: 'x', label: 'X', type: 'number', default: 15 },
    { id: 'y', label: 'Y', type: 'number', default: 80 },
  ],
  compute: percent,
  answer: {
    text: (r) =>
      `<strong>15% of 80 is ${r.primary.value}</strong>: convert the percent to a decimal (15 ÷ 100 = 0.15) and multiply (0.15 × 80 = 12). Change the question above to find what percent one number is of another, the original whole, or a percentage increase or decrease.`,
  },
  intro: [
    'Percent means “per hundred”, so every percentage problem is a multiplication or division by 100 in disguise. The hard part is knowing which of the six common questions you are asking — this calculator lets you pick one and shows the steps.',
    'Use it for discounts, tips, test scores, tax, pay rises, statistics and recipes. For change over time (old value → new value), our percent change calculator gives increase, decrease and percentage points.',
  ],
  formula: {
    expr: 'X% of Y        = X/100 × Y\nX is ?% of Y   = X / Y × 100\nX is Y% of ?   = X ÷ (Y/100)\nY ± X%         = Y × (1 ± X/100)\n% difference   = |X − Y| ÷ ((X + Y)/2) × 100',
    vars: [
      ['X, Y', 'the two numbers you enter'],
      ['%', 'parts per hundred'],
    ],
  },
  examples: [
    { title: '20% off a $65 jacket', inputs: { mode: 'sub', x: 20, y: 65 }, explain: (r) => `You pay ${r.primary.value}; you save ${r.rows![0].value}.` },
    { title: '42 out of 50 on a test', inputs: { mode: 'is', x: 42, y: 50 }, explain: (r) => `That is ${r.primary.value}.` },
    { title: '$18 is 15% of what bill?', inputs: { mode: 'whole', x: 18, y: 15 }, explain: (r) => `The bill was ${r.primary.value}.` },
  ],
  analysis() {
    const pcts = [10, 20, 25, 30, 40, 50];
    const back = pcts.map((p) => (1 / (1 - p / 100) - 1) * 100);
    return [
      {
        title: 'Why a drop and a rise of the same % don’t cancel',
        insight: `After a 20% fall you need a <strong>${num(back[1], 1)}% rise</strong> to get back to where you started; after a 50% fall you need +100%. The base changes, so percentages are not symmetric — a common trap with prices and investments.`,
        chart: {
          type: 'bar',
          title: 'Rise needed to recover from a fall',
          x: pcts.map((p) => '−' + p + '%'),
          series: [
            { name: 'Fall', values: pcts },
            { name: 'Rise needed to recover', values: back },
          ],
          y: 'pct',
          xTitle: 'Size of the fall',
        },
      },
      {
        title: 'Everyday percentages, solved',
        insight: 'Mental shortcuts: 10% is the number with the decimal moved one place left; 5% is half of that; 1% moves it two places. Build anything else from those pieces.',
        table: {
          head: ['Situation', 'Question', 'Answer'],
          rows: [
            ['18% tip on $46', '18% of 46', num(0.18 * 46, 2)],
            ['8.25% sales tax on $120', '8.25% of 120', num(0.0825 * 120, 2)],
            ['3% raise on $52,000', 'Increase 52,000 by 3%', num(52000 * 1.03, 0)],
            ['35% off $80', 'Decrease 80 by 35%', num(80 * 0.65, 2)],
            ['27 of 30 correct', '27 is what % of 30', num(90, 0) + '%'],
          ],
        },
      },
    ];
  },
  variantQs: [
    { q: 'How does a “percent of” calculator work?', a: 'It multiplies the number by the percentage divided by 100. 15% of 80 = 0.15 × 80 = 12.' },
    { q: 'How do I find what percentage one number is of another?', a: 'Divide the part by the whole and multiply by 100. Choose “X is what % of Y?” above.' },
    { q: 'How do I find the whole when I know the percentage?', a: 'Divide the part by the percentage as a decimal. If 18 is 15% of a number, the number is 18 ÷ 0.15 = 120.' },
  ],
  tips: [
    'Percent of a percent multiplies: 50% of 20% is 10%, not 30%.',
    'Two successive discounts of 20% are a 36% discount, not 40%.',
    'Percentage points measure the gap between two percentages; percent change measures relative change.',
  ],
  faqs: [
    { q: 'How do I calculate a percentage of a number?', a: 'Convert the percentage to a decimal by dividing by 100, then multiply. 25% of 200 is 0.25 × 200 = 50.' },
    { q: 'How do I calculate a percentage increase?', a: 'Subtract the old value from the new, divide by the old value, and multiply by 100. Our percent change calculator does this.' },
    { q: 'What is 20% of 50?', a: '10. Multiply 50 by 0.20.' },
    { q: 'How do I add a percentage to a number?', a: 'Multiply by 1 plus the percentage as a decimal. Adding 7% to 300 gives 300 × 1.07 = 321.' },
    { q: 'What is percent difference?', a: 'The absolute difference between two values divided by their average, times 100. It is used when neither value is the “original”.' },
  ],
  sources: [{ label: 'NIST Guide to the SI, §7.10.2 – Percent', url: 'https://www.nist.gov/pml/special-publication-811' }],
  related: ['percent-change-calculator', 'tip-calculator', 'fraction-calculator', 'ratio-calculator', 'gpa-calculator', 'average-calculator'],
};
export default calc;
