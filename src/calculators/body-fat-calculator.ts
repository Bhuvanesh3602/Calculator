import { bodyFields, body, bmi, kgTo } from '../lib/health';
import { num, pct } from '../lib/format';
import type { Calculator, Field } from '../lib/types';

export function navyBF(male: boolean, heightIn: number, neckIn: number, waistIn: number, hipIn: number) {
  return male
    ? 86.01 * Math.log10(waistIn - neckIn) - 70.041 * Math.log10(heightIn) + 36.76
    : 163.205 * Math.log10(waistIn + hipIn - neckIn) - 97.684 * Math.log10(heightIn) - 78.387;
}
export const deurenberg = (b: number, age: number, male: boolean) => 1.2 * b + 0.23 * age - 10.8 * (male ? 1 : 0) - 5.4;
export function aceCategory(bf: number, male: boolean) {
  const t = male ? [6, 14, 18, 25] : [14, 21, 25, 32];
  return bf < t[0] ? 'Essential fat' : bf < t[1] ? 'Athletes' : bf < t[2] ? 'Fitness' : bf < t[3] ? 'Average' : 'Obese';
}

const tape = (id: string, label: string, inDef: number, cmDef: number, help?: string): Field[] => [
  { id: id + 'In', label, type: 'number', default: inDef, min: 5, max: 80, step: 0.25, suffix: 'in', help, showIf: { field: 'units', in: ['us'] } },
  { id: id + 'Cm', label, type: 'number', default: cmDef, min: 10, max: 200, step: 0.5, suffix: 'cm', help, showIf: { field: 'units', in: ['metric'] } },
];

const calc: Calculator = {
  slug: 'body-fat-calculator',
  name: 'Body Fat Calculator',
  short: 'Body Fat',
  category: 'health',
  keyword: 'body fat calculator',
  volume: 74000,
  variants: ['body fat percentage calculator', 'navy body fat calculator', 'army body fat calculator', 'lean body mass calculator'],
  title: 'Body Fat Calculator – U.S. Navy Tape Method & BMI Estimate',
  description:
    'Estimate body fat percentage with the U.S. Navy tape-measure method and compare it with a BMI-based estimate. See your fat mass, lean mass and ACE category.',
  accent: 'with just a tape measure',
  icon: 'F',
  inputs: [
    ...bodyFields(),
    ...tape('neck', 'Neck (below the larynx)', 14, 35.5),
    ...tape('waist', 'Waist', 33, 84, 'Men: at the navel. Women: at the narrowest point.'),
    ...tape('hip', 'Hips (women only)', 40, 101.5, 'Widest point of the buttocks.'),
  ],
  compute(v) {
    const b = body(v);
    const toIn = (id: string) => (b.metric ? +v[id + 'Cm'] / 2.54 : +v[id + 'In']);
    const hIn = b.cm / 2.54;
    const neck = toIn('neck'),
      waist = toIn('waist'),
      hip = toIn('hip');
    if (waist <= neck) return { primary: { label: '', value: '' }, error: 'Waist must be larger than neck for the Navy formula.' };
    const navy = navyBF(b.male, hIn, neck, waist, hip);
    const bm = deurenberg(bmi(b.kg, b.m), b.age, b.male);
    if (!isFinite(navy) || navy < 2 || navy > 70) return { primary: { label: '', value: '' }, error: 'Those measurements give an implausible result — please re-measure.' };
    const fat = (b.kg * navy) / 100;
    return {
      primary: { label: `Body fat (U.S. Navy) · ${aceCategory(navy, b.male)}`, value: pct(navy, 1) },
      rows: [
        { label: 'Fat mass', value: kgTo(fat, b.metric) },
        { label: 'Lean mass', value: kgTo(b.kg - fat, b.metric) },
        { label: 'BMI-based estimate (Deurenberg)', value: pct(bm, 1) },
        { label: 'Difference between methods', value: num(Math.abs(navy - bm), 1) + ' points' },
      ],
      chart: {
        type: 'bar',
        title: 'Your estimate vs ACE category upper limits',
        x: ['You (Navy)', 'You (BMI)', 'Athletes', 'Fitness', 'Average'],
        series: [{ name: 'Body fat %', values: [navy, bm, ...(b.male ? [13, 17, 24] : [20, 24, 31])] }],
        y: 'pct',
      },
    };
  },
  answer: {
    text: (r) =>
      `A 35-year-old woman, 5 ft 6 in and 160 lb, with a 14 in neck, 33 in waist and 40 in hips has about <strong>${r.primary.value} body fat</strong> by the U.S. Navy formula — ${r.rows![0].value} of fat and ${r.rows![1].value} of lean mass. The BMI-based estimate is ${r.rows![2].value}.`,
  },
  intro: [
    'Body fat percentage is the share of your weight that is fat. Unlike BMI, it separates fat from muscle, bone and water, so it says more about health and fitness.',
    'This body fat calculator uses the U.S. Navy circumference method — the same tape-measure formula the military uses — and compares it with a BMI-based estimate (Deurenberg). Seeing both shows how much your build differs from the average your BMI assumes.',
  ],
  formula: {
    expr: 'Men:   %BF = 86.010·log10(waist − neck) − 70.041·log10(height) + 36.76\nWomen: %BF = 163.205·log10(waist + hip − neck) − 97.684·log10(height) − 78.387\nBMI method: %BF = 1.2·BMI + 0.23·age − 10.8·(1 if male) − 5.4',
    vars: [
      ['measurements', 'in inches for the Navy formula'],
      ['age', 'years'],
    ],
    notes: ['Tape methods are typically within about 3–4 percentage points of lab methods like DEXA. Measure three times and average.'],
  },
  examples: [
    { title: 'Fit man', inputs: { sex: 'male', age: 30, ft: 5, in: 11, lb: 175, neckIn: 15.5, waistIn: 32 }, explain: (r) => `${r.primary.value} — the BMI method says ${r.rows![2].value}.` },
    { title: 'Muscular man, high BMI', inputs: { sex: 'male', age: 28, ft: 5, in: 10, lb: 205, neckIn: 17, waistIn: 33 }, explain: (r) => `BMI suggests overweight, but tape method gives ${r.primary.value}.` },
    { title: 'Woman, metric', inputs: { units: 'metric', age: 45, cm: 163, kg: 68, neckCm: 33, waistCm: 80, hipCm: 102 }, explain: (r) => `${r.primary.value}; lean mass ${r.rows![1].value}.` },
  ],
  analysis() {
    const waists = [28, 30, 32, 34, 36, 38, 40, 42];
    const men = waists.map((w) => navyBF(true, 70, 15, w, 0));
    const women = waists.map((w) => navyBF(false, 65, 13, w, w + 8));
    return [
      {
        title: 'Waist size drives the Navy estimate',
        insight: `For a 5′10″ man with a 15″ neck, each 2 inches of waist adds roughly <strong>${num((men[7] - men[0]) / 7, 1)} points</strong> of estimated body fat. Losing waist inches is the clearest sign of fat loss on this method.`,
        chart: {
          type: 'line',
          title: 'Navy body fat % by waist size',
          x: waists.map((w) => w + '″'),
          series: [
            { name: 'Men (5′10″, 15″ neck)', values: men },
            { name: 'Women (5′5″, 13″ neck, hip = waist+8″)', values: women },
          ],
          y: 'pct',
          xTitle: 'Waist',
        },
      },
      {
        title: 'Healthy ranges by sex (ACE)',
        insight: 'Women naturally carry more essential fat than men. The American Council on Exercise categories below are a widely used reference.',
        table: {
          head: ['Category', 'Women', 'Men'],
          rows: [
            ['Essential fat', '10–13%', '2–5%'],
            ['Athletes', '14–20%', '6–13%'],
            ['Fitness', '21–24%', '14–17%'],
            ['Average', '25–31%', '18–24%'],
            ['Obese', '32%+', '25%+'],
          ],
        },
      },
    ];
  },
  variantQs: [
    { q: 'Is this the Navy body fat calculator?', a: 'Yes. It uses the U.S. Navy circumference equations. The Army now uses a single waist-based formula, so results can differ slightly from Army tape tests.' },
    { q: 'How do I calculate lean body mass?', a: 'Lean mass = weight × (1 − body fat %). The result card shows it — useful for the Katch-McArdle BMR formula.' },
  ],
  tips: [
    'Measure in the morning, relaxed, with the tape snug but not compressing skin.',
    'Take each measurement three times and use the average.',
    'Track the trend, not single readings; water and posture shift results.',
  ],
  faqs: [
    { q: 'What is a healthy body fat percentage?', a: 'Roughly 21–31% for women and 14–24% for men falls in the fitness-to-average range. Very low levels are not healthier.' },
    { q: 'How accurate is the Navy method?', a: 'Studies typically find it within about 3–4 percentage points of DEXA for most people, less accurate at very high or low body fat.' },
    { q: 'Is body fat better than BMI?', a: 'It is more informative for individuals because it separates fat from muscle, but it is harder to measure accurately.' },
    { q: 'What is the most accurate body fat test?', a: 'DEXA scans, hydrostatic weighing and air displacement (Bod Pod) are the most accurate common methods.' },
  ],
  sources: [
    { label: 'Hodgdon JA, Beckett MB (1984) – Prediction of percent body fat for U.S. Navy men and women', url: 'https://apps.dtic.mil/sti/citations/ADA143890' },
    { label: 'Deurenberg P et al. (1991), Br J Nutr – BMI as a measure of body fatness', url: 'https://pubmed.ncbi.nlm.nih.gov/2043597/' },
    { label: 'ACE – Body fat percentage chart', url: 'https://www.acefitness.org/' },
  ],
  related: ['bmi-calculator', 'bmr-calculator', 'protein-calculator', 'calorie-deficit-calculator', 'macro-calculator'],
  disclaimer: 'health',
};
export default calc;
