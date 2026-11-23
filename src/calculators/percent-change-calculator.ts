import { num } from '../lib/format';
import type { Calculator } from '../lib/types';

const calc: Calculator = {
  slug: 'percent-change-calculator',
  name: 'Percent Change Calculator',
  short: 'Percent Change',
  category: 'math',
  keyword: 'percent change calculator',
  volume: 110000,
  variants: ['percentage increase calculator', 'percentage decrease calculator', 'percent increase calculator', 'percentage point calculator'],
  title: 'Percent Change Calculator – Increase, Decrease & CAGR',
  description:
    'Calculate the percent increase or decrease from an old value to a new one, the change in percentage points, and the compound annual growth rate (CAGR).',
  accent: 'from old to new',
  icon: 'Δ',
  inputs: [
    { id: 'from', label: 'Original value', type: 'number', default: 80 },
    { id: 'to', label: 'New value', type: 'number', default: 100 },
    { id: 'periods', label: 'Number of periods (for CAGR)', type: 'number', default: 1, min: 1, step: 1, help: 'Years, months, etc. Leave at 1 for a simple change.' },
  ],
  compute(v) {
    const a = +v.from,
      b = +v.to,
      n = Math.max(1, Math.round(+v.periods || 1));
    if (a === 0) return { primary: { label: '', value: '' }, error: 'Percent change from zero is undefined — the original value must not be 0.' };
    const ch = ((b - a) / Math.abs(a)) * 100;
    const cagr = a > 0 && b > 0 ? (Math.pow(b / a, 1 / n) - 1) * 100 : NaN;
    return {
      primary: { label: ch >= 0 ? 'Percent increase' : 'Percent decrease', value: (ch >= 0 ? '+' : '') + num(ch, 2) + '%' },
      rows: [
        { label: 'Absolute change', value: (b - a >= 0 ? '+' : '') + num(b - a, 4) },
        { label: 'New as % of original', value: num((b / a) * 100, 2) + '%' },
        { label: 'Reverse change (new → original)', value: b !== 0 ? num(((a - b) / Math.abs(b)) * 100, 2) + '%' : '—' },
        { label: 'If values are percentages: point change', value: (b - a >= 0 ? '+' : '') + num(b - a, 2) + ' pts' },
        ...(n > 1 ? [{ label: `Compound rate per period (${n} periods)`, value: isFinite(cagr) ? num(cagr, 3) + '%' : 'needs positive values' }] : []),
      ],
      steps: [`Change = ${num(b, 4)} − ${num(a, 4)} = ${num(b - a, 4)}`, `Divide by the original: ${num(b - a, 4)} ÷ |${num(a, 4)}| = ${num((b - a) / Math.abs(a), 6)}`, `× 100 = ${num(ch, 2)}%`],
    };
  },
  answer: {
    text: (r) =>
      `Going from <strong>80 to 100 is a ${r.primary.value.replace('+', '')} increase</strong>: subtract (100 − 80 = 20), divide by the original (20 ÷ 80 = 0.25) and multiply by 100. Going back from 100 to 80 is only a <strong>${r.rows![2].value.replace('-', '')} decrease</strong> — the base is different.`,
  },
  intro: [
    'Percent change measures how much a value has grown or shrunk relative to where it started. It is the standard way to report price rises, salary increases, stock moves, population growth and survey shifts.',
    'This calculator gives the percent change, the reverse change, and — if your values are already percentages, like interest rates or poll results — the change in percentage points. Add a number of periods to get the compound annual growth rate (CAGR).',
  ],
  formula: {
    expr: 'Percent change = (new − old) ÷ |old| × 100\nPercentage points = new% − old%\nCAGR = (new ÷ old)^(1/n) − 1',
    vars: [
      ['old', 'original value (cannot be 0)'],
      ['n', 'number of periods for compound growth'],
    ],
  },
  examples: [
    { title: 'Rent from $1,500 to $1,650', inputs: { from: 1500, to: 1650 }, explain: (r) => `A ${r.primary.value} rise.` },
    { title: 'Stock from $120 to $90', inputs: { from: 120, to: 90 }, explain: (r) => `A ${r.primary.value} fall; it needs ${r.rows![2].value} to recover.` },
    { title: 'Revenue doubles in 5 years', inputs: { from: 1, to: 2, periods: 5 }, explain: (r) => `That is ${r.rows![4].value} per year compounded.` },
  ],
  analysis() {
    const rates = [4, 5];
    return [
      {
        title: 'Percent vs percentage points',
        insight: 'If a mortgage rate goes from 4% to 5%, it rose by <strong>1 percentage point</strong> but by <strong>25 percent</strong>. Headlines often mix these up; both are correct, but they answer different questions.',
        stats: [
          { label: 'Percentage-point change', value: `+${rates[1] - rates[0]} pt` },
          { label: 'Percent change', value: `+${num(((rates[1] - rates[0]) / rates[0]) * 100, 0)}%` },
        ],
      },
      {
        title: 'Simple total vs compound annual growth',
        insight: 'A 100% gain over 10 years is not 10% a year. Compounded, it is about <strong>7.18% a year</strong>. Dividing the total by the years overstates the annual rate, and the gap grows with longer periods.',
        chart: {
          type: 'bar',
          title: 'Annual rate implied by doubling over n years',
          x: [2, 3, 5, 7, 10, 15, 20].map((n) => n + ' yrs'),
          series: [
            { name: 'Simple (total ÷ years)', values: [2, 3, 5, 7, 10, 15, 20].map((n) => 100 / n) },
            { name: 'Compound (CAGR)', values: [2, 3, 5, 7, 10, 15, 20].map((n) => (Math.pow(2, 1 / n) - 1) * 100) },
          ],
          y: 'pct',
          xTitle: 'Years to double',
        },
      },
    ];
  },
  variantQs: [
    { q: 'How do I calculate a percentage increase?', a: 'Subtract the old value from the new value, divide by the old value, and multiply by 100. A positive result is an increase.' },
    { q: 'How do I calculate a percentage decrease?', a: 'Use the same formula; the result will be negative. From 50 to 40: (40 − 50) ÷ 50 × 100 = −20%.' },
  ],
  tips: [
    'Always divide by the original (old) value, not the new one.',
    'When the old value is negative, divide by its absolute value to keep the sign meaningful.',
    'Report percentage points for changes in rates, percent change for changes in amounts.',
  ],
  faqs: [
    { q: 'What is the formula for percent change?', a: '(New − Old) ÷ |Old| × 100.' },
    { q: 'Can percent change be more than 100%?', a: 'Yes. Going from 50 to 150 is a 200% increase. Decreases, however, can’t exceed 100% for positive values.' },
    { q: 'What is the difference between percent change and percent difference?', a: 'Percent change has a clear starting point (old → new). Percent difference compares two values without an order, dividing by their average.' },
    { q: 'What is CAGR?', a: 'Compound annual growth rate: the steady yearly rate that would take the old value to the new value over the given number of years.' },
  ],
  sources: [{ label: 'U.S. Census Bureau – Calculating percent change', url: 'https://www.census.gov/' }],
  related: ['percentage-calculator', 'inflation-calculator', 'compound-interest-calculator', 'average-calculator', 'ratio-calculator'],
};
export default calc;
