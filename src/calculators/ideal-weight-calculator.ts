import { body, bodyFields, bmi, kgTo } from '../lib/health';
import { num } from '../lib/format';
import type { Calculator } from '../lib/types';

/** Ideal body weight formulas (kg), each linear in inches over 5 ft. Coefficients: [male base, male per inch, female base, female per inch]. */
export const IBW: Record<string, { name: string; year: number; c: [number, number, number, number] }> = {
  robinson: { name: 'Robinson', year: 1983, c: [52, 1.9, 49, 1.7] },
  miller: { name: 'Miller', year: 1983, c: [56.2, 1.41, 53.1, 1.36] },
  devine: { name: 'Devine', year: 1974, c: [50, 2.3, 45.5, 2.3] },
  hamwi: { name: 'Hamwi', year: 1964, c: [48, 2.7, 45.5, 2.2] },
};
export function ibw(formula: keyof typeof IBW, cm: number, male: boolean) {
  const inchesOver5ft = cm / 2.54 - 60;
  const [mb, mi, fb, fi] = IBW[formula].c;
  return male ? mb + mi * inchesOver5ft : fb + fi * inchesOver5ft;
}
/** Weight range (kg) for BMI 18.5–24.9 at this height. */
export const bmiRange = (cm: number) => [18.5 * (cm / 100) ** 2, 24.9 * (cm / 100) ** 2];

const calc: Calculator = {
  slug: 'ideal-weight-calculator',
  name: 'Ideal Weight Calculator',
  short: 'Ideal Weight',
  category: 'health',
  keyword: 'ideal weight calculator',
  volume: 135000,
  variants: ['ideal body weight calculator', 'healthy weight calculator', 'how much should I weigh', 'ibw calculator', 'devine formula calculator'],
  title: 'Ideal Weight Calculator – 4 Formulas + Healthy BMI Range',
  description:
    'Find your ideal body weight with the Robinson, Miller, Devine and Hamwi formulas, compared with the healthy BMI range for your height, sex and current weight.',
  accent: 'four formulas, one range',
  icon: '⚖',
  inputs: [
    ...bodyFields({ age: false }),
    {
      id: 'frame',
      label: 'Body frame',
      type: 'select',
      default: 'medium',
      help: 'Hamwi adjustment: small frame −10%, large frame +10%. Wrap your thumb and finger around your wrist: overlapping = small, touching = medium, gap = large.',
      options: [
        { value: 'small', label: 'Small' },
        { value: 'medium', label: 'Medium' },
        { value: 'large', label: 'Large' },
      ],
    },
  ],
  compute(v) {
    const b = body(v);
    if (!(b.cm > 100 && b.cm < 250)) return { primary: { label: '', value: '' }, error: 'Enter a height between 100 and 250 cm (3′4″–8′2″).' };
    const frameAdj = v.frame === 'small' ? 0.9 : v.frame === 'large' ? 1.1 : 1;
    const res = Object.keys(IBW).map((k) => ({ k, name: IBW[k].name, kg: ibw(k, b.cm, b.male) * (k === 'hamwi' ? frameAdj : 1) }));
    const [lo, hi] = bmiRange(b.cm);
    const kgs = res.map((r) => r.kg);
    const avg = kgs.reduce((a, x) => a + x, 0) / kgs.length;
    const curBmi = b.kg > 0 ? bmi(b.kg, b.m) : NaN;
    const diff = b.kg - avg;
    const u = b.metric ? 'kg' : 'lb';
    const conv = (kg: number) => (b.metric ? kg : kg / 0.45359237);
    return {
      primary: { label: 'Ideal weight (average of 4 formulas)', value: kgTo(avg, b.metric) },
      rows: [
        ...res.map((r) => ({ label: `${r.name} (${IBW[r.k].year})${r.k === 'hamwi' && frameAdj !== 1 ? `, ${v.frame} frame` : ''}`, value: kgTo(r.kg, b.metric) })),
        { label: 'Healthy BMI range (18.5–24.9)', value: `${kgTo(lo, b.metric)} – ${kgTo(hi, b.metric)}` },
        ...(isFinite(curBmi) ? [{ label: 'Your current BMI', value: num(curBmi, 1) }, { label: diff >= 0 ? 'Above the formula average' : 'Below the formula average', value: kgTo(Math.abs(diff), b.metric) }] : []),
      ],
      chart: {
        type: 'bar',
        title: `Ideal weight by formula (${u})`,
        x: [...res.map((r) => r.name), 'BMI 18.5', 'BMI 24.9', ...(b.kg > 0 ? ['You'] : [])],
        series: [{ name: 'Weight', values: [...kgs, lo, hi, ...(b.kg > 0 ? [b.kg] : [])].map(conv) }],
        y: 'num',
      },
      note: 'These formulas were made to dose medicines, not to set personal goals. They ignore muscle, age and ethnicity. Use the range as a starting point for a conversation with your doctor.',
      steps: [`Height = ${num(b.cm, 1)} cm = ${num(b.cm / 2.54, 1)} in, ${num(b.cm / 2.54 - 60, 1)} in over 5 ft`, ...res.map((r) => { const c = IBW[r.k].c; const [base, per] = b.male ? [c[0], c[1]] : [c[2], c[3]]; return `${r.name}: ${base} + ${per} × ${num(b.cm / 2.54 - 60, 1)} = ${num(r.kg, 1)} kg`; })],
    };
  },
  answer: {
    text: (r) => {
      const f = r.rows!.slice(0, 4).map((x) => ({ name: x.label.split(' (')[0], v: x.value, n: parseFloat(x.value) })).sort((a, b) => a.n - b.n);
      return `For a woman <strong>5′6″</strong> tall, the four ideal-weight formulas give between ${f[0].v} (${f[0].name}) and ${f[3].v} (${f[3].name}), an average of <strong>${r.primary.value}</strong>. The healthy BMI range for the same height is wider: <strong>${r.rows![4].value}</strong>. Most people are healthy anywhere within that range.`;
    },
  },
  intro: [
    'An ideal weight calculator estimates a healthy body weight for your height and sex. The best-known formulas, Devine, Robinson, Miller and Hamwi, were developed between 1964 and 1983 to help doctors dose medicines. They are still widely used in hospitals today.',
    'Each formula gives a single number, and they can disagree by 10 lb or more. That is why this calculator shows all four side by side, next to the healthy BMI range. A range is more realistic than one “perfect” weight, and if you enter your current weight you can see where you stand.',
  ],
  formula: {
    expr: 'Devine (1974):   ♂ 50 kg + 2.3 kg/in over 5 ft   ♀ 45.5 kg + 2.3 kg/in\nRobinson (1983): ♂ 52 + 1.9/in   ♀ 49 + 1.7/in\nMiller (1983):   ♂ 56.2 + 1.41/in   ♀ 53.1 + 1.36/in\nHamwi (1964):    ♂ 48 + 2.7/in   ♀ 45.5 + 2.2/in\nBMI range: 18.5 × h² to 24.9 × h² (h in metres)',
    vars: [
      ['in over 5 ft', 'height in inches minus 60 (negative if shorter than 5 ft)'],
      ['Hamwi frame', '−10% for a small frame, +10% for a large frame'],
    ],
  },
  examples: [
    { title: 'Man, 5′10″, 185 lb', inputs: { sex: 'male', ft: 5, in: 10, lb: 185 }, explain: (r) => `Formulas average ${r.primary.value}; healthy BMI range ${r.rows![4].value}.` },
    { title: 'Woman, 163 cm (metric)', inputs: { units: 'metric', sex: 'female', cm: 163, kg: 60 }, explain: (r) => `Average ${r.primary.value}; BMI ${r.rows![5].value}.` },
    { title: 'Tall man, 6′3″, large frame', inputs: { sex: 'male', ft: 6, in: 3, lb: 210, frame: 'large' }, explain: (r) => `Hamwi with large frame: ${r.rows![3].value}.` },
  ],
  analysis() {
    const heights = [60, 62, 64, 66, 68, 70, 72, 74, 76];
    const lb = (kg: number) => kg / 0.45359237;
    return [
      {
        title: 'The formulas disagree most for short and tall people',
        insight: `For men, the formulas roughly agree around 5′6″–5′8″ and spread apart above and below. At 5 ft, Miller gives the highest weight; at 6′4″, Hamwi gives <strong>${num(lb(ibw('hamwi', 76 * 2.54, true)), 0)} lb</strong> while Miller gives just <strong>${num(lb(ibw('miller', 76 * 2.54, true)), 0)} lb</strong>, a gap of over 25 lb. Miller rises most slowly with height, so it gives the lowest figure for tall people. Each formula comes from a different small clinical sample, and none is “the” right one.`,
        chart: {
          type: 'line',
          title: 'Ideal weight for men by height (lb)',
          x: heights.map((h) => `${Math.floor(h / 12)}′${h % 12}″`),
          series: [
            { name: 'Hamwi', values: heights.map((h) => lb(ibw('hamwi', h * 2.54, true))) },
            { name: 'Devine', values: heights.map((h) => lb(ibw('devine', h * 2.54, true))) },
            { name: 'Robinson', values: heights.map((h) => lb(ibw('robinson', h * 2.54, true))) },
            { name: 'Miller', values: heights.map((h) => lb(ibw('miller', h * 2.54, true))) },
          ],
          y: 'num',
          xTitle: 'Height',
        },
      },
      {
        title: 'Ideal weight table for women and men',
        insight: 'This table shows the Devine formula, the one most often used clinically, next to the healthy BMI range at each height.',
        table: {
          head: ['Height', 'Women (Devine)', 'Men (Devine)', 'Healthy BMI range'],
          rows: heights.map((h) => {
            const [lo, hi] = bmiRange(h * 2.54);
            return [`${Math.floor(h / 12)}′${h % 12}″`, `${num(lb(ibw('devine', h * 2.54, false)), 0)} lb`, `${num(lb(ibw('devine', h * 2.54, true)), 0)} lb`, `${num(lb(lo), 0)}–${num(lb(hi), 0)} lb`];
          }),
        },
      },
    ];
  },
  variantQs: [
    { q: 'How much should I weigh for my height?', a: 'A healthy weight for most adults is anywhere in the BMI 18.5–24.9 range for your height. The ideal-weight formulas give a single point inside or near that range.' },
    { q: 'What is the Devine formula?', a: 'Devine (1974): 50 kg for men or 45.5 kg for women, plus 2.3 kg for every inch over 5 feet. It was designed to dose drugs and is still the most common ideal body weight (IBW) formula in hospitals.' },
    { q: 'Is ideal weight different for women and men?', a: 'Yes. All four formulas give women a lower base weight, because on average women have less muscle and bone mass at the same height.' },
  ],
  tips: [
    'Muscular people often weigh more than the formulas suggest while being very healthy. Waist size is a better check of health risk.',
    'Waist-to-height ratio below 0.5 is a simple, widely used marker of healthy fat distribution.',
    'Aim for slow change: 0.5–1 lb a week is sustainable for most people.',
  ],
  faqs: [
    { q: 'Which ideal weight formula is most accurate?', a: 'None is accurate for everyone. They were built from small clinical samples for drug dosing. Robinson and Miller were later refinements of Devine, and the healthy BMI range is a broader, evidence-based guide.' },
    { q: 'Does ideal weight change with age?', a: 'The formulas ignore age. Some research suggests a slightly higher BMI (around 25–27) is not linked with higher mortality in adults over 65.' },
    { q: 'What is body frame size?', a: 'A rough measure of bone structure. Wrap your thumb and middle finger around your wrist: if they overlap you have a small frame, if they touch a medium one, if they do not meet a large one.' },
    { q: 'Do these formulas work for people under 5 feet?', a: 'They subtract weight for each inch below 5 feet, but they were not designed for very short adults or children. For children, use CDC growth charts.' },
  ],
  sources: [
    { label: 'Pai MP, Paloucek FP (2000). The origin of the “ideal” body weight equations. Ann Pharmacother', url: 'https://pubmed.ncbi.nlm.nih.gov/10981254/' },
    { label: 'CDC – Adult BMI categories', url: 'https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html' },
  ],
  related: ['bmi-calculator', 'body-fat-calculator', 'calorie-calculator', 'bmr-calculator', 'height-calculator'],
  disclaimer: 'health',
};
export default calc;
