import { bodyFields, body, mifflin, kgTo } from '../lib/health';
import { num } from '../lib/format';
import { addDays, fmtDate } from '../lib/math';
import type { Calculator } from '../lib/types';

/**
 * Week-by-week model: intake fixed at (starting TDEE − deficit); TDEE is
 * recomputed each week from the new weight. 7,700 kcal ≈ 1 kg of body weight.
 */
export function simulate(kg: number, cm: number, age: number, male: boolean, act: number, deficit: number, goalKg: number, maxWeeks = 156) {
  const intake = mifflin(kg, cm, age, male) * act - deficit;
  const path = [kg];
  let w = kg;
  for (let wk = 1; wk <= maxWeeks && w > goalKg; wk++) {
    const tdee = mifflin(w, cm, age, male) * act;
    w -= ((tdee - intake) * 7) / 7700;
    path.push(w);
    if (tdee - intake < 50) break; // plateau
  }
  return { intake, path };
}

const calc: Calculator = {
  slug: 'calorie-deficit-calculator',
  name: 'Calorie Deficit Calculator',
  short: 'Calorie Deficit',
  category: 'health',
  keyword: 'calorie deficit calculator',
  volume: 301000,
  variants: ['weight loss calculator', 'how long to lose weight', 'weight loss date calculator', 'goal weight calculator'],
  title: 'Calorie Deficit Calculator – Realistic Weight-Loss Timeline',
  description:
    'Set a goal weight and daily deficit to get a realistic date. Unlike the 3,500-calorie rule, our model slows as you lose weight — just like your body does.',
  accent: 'with a realistic slowdown',
  icon: '−',
  inputs: [
    ...bodyFields({ activity: true }),
    { id: 'goalLb', label: 'Goal weight', type: 'number', default: 140, min: 40, step: 1, suffix: 'lb', showIf: { field: 'units', in: ['us'] } },
    { id: 'goalKg', label: 'Goal weight', type: 'number', default: 63.5, min: 20, step: 0.5, suffix: 'kg', showIf: { field: 'units', in: ['metric'] } },
    { id: 'deficit', label: 'Daily calorie deficit', type: 'number', default: 500, min: 100, max: 1500, step: 50, suffix: 'kcal' },
  ],
  compute(v) {
    const b = body(v);
    const goal = b.metric ? +v.goalKg : +v.goalLb * 0.45359237;
    if (!(goal > 20) || goal >= b.kg) return { primary: { label: '', value: '' }, error: 'Set a goal weight below your current weight.' };
    const s = simulate(b.kg, b.cm, b.age, b.male, +v.activity, +v.deficit, goal);
    const reached = s.path.at(-1)! <= goal + 0.05;
    const weeks = s.path.length - 1;
    const naiveWeeks = ((b.kg - goal) * 7700) / (+v.deficit * 7);
    return {
      primary: reached ? { label: 'Goal reached around', value: fmtDate(addDays(new Date(), weeks * 7)) } : { label: 'Weight levels off near', value: kgTo(s.path.at(-1)!, b.metric) },
      rows: [
        { label: 'Daily intake', value: `${num(Math.round(s.intake), 0)} kcal` },
        { label: 'Weeks needed', value: reached ? String(weeks) : 'goal not reached at this intake' },
        { label: '3,500-kcal rule would say', value: `${Math.ceil(naiveWeeks)} weeks` },
        { label: 'Total to lose', value: kgTo(b.kg - goal, b.metric) },
        { label: 'First-month loss', value: kgTo(b.kg - s.path[Math.min(4, s.path.length - 1)], b.metric) },
      ],
      note: reached ? undefined : 'As you lose weight your maintenance falls toward your intake. To keep losing, recalculate and lower intake slightly, or add activity.',
      chart: {
        type: 'line',
        title: 'Projected weight, week by week',
        x: s.path.map((_, i) => 'Wk ' + i),
        series: [{ name: 'Weight', values: s.path.map((k) => (b.metric ? k : k / 0.45359237)) }],
        y: 'num',
        xTitle: 'Week',
      },
    };
  },
  answer: {
    text: (r) =>
      `Going from 160 lb to 140 lb on a 500-calorie daily deficit (about ${r.rows![0].value} a day for a lightly active 5′6″ woman) takes roughly <strong>${r.rows![1].value} weeks</strong> in our model — longer than the <strong>${r.rows![2].value}</strong> the simple 3,500-calorie rule predicts, because maintenance calories fall as weight drops.`,
  },
  intro: [
    'A calorie deficit means eating fewer calories than your body burns. This calculator turns a deficit into a realistic timeline to your goal weight.',
    'Most tools use the 3,500-calories-per-pound rule, which assumes loss stays steady forever. In reality, a lighter body burns less, so the same intake produces a shrinking deficit. We re-calculate your maintenance every week, so the curve bends the way real weight-loss curves do — and we show the simple-rule answer alongside for comparison.',
  ],
  formula: {
    expr: 'Intake = TDEE(start) − deficit\nEach week: loss (kg) = (TDEE(current weight) − Intake) × 7 ÷ 7,700',
    vars: [
      ['TDEE', 'Mifflin-St Jeor BMR × activity factor'],
      ['7,700', 'approximate kcal per kg of body weight lost (≈3,500 per lb)'],
    ],
    notes: ['This is a simplified energy-balance model. Early weeks often show faster loss from water and glycogen; NIH’s Body Weight Planner uses a more detailed model built on the same principle.'],
  },
  examples: [
    { title: 'Lose 10 lb, small deficit', inputs: { lb: 160, goalLb: 150, deficit: 300 }, explain: (r) => `About ${r.rows![1].value} weeks — slow but easy to sustain.` },
    { title: 'Lose 40 lb', inputs: { sex: 'male', age: 40, ft: 5, in: 11, lb: 240, goalLb: 200, activity: '1.55', deficit: 600 }, explain: (r) => `Reaches goal around ${r.primary.value}.` },
    { title: 'Metric: 80 → 72 kg', inputs: { units: 'metric', cm: 165, kg: 80, goalKg: 72, deficit: 500 }, explain: (r) => `First month: ${r.rows![4].value}.` },
  ],
  analysis() {
    const kg = 72.57,
      goal = 63.5;
    const defs = [250, 500, 750, 1000];
    const runs = defs.map((d) => simulate(kg, 167.6, 35, false, 1.375, d, goal));
    const naive = defs.map((d) => ((kg - goal) * 7700) / (d * 7));
    const long = simulate(kg, 167.6, 35, false, 1.375, 500, 40, 104).path;
    return [
      {
        title: 'Real timelines vs the 3,500-calorie rule',
        insight: `Losing 20 lb (160 → 140) on a 500 kcal deficit takes about <strong>${runs[1].path.length - 1} weeks</strong> in our adaptive model versus ${Math.ceil(naive[1])} with the simple rule. Bigger deficits get you there faster, but the gap between the two methods narrows.`,
        chart: {
          type: 'bar',
          title: 'Weeks to lose 20 lb by daily deficit',
          x: defs.map((d) => d + ' kcal'),
          series: [
            { name: 'Adaptive model', values: runs.map((r) => r.path.length - 1) },
            { name: '3,500-kcal rule', values: naive },
          ],
          y: 'int',
          xTitle: 'Daily deficit',
        },
      },
      {
        title: 'Why weight loss plateaus',
        insight: `Holding the same intake forever, the woman in our example would keep losing more and more slowly, settling near <strong>${(long.at(-1)! / 0.4536).toFixed(0)} lb</strong> after two years — the weight at which her new maintenance equals her intake. Plateaus are physics, not failure.`,
        chart: { type: 'line', title: 'Fixed intake for 2 years, starting 160 lb', x: long.map((_, i) => 'Wk ' + i), series: [{ name: 'Weight (lb)', values: long.map((k) => k / 0.4536) }], y: 'num', xTitle: 'Week' },
      },
    ];
  },
  variantQs: [
    { q: 'Is this a weight loss calculator?', a: 'Yes. Enter your current and goal weight and a daily deficit, and it predicts when you’ll reach your goal and how much you’ll lose in the first month.' },
    { q: 'How long will it take to lose weight?', a: 'At a 500 kcal/day deficit, expect about 0.5–1 lb a week, slowing over time. Your exact timeline is in the result card.' },
  ],
  tips: [
    'A deficit of 300–500 kcal is easier to sustain than a crash diet.',
    'Keep protein high and include strength training to preserve muscle.',
    'Expect a faster first week (water) and slower weeks later.',
    'Judge progress on 2–4 week averages, not daily weigh-ins.',
  ],
  faqs: [
    { q: 'What is a good calorie deficit?', a: 'For most people, 300–500 kcal below maintenance. That supports about 0.5–1 lb (0.25–0.5 kg) of loss a week while preserving muscle and energy.' },
    { q: 'Is a 1,000-calorie deficit safe?', a: 'It can be for people with a lot of weight to lose, ideally with medical guidance. For smaller people, it may push intake too low.' },
    { q: 'Why am I not losing weight in a deficit?', a: 'Most often intake is higher than tracked, activity lower than assumed, or water retention is masking fat loss. Give it 2–3 weeks of careful tracking.' },
    { q: 'How many calories is a pound of fat?', a: 'About 3,500 kcal (7,700 kcal per kg) is the usual estimate, though the energy in lost tissue varies.' },
  ],
  sources: [
    { label: 'Hall KD et al. (2011), Lancet – Quantification of the effect of energy imbalance on bodyweight', url: 'https://pubmed.ncbi.nlm.nih.gov/21872751/' },
    { label: 'NIH NIDDK – Body Weight Planner', url: 'https://www.niddk.nih.gov/bwp' },
  ],
  related: ['calorie-calculator', 'tdee-calculator', 'macro-calculator', 'protein-calculator', 'bmi-calculator', 'body-fat-calculator'],
  disclaimer: 'health',
};
export default calc;
