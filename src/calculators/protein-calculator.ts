import { bodyFields, body } from '../lib/health';
import { num } from '../lib/format';
import type { Calculator } from '../lib/types';

const GOALS: Record<string, { label: string; lo: number; hi: number }> = {
  rda: { label: 'General health (RDA minimum)', lo: 0.8, hi: 0.8 },
  active: { label: 'Regular exercise', lo: 1.2, hi: 1.6 },
  muscle: { label: 'Build muscle / strength training', lo: 1.6, hi: 2.2 },
  cut: { label: 'Lose fat, keep muscle', lo: 1.8, hi: 2.4 },
  older: { label: 'Age 65+ (preserve muscle)', lo: 1.0, hi: 1.2 },
};

const calc: Calculator = {
  slug: 'protein-calculator',
  name: 'Protein Calculator',
  short: 'Protein',
  category: 'health',
  keyword: 'protein calculator',
  volume: 110000,
  variants: ['how much protein do I need', 'protein intake calculator', 'daily protein calculator', 'protein per day calculator'],
  title: 'Protein Calculator – How Much Protein Do I Need a Day?',
  description:
    'Calculate how many grams of protein you need a day for health, exercise, muscle gain or fat loss, split per meal, with examples of what that looks like.',
  accent: 'grams per day, per meal',
  icon: 'P',
  inputs: [
    ...bodyFields({ sex: false, age: false, height: false }),
    { id: 'goal', label: 'Goal', type: 'select', default: 'active', options: Object.entries(GOALS).map(([value, g]) => ({ value, label: g.label })) },
    { id: 'meals', label: 'Meals per day', type: 'number', default: 4, min: 1, max: 8, step: 1 },
  ],
  compute(v) {
    const b = body(v);
    if (!(b.kg > 20)) return { primary: { label: '', value: '' }, error: 'Enter your weight.' };
    const g = GOALS[v.goal];
    const lo = g.lo * b.kg,
      hi = g.hi * b.kg;
    const mid = (lo + hi) / 2;
    return {
      primary: { label: 'Daily protein target', value: lo === hi ? `${num(lo, 0)} g` : `${num(lo, 0)}–${num(hi, 0)} g` },
      rows: [
        { label: 'Per meal', value: `${num(mid / (+v.meals || 4), 0)} g` },
        { label: 'Per kg of body weight', value: lo === hi ? `${g.lo} g/kg` : `${g.lo}–${g.hi} g/kg` },
        { label: 'Per lb of body weight', value: `${num(g.lo / 2.2046, 2)}–${num(g.hi / 2.2046, 2)} g/lb` },
        { label: 'Calories from protein', value: `${num(mid * 4, 0)} kcal` },
      ],
      chart: {
        type: 'hbar',
        title: 'Protein targets by goal for your weight (midpoint)',
        x: Object.values(GOALS).map((x) => x.label),
        series: [{ name: 'Grams', values: Object.values(GOALS).map((x) => ((x.lo + x.hi) / 2) * b.kg) }],
        y: 'int',
      },
    };
  },
  answer: {
    text: (r) =>
      `A person weighing <strong>160 lb (72.6 kg)</strong> who exercises regularly needs about <strong>${r.primary.value} of protein a day</strong> (1.2–1.6 g per kg). Spread over four meals, that is roughly <strong>${r.rows![0].value} per meal</strong>. The bare RDA minimum would be only 58 g.`,
  },
  intro: [
    'Protein needs depend mainly on body weight and what you ask your body to do. The Recommended Dietary Allowance of 0.8 g per kg is the minimum to avoid deficiency in sedentary adults — not the optimum for active people, older adults or anyone trying to lose fat while keeping muscle.',
    'This protein calculator uses evidence-based ranges for each goal, converts them to grams and splits them across your meals. Research suggests spreading protein in doses of roughly 0.4 g/kg per meal supports muscle better than one large serving.',
  ],
  formula: {
    expr: 'Daily protein (g) = body weight (kg) × target (g/kg)\nPer meal = daily midpoint ÷ meals',
    vars: [
      ['0.8 g/kg', 'RDA for adults'],
      ['1.2–1.6', 'regular exercise'],
      ['1.6–2.2', 'muscle gain with resistance training'],
      ['1.8–2.4', 'calorie deficit, preserving muscle'],
    ],
  },
  examples: [
    { title: '130 lb runner', inputs: { lb: 130, goal: 'active' }, explain: (r) => `${r.primary.value} a day covers training recovery.` },
    { title: '190 lb lifter', inputs: { lb: 190, goal: 'muscle', meals: 5 }, explain: (r) => `${r.rows![0].value} per meal over five meals.` },
    { title: '70-year-old, 150 lb', inputs: { lb: 150, goal: 'older', meals: 3 }, explain: (r) => `Higher than the RDA to help slow age-related muscle loss.` },
  ],
  analysis() {
    const foods: [string, number][] = [
      ['Chicken breast, 100 g cooked', 31],
      ['Canned tuna, 100 g', 26],
      ['Greek yogurt, 200 g', 20],
      ['Firm tofu, 150 g', 21],
      ['Lentils, 1 cup cooked', 18],
      ['Eggs, 2 large', 12],
      ['Milk, 1 cup', 8],
      ['Peanut butter, 2 tbsp', 7],
    ];
    const ws = [120, 140, 160, 180, 200, 220];
    return [
      {
        title: 'What 25–30 g of protein looks like',
        insight: 'A typical per-meal target of 25–40 g is about one chicken breast, a can of tuna, or a large bowl of Greek yogurt. Plant eaters can reach it by combining tofu or lentils with grains. Values are approximate USDA figures.',
        chart: { type: 'hbar', title: 'Protein per typical serving (g)', x: foods.map((f) => f[0]), series: [{ name: 'Protein', values: foods.map((f) => f[1]) }], y: 'int' },
      },
      {
        title: 'RDA vs active targets by weight',
        insight: `At 180 lb, the RDA is ${num(180 * 0.4536 * 0.8, 0)} g, but someone strength training should aim for roughly <strong>${num(180 * 0.4536 * 1.6, 0)}–${num(180 * 0.4536 * 2.2, 0)} g</strong>. The gap is why many active people under-eat protein.`,
        chart: {
          type: 'bar',
          title: 'Daily protein: RDA vs muscle-building midpoint',
          x: ws.map((w) => w + ' lb'),
          series: [
            { name: 'RDA (0.8 g/kg)', values: ws.map((w) => w * 0.4536 * 0.8) },
            { name: 'Muscle gain (1.9 g/kg)', values: ws.map((w) => w * 0.4536 * 1.9) },
          ],
          y: 'int',
          xTitle: 'Body weight',
        },
      },
    ];
  },
  variantQs: [
    { q: 'How much protein do I need a day?', a: 'At least 0.8 g per kg of body weight, and 1.2–2.2 g/kg if you exercise, want to build muscle or are losing weight. Enter your weight and goal for an exact number.' },
    { q: 'Should I calculate protein from goal weight or current weight?', a: 'If you have a lot of weight to lose, using your goal weight (or lean body mass) avoids an unrealistically high target.' },
  ],
  tips: [
    'Aim for a protein source at every meal rather than one big serving.',
    'Higher protein helps you feel full during a calorie deficit.',
    'Most people don’t need supplements — whole foods work if you plan meals.',
    'People with kidney disease should follow their doctor’s protein guidance.',
  ],
  faqs: [
    { q: 'How much protein is too much?', a: 'Intakes up to about 2 g/kg appear safe for healthy adults over the long term. People with kidney disease should talk to their doctor.' },
    { q: 'How much protein do I need to build muscle?', a: 'About 1.6 g/kg a day, with benefits for some people up to 2.2 g/kg, combined with progressive resistance training.' },
    { q: 'Does protein timing matter?', a: 'Total daily intake matters most. Spreading it over 3–5 meals with 20–40 g each may give a small extra benefit for muscle.' },
    { q: 'Can I get enough protein as a vegetarian?', a: 'Yes. Combine legumes, tofu, tempeh, dairy, eggs and whole grains; plant proteins are slightly less digestible, so aim near the top of your range.' },
  ],
  sources: [
    { label: 'National Academies – Dietary Reference Intakes for protein', url: 'https://www.nationalacademies.org/our-work/dietary-reference-intakes-for-energy-carbohydrate-fiber-fat-fatty-acids-cholesterol-protein-and-amino-acids' },
    { label: 'Jäger R et al. (2017), ISSN position stand: protein and exercise', url: 'https://pubmed.ncbi.nlm.nih.gov/28642676/' },
    { label: 'USDA FoodData Central', url: 'https://fdc.nal.usda.gov/' },
  ],
  related: ['macro-calculator', 'calorie-calculator', 'tdee-calculator', 'one-rep-max-calculator', 'body-fat-calculator'],
  disclaimer: 'health',
};
export default calc;
