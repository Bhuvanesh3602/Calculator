import { num } from '../lib/format';
import type { Calculator } from '../lib/types';

export function stats(xs: number[]) {
  const n = xs.length;
  const s = [...xs].sort((a, b) => a - b);
  const mean = xs.reduce((a, b) => a + b, 0) / n;
  const median = n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
  const freq = new Map<number, number>();
  xs.forEach((x) => freq.set(x, (freq.get(x) || 0) + 1));
  const maxF = Math.max(...freq.values());
  const modes = maxF > 1 ? [...freq].filter(([, f]) => f === maxF).map(([x]) => x) : [];
  const ss = xs.reduce((a, x) => a + (x - mean) ** 2, 0);
  const sd = n > 1 ? Math.sqrt(ss / (n - 1)) : 0;
  const psd = Math.sqrt(ss / n);
  const geo = s[0] > 0 ? Math.exp(xs.reduce((a, x) => a + Math.log(x), 0) / n) : NaN;
  return { n, mean, median, modes, min: s[0], max: s[n - 1], range: s[n - 1] - s[0], sd, psd, sum: mean * n, geo, sorted: s };
}
const parse = (t: string) =>
  String(t)
    .split(/[\s,;]+/)
    .filter(Boolean)
    .map(Number)
    .filter((x) => isFinite(x));

const calc: Calculator = {
  slug: 'average-calculator',
  name: 'Average Calculator',
  short: 'Average',
  category: 'math',
  keyword: 'average calculator',
  volume: 74000,
  variants: ['mean calculator', 'mean median mode calculator', 'standard deviation calculator', 'weighted average calculator'],
  title: 'Average Calculator – Mean, Median, Mode & Standard Deviation',
  description:
    'Paste a list of numbers to get the mean, median, mode, range, sum and standard deviation, with a chart showing how outliers pull the mean from the median.',
  accent: 'mean, median and mode',
  icon: 'x̄',
  inputs: [{ id: 'data', label: 'Numbers (commas, spaces or new lines)', type: 'text', default: '72, 85, 90, 66, 85, 94, 78, 85, 61, 99', mono: true }],
  compute(v) {
    const xs = parse(v.data);
    if (xs.length < 1) return { primary: { label: '', value: '' }, error: 'Enter at least one number.' };
    if (xs.length > 5000) return { primary: { label: '', value: '' }, error: 'Up to 5,000 numbers please.' };
    const s = stats(xs);
    return {
      primary: { label: `Mean (average) of ${s.n} numbers`, value: num(s.mean, 6) },
      rows: [
        { label: 'Median', value: num(s.median, 6) },
        { label: 'Mode', value: s.modes.length ? s.modes.map((m) => num(m, 6)).join(', ') : 'none (no repeats)' },
        { label: 'Range', value: `${num(s.range, 6)} (${num(s.min, 6)} to ${num(s.max, 6)})` },
        { label: 'Sum', value: num(s.sum, 6) },
        { label: 'Standard deviation (sample)', value: num(s.sd, 6) },
        { label: 'Standard deviation (population)', value: num(s.psd, 6) },
        ...(isFinite(s.geo) ? [{ label: 'Geometric mean', value: num(s.geo, 6) }] : []),
      ],
      steps: [`Sum = ${num(s.sum, 6)}`, `Count = ${s.n}`, `Mean = ${num(s.sum, 6)} ÷ ${s.n} = ${num(s.mean, 6)}`, `Sorted: ${s.sorted.slice(0, 30).join(', ')}${s.n > 30 ? ' …' : ''}`],
      chart: s.n <= 60 ? { type: 'bar', title: 'Your values in order', x: s.sorted.map((_, i) => i + 1), series: [{ name: 'Value', values: s.sorted }], y: 'num', xTitle: 'Rank' } : undefined,
    };
  },
  answer: {
    text: (r) =>
      `The average of <strong>72, 85, 90, 66, 85, 94, 78, 85, 61 and 99</strong> is <strong>${r.primary.value}</strong>: add them (815) and divide by how many there are (10). The median — the middle value — is ${r.rows![0].value}, and the mode is ${r.rows![1].value}.`,
  },
  intro: [
    'An average summarises a list of numbers with a single typical value. The mean adds everything and divides by the count; the median is the middle value once sorted; the mode is the most frequent value.',
    'This average calculator gives all three plus range, sum, standard deviation (sample and population) and the geometric mean, and shows the steps. Paste numbers straight from a spreadsheet — commas, spaces or line breaks all work.',
  ],
  formula: {
    expr: 'Mean x̄ = Σx ÷ n\nMedian = middle value (or average of the two middle values)\nSample SD s = √(Σ(x − x̄)² ÷ (n − 1))',
    vars: [
      ['n', 'number of values'],
      ['Σ', 'sum over all values'],
    ],
  },
  examples: [
    { title: 'Five test scores', inputs: { data: '88 92 79 95 84' }, explain: (r) => `Mean ${r.primary.value}, median ${r.rows![0].value}.` },
    { title: 'Salaries with one outlier', inputs: { data: '42000, 45000, 47000, 50000, 52000, 400000' }, explain: (r) => `Mean ${r.primary.value} vs median ${r.rows![0].value} — the outlier drags the mean.` },
    { title: 'Daily steps', inputs: { data: '6500 8200 7100 12000 9400 5600 10100' }, explain: (r) => `Average ${r.primary.value}; SD ${r.rows![4].value}.` },
  ],
  analysis() {
    const base = [42, 45, 47, 50, 52, 55, 58];
    const outliers = [0, 100, 200, 400, 800];
    const means = outliers.map((o) => stats(o ? [...base, o] : base).mean);
    const meds = outliers.map((o) => stats(o ? [...base, o] : base).median);
    return [
      {
        title: 'How one outlier moves the mean but not the median',
        insight: `Adding a single value of 800 to seven salaries between 42 and 58 (in $1,000s) pushes the mean to <strong>${num(means[4], 1)}</strong>, while the median barely moves to ${num(meds[4], 1)}. That is why income and house prices are usually reported as medians.`,
        chart: {
          type: 'line',
          title: 'Mean vs median as one outlier grows ($k)',
          x: outliers.map((o) => (o ? 'Outlier ' + o : 'None')),
          series: [
            { name: 'Mean', values: means },
            { name: 'Median', values: meds },
          ],
          y: 'num',
          xTitle: 'Added value',
        },
      },
    ];
  },
  variantQs: [
    { q: 'Is this a mean median mode calculator?', a: 'Yes — all three are calculated at once, along with range and standard deviation.' },
    { q: 'How do I calculate a weighted average?', a: 'Multiply each value by its weight, add those products, and divide by the sum of the weights. For grades, our GPA and final grade calculators do this for you.' },
  ],
  tips: [
    'Use the median when data has outliers or is skewed.',
    'Use sample standard deviation for a sample, population SD when you have every value.',
    'The geometric mean is right for growth rates and ratios.',
  ],
  faqs: [
    { q: 'How do you calculate the average?', a: 'Add all the numbers and divide by how many numbers there are.' },
    { q: 'What is the difference between mean and median?', a: 'The mean is the arithmetic average; the median is the middle value. They differ when data is skewed.' },
    { q: 'Can there be more than one mode?', a: 'Yes. If several values tie for the highest frequency, the data is multimodal. If nothing repeats, there is no mode.' },
    { q: 'What does standard deviation tell you?', a: 'How spread out the values are around the mean. A small SD means values cluster tightly.' },
  ],
  sources: [{ label: 'NIST/SEMATECH e-Handbook of Statistical Methods – Measures of location and scale', url: 'https://www.itl.nist.gov/div898/handbook/eda/section3/eda35.htm' }],
  related: ['percentage-calculator', 'gpa-calculator', 'final-grade-calculator', 'percent-change-calculator', 'scientific-calculator'],
};
export default calc;
