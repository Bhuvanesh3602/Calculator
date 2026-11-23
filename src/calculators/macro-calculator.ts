import { bodyFields, body, mifflin } from '../lib/health';
import { num } from '../lib/format';
import type { Calculator } from '../lib/types';

const SPLITS: Record<string, { label: string; p: number; c: number; f: number }> = {
  balanced: { label: 'Balanced (30P / 40C / 30F)', p: 30, c: 40, f: 30 },
  highp: { label: 'High protein (40P / 30C / 30F)', p: 40, c: 30, f: 30 },
  lowcarb: { label: 'Lower carb (35P / 25C / 40F)', p: 35, c: 25, f: 40 },
  endurance: { label: 'Endurance (20P / 55C / 25F)', p: 20, c: 55, f: 25 },
  keto: { label: 'Keto (25P / 5C / 70F)', p: 25, c: 5, f: 70 },
};
export function macros(kcal: number, s: { p: number; c: number; f: number }) {
  return { p: (kcal * s.p) / 100 / 4, c: (kcal * s.c) / 100 / 4, f: (kcal * s.f) / 100 / 9 };
}

const calc: Calculator = {
  slug: 'macro-calculator',
  name: 'Macro Calculator',
  short: 'Macro',
  category: 'health',
  keyword: 'macro calculator',
  volume: 90500,
  variants: ['macronutrient calculator', 'iifym calculator', 'keto macro calculator', 'macros for weight loss'],
  title: 'Macro Calculator – Protein, Carbs & Fat in Grams for Your Goal',
  description:
    'Turn your calorie target into daily grams of protein, carbs and fat. Compare balanced, high-protein, low-carb, endurance and keto splits for your body and goal.',
  accent: 'calories into grams',
  icon: 'M',
  inputs: [
    ...bodyFields({ activity: true }),
    {
      id: 'goal',
      label: 'Goal',
      type: 'select',
      default: '-500',
      options: [
        { value: '-500', label: 'Lose weight (−500 kcal)' },
        { value: '-250', label: 'Lose slowly (−250 kcal)' },
        { value: '0', label: 'Maintain' },
        { value: '300', label: 'Build muscle (+300 kcal)' },
      ],
    },
    { id: 'split', label: 'Macro split', type: 'select', default: 'balanced', options: Object.entries(SPLITS).map(([value, s]) => ({ value, label: s.label })) },
  ],
  compute(v) {
    const b = body(v);
    if (!(b.kg > 20) || !(b.cm > 100)) return { primary: { label: '', value: '' }, error: 'Enter a valid height and weight.' };
    const kcal = Math.max(mifflin(b.kg, b.cm, b.age, b.male) * +v.activity + +v.goal, b.male ? 1500 : 1200);
    const s = SPLITS[v.split];
    const m = macros(kcal, s);
    return {
      primary: { label: `Daily macros at ${num(Math.round(kcal), 0)} kcal`, value: `${num(m.p, 0)}P · ${num(m.c, 0)}C · ${num(m.f, 0)}F` },
      rows: [
        { label: 'Protein', value: `${num(m.p, 0)} g (${num(m.p / b.kg, 1)} g/kg)` },
        { label: 'Carbohydrates', value: `${num(m.c, 0)} g` },
        { label: 'Fat', value: `${num(m.f, 0)} g` },
        { label: 'Calories', value: `${num(Math.round(kcal), 0)} kcal` },
      ],
      chart: { type: 'donut', title: 'Calories from each macro', x: ['Protein', 'Carbs', 'Fat'], series: [{ name: 'kcal', values: [m.p * 4, m.c * 4, m.f * 9] }], y: 'int' },
    };
  },
  answer: {
    text: (r) =>
      `For a lightly active 35-year-old woman (5 ft 6 in, 160 lb) aiming to lose weight, a balanced split works out to <strong>${r.rows![0].value.split(' (')[0]} protein, ${r.rows![1].value} carbs and ${r.rows![2].value} fat</strong> per day — ${r.rows![3].value} in total. Protein and carbs give 4 kcal per gram; fat gives 9.`,
  },
  intro: [
    'Macronutrients — protein, carbohydrate and fat — are where all your calories come from. A macro calculator first sets a calorie target from your TDEE and goal, then divides those calories into grams of each macro using a chosen split.',
    'Different splits suit different people: high protein for fat loss and muscle retention, more carbs for endurance training, very low carb for keto. Compare them here using the same calorie target.',
  ],
  formula: {
    expr: 'Protein g = kcal × P% ÷ 4\nCarbs g = kcal × C% ÷ 4\nFat g = kcal × F% ÷ 9',
    vars: [
      ['kcal', 'TDEE (Mifflin-St Jeor × activity) + goal adjustment'],
      ['P%, C%, F%', 'share of calories from each macro'],
    ],
  },
  examples: [
    { title: 'Cutting, high protein', inputs: { sex: 'male', age: 30, ft: 5, in: 11, lb: 190, activity: '1.55', goal: '-500', split: 'highp' }, explain: (r) => `${r.rows![0].value} protein supports muscle while cutting.` },
    { title: 'Marathon training', inputs: { age: 28, lb: 130, ft: 5, in: 5, activity: '1.725', goal: '0', split: 'endurance' }, explain: (r) => `${r.rows![1].value} of carbs fuels long runs.` },
    { title: 'Keto', inputs: { split: 'keto', goal: '-500' }, explain: (r) => `Carbs fall to ${r.rows![1].value}, fat rises to ${r.rows![2].value}.` },
  ],
  analysis() {
    const kcal = 1800;
    const keys = Object.keys(SPLITS);
    const ms = keys.map((k) => macros(kcal, SPLITS[k]));
    return [
      {
        title: 'Five splits at the same 1,800 kcal',
        insight: `Calories are identical, but plates look very different: carbs range from <strong>${num(ms[4].c, 0)} g</strong> on keto to ${num(ms[3].c, 0)} g on an endurance split. Fat grams look small because each gram carries 9 kcal.`,
        chart: {
          type: 'bar',
          title: 'Grams per day at 1,800 kcal by split',
          x: keys.map((k) => SPLITS[k].label.split(' (')[0]),
          series: [
            { name: 'Protein', values: ms.map((m) => m.p) },
            { name: 'Carbs', values: ms.map((m) => m.c) },
            { name: 'Fat', values: ms.map((m) => m.f) },
          ],
          y: 'int',
        },
        table: { head: ['Split', 'Protein', 'Carbs', 'Fat'], rows: keys.map((k, i) => [SPLITS[k].label, num(ms[i].p, 0) + ' g', num(ms[i].c, 0) + ' g', num(ms[i].f, 0) + ' g']) },
      },
    ];
  },
  variantQs: [
    { q: 'What is an IIFYM calculator?', a: '“If It Fits Your Macros” is a flexible-dieting approach: hit daily macro targets with any foods. This calculator gives those targets.' },
    { q: 'Can I use this as a keto macro calculator?', a: 'Yes — choose the keto split. It keeps carbs at 5% of calories, usually under 30 g a day.' },
  ],
  tips: [
    'Set protein first, then divide the remaining calories between carbs and fat by preference.',
    'Hitting calories matters more than perfect macros for weight change.',
    'Fibre-rich carbs and unsaturated fats make any split healthier.',
  ],
  faqs: [
    { q: 'What macros should I eat to lose weight?', a: 'A calorie deficit with high protein (about 1.6–2.2 g/kg) works well; carbs and fat can be split by preference.' },
    { q: 'How many grams of carbs should I eat?', a: 'The Dietary Guidelines suggest 45–65% of calories from carbs for most adults — about 200–290 g on 1,800 kcal. Low-carb and keto diets use far less.' },
    { q: 'Do macros matter more than calories?', a: 'For weight change, calories matter most. Macros affect body composition, fullness and performance.' },
    { q: 'How do I track macros?', a: 'Use a food-tracking app with a barcode scanner and a kitchen scale for a few weeks to learn portions.' },
  ],
  sources: [
    { label: 'Dietary Guidelines for Americans 2020–2025 (AMDR ranges)', url: 'https://www.dietaryguidelines.gov/' },
    { label: 'Jäger R et al. (2017), ISSN position stand: protein and exercise', url: 'https://pubmed.ncbi.nlm.nih.gov/28642676/' },
  ],
  related: ['protein-calculator', 'calorie-calculator', 'tdee-calculator', 'calorie-deficit-calculator', 'bmr-calculator'],
  disclaimer: 'health',
};
export default calc;
