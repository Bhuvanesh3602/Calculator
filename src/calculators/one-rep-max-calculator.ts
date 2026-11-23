import { num } from '../lib/format';
import type { Calculator } from '../lib/types';

export const epley = (w: number, r: number) => (r === 1 ? w : w * (1 + r / 30));
export const brzycki = (w: number, r: number) => (w * 36) / (37 - r);
export const lombardi = (w: number, r: number) => w * Math.pow(r, 0.1);

const calc: Calculator = {
  slug: 'one-rep-max-calculator',
  name: '1RM Calculator',
  short: '1RM',
  category: 'health',
  keyword: '1rm calculator',
  volume: 165000,
  variants: ['one rep max calculator', 'max bench calculator', 'max lift calculator', 'rep max calculator'],
  title: '1RM Calculator – One Rep Max with Training Percentages',
  description:
    'Estimate your one-rep max from any set using Epley, Brzycki and Lombardi formulas, then get a percentage chart with weights for 1–12 reps to plan training.',
  accent: 'without maxing out',
  icon: '1',
  inputs: [
    { id: 'weight', label: 'Weight lifted', type: 'number', default: 185, min: 1, step: 2.5 },
    {
      id: 'unit',
      label: 'Unit',
      type: 'select',
      default: 'lb',
      options: [
        { value: 'lb', label: 'lb' },
        { value: 'kg', label: 'kg' },
      ],
    },
    { id: 'reps', label: 'Reps completed', type: 'number', default: 5, min: 1, max: 15, step: 1 },
  ],
  compute(v) {
    const w = +v.weight,
      r = Math.round(+v.reps);
    if (!(w > 0) || !(r >= 1) || r > 15) return { primary: { label: '', value: '' }, error: 'Enter a weight and 1–15 reps (formulas lose accuracy above ~10).' };
    const e = epley(w, r),
      b = brzycki(w, r),
      l = lombardi(w, r);
    const avg = (e + b + l) / 3;
    const pcts = [100, 95, 90, 85, 80, 75, 70, 65, 60];
    const repsAt = [1, 2, 4, 6, 8, 10, 12, 15, 20];
    const u = ' ' + v.unit;
    return {
      primary: { label: 'Estimated 1RM (average)', value: num(avg, 1) + u },
      rows: [
        { label: 'Epley', value: num(e, 1) + u },
        { label: 'Brzycki', value: num(b, 1) + u },
        { label: 'Lombardi', value: num(l, 1) + u },
      ],
      chart: { type: 'bar', title: 'Training weights by % of 1RM', x: pcts.map((p) => p + '%'), series: [{ name: 'Weight', values: pcts.map((p) => (avg * p) / 100) }], y: 'num' },
      table: { head: ['% of 1RM', 'Weight', 'Typical reps'], rows: pcts.map((p, i) => [p + '%', num((avg * p) / 100, 1) + u, '~' + repsAt[i]]) },
    };
  },
  answer: {
    text: (r) =>
      `If you can lift <strong>185 lb for 5 reps</strong>, your estimated one-rep max is about <strong>${r.primary.value}</strong> (Epley ${r.rows![0].value}, Brzycki ${r.rows![1].value}). Training at 80% of that — about ${num(parseFloat(r.primary.value) * 0.8, 0)} lb — suits sets of around 8.`,
  },
  intro: [
    'Your one-rep max (1RM) is the most weight you can lift once with good form. Testing it directly is tiring and carries injury risk, so lifters estimate it from a heavier set of a few reps.',
    'This 1RM calculator averages three validated formulas and then builds a percentage table, so you can program training at 70%, 80% or 90% of your max without guessing.',
  ],
  formula: {
    expr: 'Epley:    1RM = w × (1 + r/30)\nBrzycki:  1RM = w × 36 / (37 − r)\nLombardi: 1RM = w × r^0.10',
    vars: [
      ['w', 'weight lifted'],
      ['r', 'reps completed to near failure'],
    ],
    notes: ['Estimates are most accurate for sets of 2–10 reps taken close to failure.'],
  },
  examples: [
    { title: 'Bench: 135 lb × 10', inputs: { weight: 135, reps: 10 }, explain: (r) => `Estimated max ${r.primary.value}.` },
    { title: 'Squat: 100 kg × 3', inputs: { weight: 100, unit: 'kg', reps: 3 }, explain: (r) => `Low reps give a tight estimate: ${r.primary.value}.` },
    { title: 'Deadlift: 315 lb × 5', inputs: { weight: 315, reps: 5 }, explain: (r) => `About ${r.primary.value}; formulas agree within a few pounds.` },
  ],
  analysis() {
    const reps = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15];
    return [
      {
        title: 'Formulas agree at low reps, drift at high reps',
        insight: `For 100 lb lifted, the formulas differ by only ${num(Math.abs(epley(100, 3) - brzycki(100, 3)), 1)} lb at 3 reps but <strong>${num(Math.abs(epley(100, 12) - lombardi(100, 12)), 1)} lb at 12 reps</strong>. Use a heavier set of 3–6 reps for the best estimate.`,
        chart: {
          type: 'line',
          title: 'Estimated 1RM from 100 units lifted, by reps',
          x: reps.map((r) => r + ' reps'),
          series: [
            { name: 'Epley', values: reps.map((r) => epley(100, r)) },
            { name: 'Brzycki', values: reps.map((r) => brzycki(100, r)) },
            { name: 'Lombardi', values: reps.map((r) => lombardi(100, r)) },
          ],
          y: 'num',
          xTitle: 'Reps performed',
        },
      },
    ];
  },
  variantQs: [
    { q: 'Is this a max bench calculator?', a: 'Yes — it works for bench press, squat, deadlift, overhead press or any barbell lift. Enter the weight and reps from your last hard set.' },
    { q: 'What is a rep max calculator?', a: 'It estimates your max for any number of reps. Use the table: the weight at 85% is roughly your 6-rep max, for example.' },
  ],
  tips: [
    'Use a set taken close to failure with good form.',
    'Retest every 4–8 weeks as you get stronger.',
    'Leave 1–2 reps “in the tank” on most working sets.',
    'Always use a spotter or safety bars for heavy bench and squat.',
  ],
  faqs: [
    { q: 'How do I calculate my one-rep max?', a: 'Lift a weight for as many good reps as you can (ideally 3–6), then apply a formula such as Epley: weight × (1 + reps ÷ 30).' },
    { q: 'Which 1RM formula is most accurate?', a: 'Studies show Epley and Brzycki perform similarly below 10 reps. Averaging several formulas smooths individual error.' },
    { q: 'Should beginners test a true 1RM?', a: 'Usually not. Estimated maxes from sets of 5 are safer and accurate enough to plan training.' },
    { q: 'What percentage of 1RM builds strength?', a: 'Strength work is typically 80–90% for 2–6 reps; hypertrophy often uses 65–80% for 6–12 reps.' },
  ],
  sources: [
    { label: 'LeSuer DA et al. (1997), J Strength Cond Res – Accuracy of prediction equations for 1RM', url: 'https://journals.lww.com/nsca-jscr/abstract/1997/11000/the_accuracy_of_prediction_equations_for.10.aspx' },
    { label: 'NSCA – Essentials of Strength Training and Conditioning', url: 'https://www.nsca.com/' },
  ],
  related: ['protein-calculator', 'body-fat-calculator', 'tdee-calculator', 'macro-calculator'],
  disclaimer: 'health',
};
export default calc;
