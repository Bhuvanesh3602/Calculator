import { num } from '../lib/format';
import type { Calculator, Values } from '../lib/types';

const ftIn = (inches: number) => `${Math.floor(inches / 12)} ft ${num(inches % 12, 1)} in`;

/** Mid-parental height method (Tanner): ±13 cm / ±5 in covers ~95% of children. */
export function midParental(v: Values) {
  const metric = v.units === 'metric';
  const mom = metric ? +v.momCm / 2.54 : +v.momFt * 12 + +v.momIn;
  const dad = metric ? +v.dadCm / 2.54 : +v.dadFt * 12 + +v.dadIn;
  const target = v.sex === 'male' ? (mom + dad + 5) / 2 : (mom + dad - 5) / 2;
  return { target, lo: target - 4, hi: target + 4, mom, dad, metric };
}
const fmtH = (inches: number, metric: boolean) => (metric ? `${num(inches * 2.54, 1)} cm` : ftIn(inches));

const calc: Calculator = {
  slug: 'height-calculator',
  name: 'Height Calculator',
  short: 'Height',
  category: 'health',
  keyword: 'height calculator',
  volume: 165000,
  variants: ['child height predictor', 'how tall will I be', 'adult height calculator', 'mid parental height calculator'],
  title: 'Height Calculator – How Tall Will My Child Be? (Mid-Parental)',
  description:
    'Predict a child’s adult height from both parents’ heights using the mid-parental method pediatricians use, with the likely range and what affects it.',
  accent: 'from both parents',
  icon: '↕',
  inputs: [
    {
      id: 'units',
      label: 'Units',
      type: 'select',
      default: 'us',
      options: [
        { value: 'us', label: 'Feet & inches' },
        { value: 'metric', label: 'Centimetres' },
      ],
    },
    {
      id: 'sex',
      label: 'Child’s sex',
      type: 'select',
      default: 'female',
      options: [
        { value: 'female', label: 'Girl' },
        { value: 'male', label: 'Boy' },
      ],
    },
    { id: 'momFt', label: 'Mother (ft)', type: 'number', default: 5, min: 3, max: 7, step: 1, showIf: { field: 'units', in: ['us'] } },
    { id: 'momIn', label: 'Mother (in)', type: 'number', default: 5, min: 0, max: 11.5, step: 0.5, showIf: { field: 'units', in: ['us'] } },
    { id: 'dadFt', label: 'Father (ft)', type: 'number', default: 5, min: 3, max: 7, step: 1, showIf: { field: 'units', in: ['us'] } },
    { id: 'dadIn', label: 'Father (in)', type: 'number', default: 10, min: 0, max: 11.5, step: 0.5, showIf: { field: 'units', in: ['us'] } },
    { id: 'momCm', label: 'Mother', type: 'number', default: 165, min: 120, max: 210, step: 0.5, suffix: 'cm', showIf: { field: 'units', in: ['metric'] } },
    { id: 'dadCm', label: 'Father', type: 'number', default: 178, min: 120, max: 230, step: 0.5, suffix: 'cm', showIf: { field: 'units', in: ['metric'] } },
  ],
  compute(v) {
    const p = midParental(v);
    if (!(p.mom > 40) || !(p.dad > 40)) return { primary: { label: '', value: '' }, error: 'Enter both parents’ heights.' };
    return {
      primary: { label: 'Predicted adult height', value: fmtH(p.target, p.metric) },
      rows: [
        { label: 'Likely range (about 95% of children)', value: `${fmtH(p.lo, p.metric)} – ${fmtH(p.hi, p.metric)}` },
        { label: 'Mid-parent average', value: fmtH((p.mom + p.dad) / 2, p.metric) },
      ],
      chart: {
        type: 'bar',
        title: 'Parents and predicted child height',
        x: ['Mother', 'Father', 'Low end', 'Predicted', 'High end'],
        series: [{ name: 'Height', values: [p.mom, p.dad, p.lo, p.target, p.hi].map((x) => (p.metric ? x * 2.54 : x)) }],
        y: 'num',
        xTitle: p.metric ? 'Height (cm)' : 'Height (inches)',
      },
    };
  },
  answer: {
    text: (r) =>
      `A girl whose mother is 5 ft 5 in and father is 5 ft 10 in is predicted to reach about <strong>${r.primary.value}</strong> as an adult, using the mid-parental method. Most children land within about 4 inches either side: <strong>${r.rows![0].value}</strong>.`,
  },
  intro: [
    'A height calculator for children predicts adult height from the parents’ heights. Height is strongly inherited, so the average of both parents — adjusted for the child’s sex — is a reasonable first estimate.',
    'This calculator uses the mid-parental (target height) method that pediatricians use when reviewing growth charts. It gives a central prediction and a range; nutrition, health and timing of puberty move children within that range.',
  ],
  formula: {
    expr: 'Boys:  (mother + father + 5 in) ÷ 2   [+13 cm metric]\nGirls: (mother + father − 5 in) ÷ 2   [−13 cm metric]\nRange ≈ prediction ± 4 in (≈ ±10 cm)',
    vars: [
      ['5 in / 13 cm', 'average height difference between adult men and women'],
      ['range', 'most children fall within this band of the target'],
    ],
  },
  examples: [
    { title: 'Boy, tall parents', inputs: { sex: 'male', momFt: 5, momIn: 9, dadFt: 6, dadIn: 3 }, explain: (r) => `Predicted ${r.primary.value}.` },
    { title: 'Girl, metric', inputs: { units: 'metric', momCm: 160, dadCm: 175 }, explain: (r) => `Range ${r.rows![0].value}.` },
    { title: 'Boy, average parents', inputs: { sex: 'male', momFt: 5, momIn: 4, dadFt: 5, dadIn: 9 }, explain: (r) => `About ${r.primary.value}.` },
  ],
  analysis() {
    const mid = [62, 64, 66, 68, 70, 72];
    return [
      {
        title: 'Same parents, different predictions for sons and daughters',
        insight: 'For any pair of parents, the predicted son is 5 inches taller than the predicted daughter — the average adult sex difference. Each 1 inch increase in the parents’ average adds 1 inch to the prediction.',
        chart: {
          type: 'bar',
          title: 'Predicted adult height by parents’ average height (inches)',
          x: mid.map((m) => ftIn(m)),
          series: [
            { name: 'Son', values: mid.map((m) => m + 2.5) },
            { name: 'Daughter', values: mid.map((m) => m - 2.5) },
          ],
          y: 'num',
          xTitle: 'Average of both parents',
        },
      },
      {
        title: 'Regression to the mean',
        insight: 'Children of very tall or very short parents tend to end up closer to the population average than their parents. Simple mid-parental formulas slightly over-predict for very tall families and under-predict for very short ones.',
        stats: [
          { label: 'Typical prediction error', value: '±2–4 in' },
          { label: 'Usual growth end, girls', value: '~14–16 yrs' },
          { label: 'Usual growth end, boys', value: '~16–18 yrs' },
        ],
      },
    ];
  },
  variantQs: [
    { q: 'How tall will I be?', a: 'If you are still growing, enter your parents’ heights and your sex. Methods that also use your current height, age and bone age (assessed by a doctor) are more precise.' },
    { q: 'What is a mid-parental height calculator?', a: 'It is this calculator: it averages parents’ heights and adjusts for sex to give a “target height” used by pediatricians.' },
  ],
  tips: [
    'Use measured, not self-reported, heights for parents if possible.',
    'A child tracking well below their target on growth charts is worth discussing with a pediatrician.',
    'Good sleep, nutrition and treating chronic illness help children reach their potential.',
  ],
  faqs: [
    { q: 'How accurate is predicting height from parents?', a: 'Most children end up within about 4 inches (10 cm) of the mid-parental target. Methods using bone-age X-rays are more precise.' },
    { q: 'Can a child be taller than both parents?', a: 'Yes. Genetics mix in many ways, and better nutrition across generations has raised average heights.' },
    { q: 'At what age do kids stop growing?', a: 'Girls typically reach adult height around 14–16 and boys around 16–18, though it varies with the timing of puberty.' },
    { q: 'Does the double-height-at-age-2 rule work?', a: 'It is a rough folk rule for boys (and age 18 months for girls). The mid-parental method is generally preferred.' },
  ],
  sources: [
    { label: 'Tanner JM et al. (1970), Arch Dis Child – Standards for children’s height at ages 2–9 allowing for height of parents', url: 'https://pubmed.ncbi.nlm.nih.gov/5440182/' },
    { label: 'CDC – Growth charts', url: 'https://www.cdc.gov/growthcharts/' },
  ],
  related: ['bmi-calculator', 'age-calculator', 'pregnancy-calculator', 'due-date-calculator'],
  disclaimer: 'health',
};
export default calc;
