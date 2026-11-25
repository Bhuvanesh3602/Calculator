import { num, pct } from '../lib/format';
import type { Calculator } from '../lib/types';

/** Two-sided 95% Student-t critical values for df = 1…30; larger df approach 1.96. */
const T95 = [12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201, 2.179, 2.16, 2.145, 2.131, 2.12, 2.11, 2.101, 2.093, 2.086, 2.08, 2.074, 2.069, 2.064, 2.06, 2.056, 2.052, 2.048, 2.045, 2.042];
export const t95 = (df: number) => (df < 1 ? NaN : df <= 30 ? T95[df - 1] : df <= 60 ? 2.042 - ((df - 30) / 30) * 0.042 : df <= 120 ? 2.0 - ((df - 60) / 60) * 0.02 : 1.96);

export function sdStats(xs: number[]) {
  const n = xs.length;
  // Welford's algorithm: numerically stable for large or nearly equal values.
  let mean = 0,
    m2 = 0;
  xs.forEach((x, i) => {
    const d = x - mean;
    mean += d / (i + 1);
    m2 += d * (x - mean);
  });
  const popVar = m2 / n;
  const sampVar = n > 1 ? m2 / (n - 1) : NaN;
  return { n, mean, ss: m2, popVar, sampVar, popSd: Math.sqrt(popVar), sampSd: Math.sqrt(sampVar) };
}
const parse = (t: string) => String(t).split(/[\s,;]+/).filter(Boolean).map(Number).filter((x) => isFinite(x));

const calc: Calculator = {
  slug: 'standard-deviation-calculator',
  name: 'Standard Deviation Calculator',
  short: 'Standard Deviation',
  category: 'math',
  keyword: 'standard deviation calculator',
  volume: 165000,
  variants: ['variance calculator', 'sample standard deviation calculator', 'population standard deviation calculator', 'z score calculator', 'confidence interval calculator', 'standard error calculator'],
  title: 'Standard Deviation Calculator – Sample, Population, Variance',
  description:
    'Find sample or population standard deviation and variance with a full deviation table, z-scores, standard error, a 95% confidence interval and the 68-95-99.7 check.',
  accent: 'how spread out?',
  icon: 'σ',
  inputs: [
    { id: 'data', label: 'Data (commas, spaces or new lines)', type: 'text', default: '12, 15, 9, 18, 14, 11, 16, 13, 20, 12', mono: true },
    {
      id: 'kind',
      label: 'Your data is',
      type: 'select',
      default: 'sample',
      options: [
        { value: 'sample', label: 'A sample (divide by n − 1)' },
        { value: 'population', label: 'The whole population (divide by n)' },
      ],
    },
  ],
  compute(v) {
    const xs = parse(v.data);
    if (xs.length < 2) return { primary: { label: '', value: '' }, error: 'Enter at least two numbers.' };
    if (xs.length > 10000) return { primary: { label: '', value: '' }, error: 'Up to 10,000 numbers please.' };
    const s = sdStats(xs);
    const sample = v.kind !== 'population';
    const sd = sample ? s.sampSd : s.popSd;
    const variance = sample ? s.sampVar : s.popVar;
    const se = s.sampSd / Math.sqrt(s.n);
    const tc = t95(s.n - 1);
    const within = (k: number) => xs.filter((x) => Math.abs(x - s.mean) <= k * sd + 1e-12).length / s.n;
    const sorted = [...xs].sort((a, b) => a - b);
    const z = (x: number) => (sd > 0 ? (x - s.mean) / sd : 0);
    const outliers = xs.filter((x) => Math.abs(z(x)) > 3);
    return {
      primary: { label: `${sample ? 'Sample' : 'Population'} standard deviation (${sample ? 's' : 'σ'})`, value: num(sd, 6) },
      rows: [
        { label: `${sample ? 'Sample' : 'Population'} variance (${sample ? 's²' : 'σ²'})`, value: num(variance, 6) },
        { label: `${sample ? 'Population' : 'Sample'} SD, for comparison`, value: num(sample ? s.popSd : s.sampSd, 6) },
        { label: 'Mean', value: num(s.mean, 6) },
        { label: 'Count (n)', value: String(s.n) },
        { label: 'Sum of squared deviations', value: num(s.ss, 6) },
        { label: 'Standard error of the mean', value: num(se, 6) },
        { label: '95% confidence interval for the mean', value: `${num(s.mean - tc * se, 4)} to ${num(s.mean + tc * se, 4)}` },
        { label: 'Coefficient of variation', value: s.mean !== 0 ? pct((sd / Math.abs(s.mean)) * 100, 2) : '—' },
        { label: 'Within ±1 SD / ±2 SD / ±3 SD', value: `${pct(within(1) * 100, 0)} / ${pct(within(2) * 100, 0)} / ${pct(within(3) * 100, 0)}` },
        { label: 'Outliers (|z| > 3)', value: outliers.length ? outliers.map((x) => num(x, 4)).join(', ') : 'none' },
      ],
      table: {
        head: ['x', 'x − mean', '(x − mean)²', 'z-score'],
        rows: xs.slice(0, 500).map((x) => [num(x, 6), num(x - s.mean, 4), num((x - s.mean) ** 2, 4), num(z(x), 3)]),
      },
      chart: sorted.length <= 80 ? { type: 'bar', title: 'Each value’s distance from the mean (z-score)', x: sorted.map((x) => num(x, 2)), series: [{ name: 'z-score', values: sorted.map(z) }], y: 'num2', xTitle: 'Value (sorted)' } : undefined,
      steps: [
        `Mean = Σx ÷ n = ${num(s.mean * s.n, 6)} ÷ ${s.n} = ${num(s.mean, 6)}`,
        `Subtract the mean from each value and square it (see the table)`,
        `Sum of squares = ${num(s.ss, 6)}`,
        `Variance = ${num(s.ss, 6)} ÷ ${sample ? `(n − 1) = ${s.n - 1}` : `n = ${s.n}`} = ${num(variance, 6)}`,
        `Standard deviation = √${num(variance, 6)} = ${num(sd, 6)}`,
      ],
    };
  },
  answer: {
    text: (r) =>
      `For the data <strong>12, 15, 9, 18, 14, 11, 16, 13, 20, 12</strong>, the mean is ${r.rows![2].value}. Squaring each value’s distance from the mean and summing gives ${r.rows![4].value}. Dividing by n − 1 = 9 gives the variance, ${r.rows![0].value}, so the sample standard deviation is <strong>${r.primary.value}</strong>.`,
  },
  intro: [
    'Standard deviation measures how spread out numbers are around their mean. A small standard deviation means the values cluster tightly; a large one means they are widely scattered. It is the square root of the variance, the average squared distance from the mean.',
    'This calculator gives sample and population standard deviation and shows every step: a deviation table, the sum of squares and the division by n or n − 1. It also reports z-scores for each value, the standard error, a 95% confidence interval for the mean, and how much of your data falls within one, two and three standard deviations. That last figure is a quick check against the 68-95-99.7 rule for normal data.',
  ],
  formula: {
    expr: 'Population:  σ = √( Σ(x − μ)² ÷ N )\nSample:      s = √( Σ(x − x̄)² ÷ (n − 1) )\nz = (x − mean) ÷ SD       SE = s ÷ √n\n95% CI = x̄ ± t(0.975, n−1) × SE',
    vars: [
      ['μ, x̄', 'population mean, sample mean'],
      ['n − 1', 'Bessel’s correction: dividing by n would underestimate the spread of the population a sample came from'],
      ['t', 'Student-t critical value; it approaches 1.96 for large samples'],
    ],
    notes: ['Calculations use Welford’s algorithm, which stays accurate even for very large numbers or values that are almost identical.'],
  },
  examples: [
    { title: 'Exam scores (sample)', inputs: { data: '72 85 90 66 85 94 78 85 61 99' }, explain: (r) => `s = ${r.primary.value}; 95% CI for the mean ${r.rows![6].value}.` },
    { title: 'All 8 values in a population', inputs: { data: '2, 4, 4, 4, 5, 5, 7, 9', kind: 'population' }, explain: (r) => `σ = ${r.primary.value} exactly, the textbook example.` },
    { title: 'Daily sales with an outlier', inputs: { data: '210 198 225 205 190 215 201 980 208 199 212 204 196 209 203 207' }, explain: (r) => `SD ${r.primary.value}; outliers: ${r.rows![9].value}.` },
  ],
  analysis() {
    const ns = [2, 3, 5, 10, 20, 30, 50, 100];
    return [
      {
        title: 'Why small samples divide by n − 1',
        insight: 'A sample’s values sit closer to their own mean than to the true population mean, so dividing by n understates the spread. The correction matters most for small samples: with 5 values, the sample SD is 12% larger than the n-divided figure, but with 100 values the difference is only 0.5%.',
        chart: { type: 'line', title: 'Sample SD ÷ population-formula SD, by sample size', x: ns, series: [{ name: 'Ratio √(n ÷ (n−1))', values: ns.map((n) => Math.sqrt(n / (n - 1))) }], y: 'num2', xTitle: 'n' },
      },
      {
        title: 'The 68-95-99.7 rule',
        insight: 'For normally distributed data, about 68% of values fall within one standard deviation of the mean, 95% within two and 99.7% within three. Compare these with the “Within ±1/2/3 SD” row for your data: big differences suggest the data is skewed or has outliers.',
        table: { head: ['Range', 'Share of normal data', 'Outside the range'], rows: [['mean ± 1 SD', '68.27%', '1 in 3'], ['mean ± 2 SD', '95.45%', '1 in 22'], ['mean ± 3 SD', '99.73%', '1 in 370'], ['mean ± 4 SD', '99.994%', '1 in 15,787']] },
      },
    ];
  },
  variantQs: [
    { q: 'Is this a variance calculator?', a: 'Yes. Variance is shown directly below the standard deviation. It is the SD squared, in squared units.' },
    { q: 'Should I use sample or population standard deviation?', a: 'Use population SD when your data includes every member of the group you care about, such as all 30 students in a class. Use sample SD when the data is a subset used to estimate a larger group. This is the usual case in research and surveys.' },
    { q: 'Does it calculate z-scores?', a: 'Yes. The table lists the z-score of every value: how many standard deviations it lies above or below the mean.' },
  ],
  tips: [
    'Standard deviation is in the same units as your data; variance is in squared units.',
    'In Excel, STDEV.S is the sample SD and STDEV.P the population SD.',
    'Report the mean with its standard deviation (spread of the data) or standard error (precision of the mean). They answer different questions.',
  ],
  faqs: [
    { q: 'How do you calculate standard deviation by hand?', a: 'Find the mean. Subtract it from each value and square the result. Add the squares, divide by n − 1 for a sample (or n for a population), and take the square root.' },
    { q: 'What is a good standard deviation?', a: 'There is no universal good value. Compare it with the mean: the coefficient of variation (SD ÷ mean) puts it on a common scale. Below about 10% usually counts as low variability.' },
    { q: 'What is the difference between standard deviation and standard error?', a: 'Standard deviation describes how spread out individual values are. Standard error (SD ÷ √n) describes how precisely the sample mean estimates the true mean. It shrinks as the sample grows.' },
    { q: 'Can standard deviation be negative?', a: 'No. It is a square root of an average of squares, so it is zero (all values equal) or positive.' },
  ],
  sources: [
    { label: 'NIST/SEMATECH e-Handbook – Measures of scale', url: 'https://www.itl.nist.gov/div898/handbook/eda/section3/eda356.htm' },
    { label: 'Welford BP (1962). Note on a method for calculating corrected sums of squares. Technometrics 4(3)', url: 'https://doi.org/10.1080/00401706.1962.10490022' },
  ],
  related: ['average-calculator', 'percentage-calculator', 'random-number-generator', 'grade-calculator', 'scientific-calculator'],
};
export default calc;
