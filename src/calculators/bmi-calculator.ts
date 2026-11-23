import { bodyFields, body, bmi, bmiCategory, kgTo } from '../lib/health';
import { num } from '../lib/format';
import type { Calculator } from '../lib/types';

const calc: Calculator = {
  slug: 'bmi-calculator',
  name: 'BMI Calculator',
  short: 'BMI',
  category: 'health',
  keyword: 'bmi calculator',
  volume: 2240000,
  variants: ['bmi calculator women', 'bmi index calculator women', 'body mass index calculator', 'bmi calculator men', 'healthy weight calculator'],
  title: 'BMI Calculator – Body Mass Index for Women & Men (lb or kg)',
  description:
    'Calculate your body mass index in pounds or kilograms, see your WHO category, your healthy weight range for your height, and what BMI can and cannot tell you.',
  accent: 'and what it misses',
  icon: 'B',
  inputs: bodyFields({ age: false }),
  compute(v) {
    const b = body(v);
    if (!(b.m > 0.5) || !(b.kg > 10)) return { primary: { label: '', value: '' }, error: 'Enter a valid height and weight.' };
    const val = bmi(b.kg, b.m);
    const lo = 18.5 * b.m * b.m,
      hi = 24.9 * b.m * b.m;
    const toHealthy = val > 24.9 ? b.kg - hi : val < 18.5 ? lo - b.kg : 0;
    const scale = [15, 18.5, 25, 30, 35, 40, 45];
    return {
      primary: { label: `Your BMI · ${bmiCategory(val)}`, value: num(val, 1) },
      rows: [
        { label: 'Healthy weight for your height', value: `${kgTo(lo, b.metric)} – ${kgTo(hi, b.metric)}` },
        {
          label: val > 24.9 ? 'Above the healthy range by' : val < 18.5 ? 'Below the healthy range by' : 'Position in healthy range',
          value: toHealthy ? kgTo(toHealthy, b.metric) : `${num(((val - 18.5) / (24.9 - 18.5)) * 100, 0)}% of the way up`,
        },
        { label: 'BMI Prime (BMI ÷ 25)', value: num(val / 25, 2) },
      ],
      chart: {
        type: 'bar',
        title: 'Weight at each BMI threshold for your height',
        x: scale.map((s) => 'BMI ' + s),
        series: [{ name: 'Weight', values: scale.map((s) => (b.metric ? s * b.m * b.m : (s * b.m * b.m) / 0.45359237)) }],
        y: 'num',
        xTitle: b.metric ? 'Weight in kg at each BMI' : 'Weight in lb at each BMI',
        markIndex: scale.findIndex((s, i) => val >= s && (i === scale.length - 1 || val < scale[i + 1])),
      },
    };
  },
  answer: {
    text: (r) =>
      `A woman who is <strong>5 ft 6 in</strong> and weighs <strong>160 lb</strong> has a BMI of <strong>${r.primary.value}</strong>, which the WHO classes as overweight (25–29.9). The healthy BMI range of 18.5–24.9 corresponds to <strong>${r.rows![0].value}</strong> at that height.`,
  },
  intro: [
    'Body mass index (BMI) is your weight divided by the square of your height. It is a quick screening number that health services use to flag possible underweight, overweight or obesity in adults — not a diagnosis.',
    'This BMI calculator works in pounds and feet or kilograms and centimetres, shows your World Health Organization category, and converts the healthy BMI range into an actual weight range for your height. The same adult cut-offs apply to women and men.',
  ],
  formula: {
    expr: 'BMI = weight (kg) ÷ height (m)²\nBMI = 703 × weight (lb) ÷ height (in)²',
    vars: [
      ['< 18.5', 'Underweight'],
      ['18.5 – 24.9', 'Healthy weight'],
      ['25 – 29.9', 'Overweight'],
      ['30 +', 'Obesity (class 1: 30–34.9, class 2: 35–39.9, class 3: 40+)'],
    ],
    notes: [
      'For children and teens (2–19), BMI is interpreted with age- and sex-specific percentiles instead of these cut-offs. Some health bodies use lower thresholds for people of Asian descent (overweight from 23).',
    ],
  },
  examples: [
    { title: '5′4″ woman, 130 lb', inputs: { sex: 'female', ft: 5, in: 4, lb: 130 }, explain: (r) => `BMI ${r.primary.value}: comfortably within the healthy range.` },
    { title: '6′0″ man, 210 lb', inputs: { sex: 'male', ft: 6, in: 0, lb: 210 }, explain: (r) => `BMI ${r.primary.value}. A muscular build can push BMI up without excess fat.` },
    { title: '170 cm, 85 kg (metric)', inputs: { units: 'metric', cm: 170, kg: 85 }, explain: (r) => `BMI ${r.primary.value}; healthy range at this height is ${r.rows![0].value}.` },
  ],
  analysis() {
    const hs = [58, 60, 62, 64, 66, 68, 70, 72, 74, 76];
    const range = hs.map((h) => {
      const m = (h * 2.54) / 100;
      return [(18.5 * m * m) / 0.45359237, (24.9 * m * m) / 0.45359237];
    });
    const w = 180;
    const bmis = hs.map((h) => (703 * w) / (h * h));
    return [
      {
        title: 'Healthy weight range by height',
        insight: `The healthy BMI band is wider in pounds for taller people: about <strong>${(range[0][1] - range[0][0]).toFixed(0)} lb</strong> wide at 4′10″ and ${(range[9][1] - range[9][0]).toFixed(0)} lb wide at 6′4″. Use the table to find your own range at a glance.`,
        chart: {
          type: 'stacked',
          title: 'Healthy weight range (BMI 18.5–24.9) by height, lb',
          x: hs.map((h) => `${Math.floor(h / 12)}′${h % 12}″`),
          series: [
            { name: 'Up to lower limit', values: range.map((r) => r[0]) },
            { name: 'Healthy range', values: range.map((r) => r[1] - r[0]) },
          ],
          y: 'int',
          xTitle: 'Height',
        },
        table: { head: ['Height', 'Healthy weight from', 'to'], rows: hs.map((h, i) => [`${Math.floor(h / 12)} ft ${h % 12} in`, range[i][0].toFixed(0) + ' lb', range[i][1].toFixed(0) + ' lb']) },
      },
      {
        title: 'Same weight, different BMI',
        insight: `A 180 lb person has a BMI of <strong>${bmis[0].toFixed(1)}</strong> at 4′10″ but ${bmis[9].toFixed(1)} at 6′4″. Height is squared in the formula, which is also why BMI tends to overstate fatness in very tall people and understate it in short people.`,
        chart: { type: 'line', title: 'BMI at 180 lb by height', x: hs.map((h) => `${Math.floor(h / 12)}′${h % 12}″`), series: [{ name: 'BMI', values: bmis }], y: 'num', xTitle: 'Height' },
      },
      {
        title: 'What BMI cannot tell you',
        insight:
          'BMI does not distinguish muscle from fat, ignores where fat is stored, and was built from population data. Waist circumference adds useful context: NIH guidance flags higher risk above 35 inches for women and 40 inches for men. Use BMI as a starting point for a conversation with a clinician.',
        stats: [
          { label: 'Waist risk threshold, women', value: '35 in' },
          { label: 'Waist risk threshold, men', value: '40 in' },
        ],
      },
    ];
  },
  variantQs: [
    { q: 'Is there a different BMI calculator for women?', a: 'No — adult BMI uses the same formula and categories for women and men. Women naturally carry more body fat at the same BMI, which is one reason BMI is a screening tool rather than a body-fat measure. Our body fat calculator gives a sex-specific estimate.' },
    { q: 'What is a BMI index calculator?', a: '“BMI index” simply means body mass index. Any BMI calculator, including this one, computes the same number.' },
    { q: 'Can a healthy weight calculator use BMI?', a: 'Yes. Rearranging the formula gives weight = BMI × height², so the healthy range is 18.5 × height² to 24.9 × height². The result card shows yours.' },
  ],
  tips: [
    'Measure height without shoes and weigh yourself at the same time of day for consistency.',
    'Pair BMI with waist circumference for a better picture of health risk.',
    'Athletes and very muscular people can have a high BMI with low body fat.',
    'For children and teens, use a CDC BMI-for-age percentile chart instead.',
  ],
  faqs: [
    { q: 'What is a healthy BMI?', a: 'For adults, a BMI of 18.5 to 24.9 is considered a healthy weight by the WHO and CDC. Below 18.5 is underweight, 25–29.9 overweight and 30 or more obesity.' },
    { q: 'How do I calculate BMI in pounds?', a: 'Multiply your weight in pounds by 703, then divide by your height in inches squared. For 160 lb at 66 inches: 703 × 160 ÷ 4,356 = 25.8.' },
    { q: 'Is BMI accurate?', a: 'It is a useful population screening tool but can misclassify individuals — especially athletes, older adults with low muscle mass, and some ethnic groups. It does not measure body fat directly.' },
    { q: 'Does age change BMI categories?', a: 'Not for adults; the same cut-offs apply from age 20. Some research suggests slightly higher BMI may be acceptable in older adults, so discuss your number with a doctor.' },
    { q: 'What BMI is considered obese?', a: 'A BMI of 30 or higher. It is subdivided into class 1 (30–34.9), class 2 (35–39.9) and class 3 (40 and above).' },
  ],
  sources: [
    { label: 'CDC – About adult BMI', url: 'https://www.cdc.gov/bmi/adult-calculator/index.html' },
    { label: 'WHO – Obesity and overweight fact sheet', url: 'https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight' },
    { label: 'NIH NHLBI – Assessing your weight and health risk', url: 'https://www.nhlbi.nih.gov/health/educational/lose_wt/risk.htm' },
  ],
  related: ['body-fat-calculator', 'calorie-calculator', 'tdee-calculator', 'bmr-calculator', 'calorie-deficit-calculator', 'protein-calculator'],
  disclaimer: 'health',
};
export default calc;
