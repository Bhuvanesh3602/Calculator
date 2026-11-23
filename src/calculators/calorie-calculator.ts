import { bodyFields, body, mifflin } from '../lib/health';
import { num } from '../lib/format';
import type { Calculator } from '../lib/types';

const kcal = (n: number) => `${num(Math.round(n), 0)} kcal`;
const GOALS = [
  { value: '-1000', label: 'Lose 2 lb (0.9 kg) per week' },
  { value: '-500', label: 'Lose 1 lb (0.45 kg) per week' },
  { value: '-250', label: 'Lose 0.5 lb (0.23 kg) per week' },
  { value: '0', label: 'Maintain weight' },
  { value: '250', label: 'Gain 0.5 lb per week (lean bulk)' },
  { value: '500', label: 'Gain 1 lb per week' },
];

const calc: Calculator = {
  slug: 'calorie-calculator',
  name: 'Calorie Calculator',
  short: 'Calorie',
  category: 'health',
  keyword: 'calorie calculator',
  volume: 673000,
  variants: ['daily calorie calculator', 'how many calories should I eat', 'calorie intake calculator', 'calories to lose weight calculator'],
  title: 'Calorie Calculator – How Many Calories Should I Eat a Day?',
  description:
    'Find how many calories to eat each day to lose, maintain or gain weight, based on your body and activity level, with safe minimums and a per-meal breakdown.',
  accent: 'for your goal',
  icon: 'C',
  inputs: [...bodyFields({ activity: true }), { id: 'goal', label: 'Goal', type: 'select', default: '-500', options: GOALS }, { id: 'meals', label: 'Meals per day', type: 'number', default: 3, min: 1, max: 8, step: 1 }],
  compute(v) {
    const b = body(v);
    if (!(b.kg > 20) || !(b.cm > 100)) return { primary: { label: '', value: '' }, error: 'Enter a valid height and weight.' };
    const tdee = mifflin(b.kg, b.cm, b.age, b.male) * +v.activity;
    const floor = b.male ? 1500 : 1200;
    const raw = tdee + +v.goal;
    const target = Math.max(raw, floor);
    return {
      primary: { label: 'Eat about', value: kcal(target) + '/day' },
      rows: [
        { label: 'Maintenance (TDEE)', value: kcal(tdee) },
        { label: 'Daily adjustment', value: (+v.goal > 0 ? '+' : '') + kcal(+v.goal) },
        { label: 'Per meal', value: kcal(target / (+v.meals || 3)) },
        { label: 'Per week', value: kcal(target * 7) },
      ],
      note: raw < floor ? `Your goal would put intake below ${floor} kcal, a common minimum without medical supervision — we capped it. Choose a slower rate of loss instead.` : undefined,
      chart: {
        type: 'bar',
        title: 'Daily calories for each goal',
        x: ['−2 lb/wk', '−1 lb/wk', '−0.5 lb/wk', 'Maintain', '+0.5 lb/wk', '+1 lb/wk'],
        series: [{ name: 'Calories', values: GOALS.map((g) => Math.max(tdee + +g.value, floor)) }],
        y: 'int',
        markIndex: GOALS.findIndex((g) => g.value === v.goal),
      },
    };
  },
  answer: {
    text: (r) =>
      `To lose about <strong>1 lb a week</strong>, a lightly active 35-year-old woman who is 5 ft 6 in and 160 lb should eat about <strong>${r.primary.value}</strong>. Her maintenance level is ${r.rows![0].value}, so this is a 500-calorie daily deficit — roughly 3,500 kcal a week.`,
  },
  intro: [
    'A calorie calculator estimates how much energy to eat each day to reach a weight goal. It starts with your maintenance calories (TDEE) and adds or subtracts a set amount depending on whether you want to lose, maintain or gain.',
    'We use the Mifflin-St Jeor equation, standard activity multipliers and goal adjustments of 250–1,000 kcal a day. We also enforce common safety floors (1,200 kcal for women, 1,500 for men) so the tool never suggests an unsafe intake.',
  ],
  formula: {
    expr: 'Target = TDEE + goal adjustment\nTDEE = BMR × activity factor\n1 lb of body weight ≈ 3,500 kcal  →  500 kcal/day ≈ 1 lb/week',
    vars: [
      ['BMR', 'Mifflin-St Jeor basal metabolic rate'],
      ['goal adjustment', '−1,000 to +500 kcal/day'],
    ],
    notes: ['The 3,500-kcal rule is a starting approximation. Real weight loss slows over time because a smaller body needs less energy; our calorie deficit calculator models that.'],
  },
  examples: [
    { title: 'Maintain, moderately active man', inputs: { sex: 'male', age: 30, ft: 5, in: 10, lb: 175, activity: '1.55', goal: '0' }, explain: (r) => `${r.primary.value} keeps weight steady.` },
    { title: 'Lose 0.5 lb/week, age 55', inputs: { age: 55, lb: 175, goal: '-250' }, explain: (r) => `A gentle deficit: ${r.primary.value}.` },
    { title: 'Lean bulk', inputs: { sex: 'male', age: 24, ft: 6, in: 0, lb: 165, activity: '1.725', goal: '250' }, explain: (r) => `${r.primary.value} supports slow muscle gain.` },
  ],
  analysis() {
    const weights = [120, 140, 160, 180, 200, 220, 240];
    const t = weights.map((w) => mifflin(w * 0.4536, 168, 35, false) * 1.375 - 500);
    const tm = weights.map((w) => mifflin(w * 0.4536, 178, 35, true) * 1.375 - 500);
    return [
      {
        title: 'Calories for 1 lb/week loss by body weight',
        insight: `Heavier bodies burn more, so the same 1 lb/week goal allows more food. A lightly active woman (5′6″) at 140 lb would eat about ${num(t[1], 0)} kcal; at 220 lb, about <strong>${num(t[5], 0)} kcal</strong>. As weight drops, the target should be recalculated.`,
        chart: {
          type: 'line',
          title: 'Daily target for −1 lb/week by weight, lightly active, age 35',
          x: weights.map((w) => w + ' lb'),
          series: [
            { name: 'Men (5′10″)', values: tm },
            { name: 'Women (5′6″)', values: t },
          ],
          y: 'int',
          xTitle: 'Current weight',
        },
      },
      {
        title: 'Why the safety floor matters',
        insight:
          'Very low intakes make it hard to meet protein, vitamin and mineral needs, and speed up muscle loss. For smaller, less active people a 1 lb/week target can fall below 1,200 kcal — slower loss (0.5 lb/week) is the safer choice.',
        stats: [
          { label: 'Common minimum, women', value: '1,200 kcal' },
          { label: 'Common minimum, men', value: '1,500 kcal' },
        ],
      },
    ];
  },
  variantQs: [
    { q: 'How many calories should I eat a day?', a: 'Start with your TDEE (maintenance), then subtract about 500 kcal to lose roughly 1 lb a week or add 250 to gain slowly. The calculator does this for you.' },
    { q: 'What is a daily calorie calculator?', a: 'Another name for this tool — it gives a daily intake target. Divide it across meals using the “per meal” line.' },
  ],
  tips: [
    'Weigh food for a week or two — portion guesses are often 20–40% off.',
    'Prioritise protein and fibre to stay full on fewer calories.',
    'Re-check your numbers every 10 lb (5 kg) lost.',
    'Liquid calories (juice, coffee drinks, alcohol) add up quickly.',
  ],
  faqs: [
    { q: 'How many calories do I need to lose weight?', a: 'Roughly your TDEE minus 500 kcal per day for about 1 lb (0.45 kg) a week. Many people start between 1,400 and 2,000 kcal, depending on size and activity.' },
    { q: 'Is 1,200 calories a day enough?', a: 'It is the minimum commonly advised for women without medical supervision. For most adults it is too low to sustain, especially if active.' },
    { q: 'Do I eat back exercise calories?', a: 'Not if you chose an activity level that already includes your exercise. If you picked “sedentary” and add workouts, eat back about half of tracker estimates.' },
    { q: 'Why did my weight loss slow down?', a: 'As you lose weight, your TDEE falls and water fluctuations mask fat loss. Recalculate and give changes two to three weeks before adjusting.' },
  ],
  sources: [
    { label: 'NIH NIDDK – Body Weight Planner', url: 'https://www.niddk.nih.gov/bwp' },
    { label: 'Dietary Guidelines for Americans – estimated calorie needs', url: 'https://www.dietaryguidelines.gov/' },
  ],
  related: ['tdee-calculator', 'calorie-deficit-calculator', 'macro-calculator', 'protein-calculator', 'bmr-calculator', 'bmi-calculator'],
  disclaimer: 'health',
};
export default calc;
