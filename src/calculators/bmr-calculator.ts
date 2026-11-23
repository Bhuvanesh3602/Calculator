import { bodyFields, body, mifflin, harris, katch } from '../lib/health';
import { num } from '../lib/format';
import type { Calculator } from '../lib/types';

const kcal = (n: number) => `${num(Math.round(n), 0)} kcal`;

const calc: Calculator = {
  slug: 'bmr-calculator',
  name: 'BMR Calculator',
  short: 'BMR',
  category: 'health',
  keyword: 'bmr calculator',
  volume: 165000,
  variants: ['basal metabolic rate calculator', 'resting metabolic rate calculator', 'mifflin st jeor calculator', 'harris benedict calculator'],
  title: 'BMR Calculator – Basal Metabolic Rate, 3 Formulas Compared',
  description:
    'Calculate your basal metabolic rate with Mifflin-St Jeor, Harris-Benedict and Katch-McArdle side by side, and see how age and muscle change it.',
  accent: 'three formulas, side by side',
  icon: '♥',
  inputs: [...bodyFields(), { id: 'bf', label: 'Body fat % (optional, for Katch-McArdle)', type: 'number', default: 0, min: 0, max: 60, step: 0.5, suffix: '%' }],
  compute(v) {
    const b = body(v);
    if (!(b.kg > 20) || !(b.cm > 100)) return { primary: { label: '', value: '' }, error: 'Enter a valid height and weight.' };
    const m = mifflin(b.kg, b.cm, b.age, b.male),
      h = harris(b.kg, b.cm, b.age, b.male);
    const k = +v.bf > 0 ? katch(b.kg, +v.bf) : NaN;
    const names = ['Mifflin-St Jeor', 'Harris-Benedict', ...(isFinite(k) ? ['Katch-McArdle'] : [])];
    const vals = [m, h, ...(isFinite(k) ? [k] : [])];
    return {
      primary: { label: 'BMR (Mifflin-St Jeor)', value: kcal(m) + '/day' },
      rows: [
        { label: 'Harris-Benedict (revised)', value: kcal(h) },
        { label: 'Katch-McArdle', value: isFinite(k) ? kcal(k) : 'add body fat %' },
        { label: 'Per hour at rest', value: kcal(m / 24) },
        { label: 'Daily burn if sedentary (×1.2)', value: kcal(m * 1.2) },
      ],
      chart: { type: 'bar', title: 'BMR by formula', x: names, series: [{ name: 'BMR', values: vals }], y: 'int' },
    };
  },
  answer: {
    text: (r) =>
      `A 35-year-old woman who is 5 ft 6 in and 160 lb has a basal metabolic rate of about <strong>${r.primary.value}</strong> using the Mifflin-St Jeor equation — the calories her body burns at complete rest. The older Harris-Benedict formula gives <strong>${r.rows![0].value}</strong>.`,
  },
  intro: [
    'Your basal metabolic rate (BMR) is the energy your body uses to stay alive at rest: breathing, circulation, keeping warm and repairing cells. For most people it is the largest part of daily calorie burn — typically 60–70%.',
    'This BMR calculator runs three well-known prediction equations side by side. Mifflin-St Jeor is the one most dietitians use today; Harris-Benedict is the classic; Katch-McArdle uses lean body mass, so it can be more accurate if you know your body fat percentage.',
  ],
  formula: {
    expr: 'Mifflin-St Jeor: 10W + 6.25H − 5A + 5 (men) / −161 (women)\nHarris-Benedict (men): 88.362 + 13.397W + 4.799H − 5.677A\nHarris-Benedict (women): 447.593 + 9.247W + 3.098H − 4.330A\nKatch-McArdle: 370 + 21.6 × lean mass (kg)',
    vars: [
      ['W', 'weight in kg'],
      ['H', 'height in cm'],
      ['A', 'age in years'],
    ],
  },
  examples: [
    { title: '25-year-old man, 180 lb, 5′10″', inputs: { sex: 'male', age: 25, ft: 5, in: 10, lb: 180 }, explain: (r) => `About ${r.primary.value} at rest.` },
    { title: '60-year-old woman, 140 lb, 5′4″', inputs: { sex: 'female', age: 60, ft: 5, in: 4, lb: 140 }, explain: (r) => `Lower BMR with age: ${r.primary.value}.` },
    { title: 'Lean athlete, 15% body fat', inputs: { sex: 'male', age: 30, ft: 6, in: 0, lb: 190, bf: 15 }, explain: (r) => `Katch-McArdle gives ${r.rows![1].value} using lean mass.` },
  ],
  analysis() {
    const ages = [20, 30, 40, 50, 60, 70, 80];
    const kg = 72.5,
      cm = 168;
    const f = ages.map((a) => mifflin(kg, cm, a, false));
    const mm = ages.map((a) => mifflin(kg, cm, a, true));
    const bfs = [10, 15, 20, 25, 30, 35];
    const kat = bfs.map((x) => katch(80, x));
    return [
      {
        title: 'BMR falls about 50 kcal per decade',
        insight: `In the Mifflin-St Jeor equation, every 10 years of age lowers BMR by exactly 50 kcal/day. A woman of 168 cm and 72.5 kg burns ${num(f[0], 0)} kcal at 20 but <strong>${num(f[5], 0)} at 70</strong>. Men of the same size are always 166 kcal higher.`,
        chart: {
          type: 'line',
          title: 'BMR by age (168 cm, 72.5 kg)',
          x: ages.map((a) => a + ' yrs'),
          series: [
            { name: 'Men', values: mm },
            { name: 'Women', values: f },
          ],
          y: 'int',
          xTitle: 'Age',
        },
      },
      {
        title: 'Muscle matters: same weight, different BMR',
        insight: `For an 80 kg person, Katch-McArdle gives ${num(kat[0], 0)} kcal at 10% body fat and <strong>${num(kat[5], 0)} kcal at 35%</strong>. Lean tissue burns more energy than fat, which is why strength training helps preserve metabolism during weight loss.`,
        chart: { type: 'bar', title: 'Katch-McArdle BMR for an 80 kg person by body fat', x: bfs.map((x) => x + '%'), series: [{ name: 'BMR', values: kat }], y: 'int', xTitle: 'Body fat' },
      },
    ];
  },
  variantQs: [
    { q: 'Is BMR the same as resting metabolic rate (RMR)?', a: 'Nearly. BMR is measured under strict lab conditions; RMR is measured at rest with fewer restrictions and runs slightly higher. Prediction formulas are used interchangeably for both.' },
    { q: 'Which is better, Mifflin-St Jeor or Harris-Benedict?', a: 'Studies comparing them with measured metabolism generally find Mifflin-St Jeor closer for most adults, which is why the Academy of Nutrition and Dietetics recommends it.' },
  ],
  tips: [
    'Don’t eat below your BMR for long periods without medical supervision.',
    'Multiply BMR by an activity factor (our TDEE calculator does this) to get daily calorie needs.',
    'If you know your body fat from a DEXA scan, Katch-McArdle is likely the best estimate.',
  ],
  faqs: [
    { q: 'What is a normal BMR?', a: 'Most adult women fall roughly between 1,200 and 1,600 kcal/day and men between 1,500 and 2,000, depending on size, age and muscle mass.' },
    { q: 'How accurate are BMR calculators?', a: 'For most people Mifflin-St Jeor is within about 10% of measured values, but individual errors can be larger. Track your weight over a few weeks to calibrate.' },
    { q: 'Can I increase my BMR?', a: 'Building muscle raises it modestly. Bigger bodies also burn more, so BMR falls as you lose weight.' },
    { q: 'Does BMR include exercise?', a: 'No. BMR is calories burned at complete rest. Total daily energy expenditure (TDEE) adds activity and digestion.' },
  ],
  sources: [
    { label: 'Mifflin MD et al. (1990), Am J Clin Nutr 51:241–247', url: 'https://pubmed.ncbi.nlm.nih.gov/2305711/' },
    { label: 'Frankenfield D et al. (2005), J Am Diet Assoc – comparison of predictive equations', url: 'https://pubmed.ncbi.nlm.nih.gov/15883556/' },
  ],
  related: ['tdee-calculator', 'calorie-calculator', 'calorie-deficit-calculator', 'macro-calculator', 'body-fat-calculator', 'bmi-calculator'],
  disclaimer: 'health',
};
export default calc;
