import { bodyFields, body, mifflin, ACTIVITY } from '../lib/health';
import { num } from '../lib/format';
import type { Calculator } from '../lib/types';

const kcal = (n: number) => `${num(Math.round(n), 0)} kcal`;

const calc: Calculator = {
  slug: 'tdee-calculator',
  name: 'TDEE Calculator',
  short: 'TDEE',
  category: 'health',
  keyword: 'tdee calculator',
  volume: 550000,
  variants: ['total daily energy expenditure calculator', 'maintenance calories calculator', 'how many calories do I burn a day'],
  title: 'TDEE Calculator – Total Daily Energy Expenditure',
  description:
    'Find your total daily energy expenditure — the calories you burn in a day — for every activity level, plus a breakdown of BMR, exercise and digestion.',
  accent: 'your maintenance number',
  icon: 'T',
  inputs: bodyFields({ activity: true }),
  compute(v) {
    const b = body(v);
    if (!(b.kg > 20) || !(b.cm > 100)) return { primary: { label: '', value: '' }, error: 'Enter a valid height and weight.' };
    const bmr = mifflin(b.kg, b.cm, b.age, b.male);
    const f = +v.activity;
    const tdee = bmr * f;
    const tef = tdee * 0.1;
    return {
      primary: { label: 'Your TDEE (maintenance)', value: kcal(tdee) + '/day' },
      rows: [
        { label: 'BMR (at rest)', value: kcal(bmr) },
        { label: 'Activity & exercise', value: kcal(tdee - bmr - tef) },
        { label: 'Digestion (≈10%)', value: kcal(tef) },
        { label: 'Per week', value: kcal(tdee * 7) },
      ],
      chart: {
        type: 'bar',
        title: 'TDEE at each activity level',
        x: ['Sedentary', 'Light', 'Moderate', 'Very active', 'Extra'],
        series: [{ name: 'TDEE', values: ACTIVITY.map((a) => bmr * +a.value) }],
        y: 'int',
        markIndex: ACTIVITY.findIndex((a) => a.value === v.activity),
      },
    };
  },
  answer: {
    text: (r) =>
      `A lightly active 35-year-old woman who is 5 ft 6 in and 160 lb burns about <strong>${r.primary.value}</strong> — her total daily energy expenditure (TDEE). That is her maintenance level: eating this much keeps weight stable. Her BMR accounts for <strong>${r.rows![0].value}</strong> of it.`,
  },
  intro: [
    'Total daily energy expenditure (TDEE) is the number of calories you burn in a full day: your basal metabolic rate, plus the energy used digesting food, plus everything you do — from walking to the kitchen to a hard workout.',
    'Knowing your TDEE is the foundation of any eating plan. Eat at TDEE to maintain weight, below it to lose and above it to gain. This calculator uses the Mifflin-St Jeor BMR and the standard activity multipliers, and shows the result for every activity level so you can pick honestly.',
  ],
  formula: {
    expr: 'TDEE = BMR × activity factor\nBMR = 10W + 6.25H − 5A + s   (s = +5 men, −161 women)',
    vars: [
      ['1.2', 'sedentary'],
      ['1.375', 'light exercise 1–3 days/week'],
      ['1.55', 'moderate exercise 3–5 days/week'],
      ['1.725', 'very active 6–7 days/week'],
      ['1.9', 'physical job plus training'],
    ],
    notes: ['The thermic effect of food (about 10% of intake) is already inside the activity multipliers; we show it separately only to illustrate where calories go.'],
  },
  examples: [
    { title: 'Office worker, no gym', inputs: { activity: '1.2' }, explain: (r) => `Sedentary maintenance: ${r.primary.value}.` },
    { title: 'Runner, 5 days a week', inputs: { sex: 'male', age: 28, ft: 5, in: 11, lb: 165, activity: '1.55' }, explain: (r) => `About ${r.primary.value} to maintain weight.` },
    { title: 'Construction worker who lifts', inputs: { sex: 'male', age: 40, ft: 6, in: 1, lb: 210, activity: '1.9' }, explain: (r) => `High activity: ${r.primary.value}.` },
  ],
  analysis() {
    const bmr = mifflin(72.5, 168, 35, false);
    const lv = ACTIVITY.map((a) => bmr * +a.value);
    const steps = [2000, 4000, 6000, 8000, 10000, 12000];
    const kgW = 72.5;
    const stepKcal = steps.map((s) => s * 0.0005 * kgW); // ≈0.5 kcal per kg per 1,000 steps
    return [
      {
        title: 'Activity level is the biggest lever',
        insight: `For the same body, moving from sedentary to very active raises TDEE from ${num(lv[0], 0)} to <strong>${num(lv[3], 0)} kcal</strong> — a difference of ${num(lv[3] - lv[0], 0)} kcal a day. Most people overestimate their activity; if unsure, pick one level lower.`,
        chart: { type: 'bar', title: 'TDEE by activity level (woman, 35, 168 cm, 72.5 kg)', x: ['Sedentary', 'Light', 'Moderate', 'Very', 'Extra'], series: [{ name: 'TDEE', values: lv }], y: 'int' },
      },
      {
        title: 'What daily steps add (rough guide)',
        insight: `Walking burns roughly 0.5 kcal per kg of body weight per 1,000 steps. For a 72.5 kg person, 10,000 steps adds about <strong>${num(stepKcal[4], 0)} kcal</strong> — useful, but less than many fitness trackers claim.`,
        chart: { type: 'bar', title: 'Approx. calories from walking, 72.5 kg', x: steps.map((s) => s / 1000 + 'k steps'), series: [{ name: 'kcal', values: stepKcal }], y: 'int' },
      },
    ];
  },
  variantQs: [
    { q: 'Is TDEE the same as maintenance calories?', a: 'Yes. Your TDEE is the intake at which your weight stays roughly stable, often called maintenance calories.' },
    { q: 'How many calories do I burn a day?', a: 'Your TDEE is that number. Most adults burn between about 1,600 and 3,000 kcal a day depending on size, sex, age and activity.' },
  ],
  tips: [
    'Track weight for 2–3 weeks while eating at your estimate; adjust by 100–200 kcal if it drifts.',
    'Use the activity level that matches a typical week, not your best week.',
    'TDEE drops as you lose weight — recalculate every 5 kg / 10 lb.',
  ],
  faqs: [
    { q: 'How is TDEE calculated?', a: 'BMR multiplied by an activity factor from 1.2 (sedentary) to 1.9 (extra active). We calculate BMR with the Mifflin-St Jeor equation.' },
    { q: 'How accurate is a TDEE calculator?', a: 'It is an estimate, typically within 10–15% for most people. Real-world tracking of weight and intake is the best way to fine-tune it.' },
    { q: 'Should I eat my TDEE to lose weight?', a: 'No — eating at TDEE maintains weight. A moderate deficit of 300–500 kcal below TDEE is a common starting point for weight loss.' },
    { q: 'Does TDEE include exercise calories?', a: 'Yes, through the activity multiplier. Don’t add exercise calories from a tracker on top, or you will double-count.' },
  ],
  sources: [
    { label: 'Mifflin MD et al. (1990), Am J Clin Nutr', url: 'https://pubmed.ncbi.nlm.nih.gov/2305711/' },
    { label: 'NIH – Body Weight Planner', url: 'https://www.niddk.nih.gov/bwp' },
  ],
  related: ['calorie-calculator', 'bmr-calculator', 'calorie-deficit-calculator', 'macro-calculator', 'protein-calculator'],
  disclaimer: 'health',
};
export default calc;
