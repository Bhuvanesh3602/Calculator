import { num } from '../lib/format';
import type { Calculator, Values } from '../lib/types';

export const KM_PER_MI = 1.609344;
export const RACES: Record<string, { label: string; km: number }> = {
  '1mi': { label: '1 mile', km: KM_PER_MI },
  '5k': { label: '5K', km: 5 },
  '10k': { label: '10K', km: 10 },
  half: { label: 'Half marathon', km: 21.0975 },
  marathon: { label: 'Marathon', km: 42.195 },
};

/** "1:45:30" (h:mm:ss) or "45:30" (mm:ss) → seconds; a single number is minutes. */
export function parseClock(s: string): number {
  const parts = String(s).trim().split(':').map((x) => x.trim());
  if (!parts.length || parts.some((p) => p === '' || !isFinite(+p) || +p < 0)) return NaN;
  const n = parts.map(Number);
  if (n.length === 1) return n[0] * 60;
  if (n.length === 2) return n[0] * 60 + n[1];
  if (n.length === 3) return n[0] * 3600 + n[1] * 60 + n[2];
  return NaN;
}
export function clock(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '—';
  let s = Math.round(sec);
  const h = Math.floor(s / 3600);
  s -= h * 3600;
  const m = Math.floor(s / 60);
  s -= m * 60;
  const pad = (x: number) => String(x).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
/** Riegel (1981) endurance model: T2 = T1 × (D2 / D1)^1.06 */
export const riegel = (t1: number, d1: number, d2: number, k = 1.06) => t1 * Math.pow(d2 / d1, k);

function distanceKm(v: Values) {
  if (v.race && v.race !== 'custom') return RACES[v.race].km;
  return v.unit === 'mi' ? +v.dist * KM_PER_MI : +v.dist;
}

const calc: Calculator = {
  slug: 'pace-calculator',
  name: 'Pace Calculator',
  short: 'Pace',
  category: 'health',
  keyword: 'pace calculator',
  volume: 74000,
  variants: ['running pace calculator', 'marathon pace calculator', 'race time predictor', 'min per mile calculator', 'km pace calculator'],
  title: 'Pace Calculator – Running Pace, Finish Time & Race Predictor',
  description:
    'Work out running pace per mile or km, finish time or distance. Get even splits and predicted 5K, 10K, half and full marathon times from one race result.',
  accent: 'every split, every race',
  icon: '⏱',
  inputs: [
    {
      id: 'mode',
      label: 'Calculate',
      type: 'select',
      default: 'pace',
      options: [
        { value: 'pace', label: 'Pace (from time and distance)' },
        { value: 'time', label: 'Finish time (from pace and distance)' },
        { value: 'distance', label: 'Distance (from time and pace)' },
      ],
    },
    {
      id: 'race',
      label: 'Distance',
      type: 'select',
      default: '10k',
      options: [...Object.entries(RACES).map(([value, r]) => ({ value, label: r.label })), { value: 'custom', label: 'Custom distance' }],
      showIf: { field: 'mode', in: ['pace', 'time'] },
    },
    { id: 'dist', label: 'Custom distance', type: 'number', default: 8, min: 0.01, max: 1000, step: 0.1, showIf: [{ field: 'mode', in: ['pace', 'time'] }, { field: 'race', in: ['custom'] }] },
    {
      id: 'unit',
      label: 'Units',
      type: 'select',
      default: 'mi',
      options: [
        { value: 'mi', label: 'Miles' },
        { value: 'km', label: 'Kilometres' },
      ],
    },
    { id: 'time', label: 'Time (h:mm:ss)', type: 'text', default: '52:30', placeholder: '1:45:00', mono: true, showIf: { field: 'mode', in: ['pace', 'distance'] } },
    { id: 'pace', label: 'Pace (mm:ss per unit)', type: 'text', default: '8:30', placeholder: '8:30', mono: true, showIf: { field: 'mode', in: ['time', 'distance'] } },
  ],
  compute(v) {
    const perUnitKm = v.unit === 'mi' ? KM_PER_MI : 1;
    const u = v.unit === 'mi' ? 'mile' : 'km';
    let km: number, sec: number;
    if (v.mode === 'distance') {
      sec = parseClock(v.time);
      const p = parseClock(v.pace);
      if (!(sec > 0 && p > 0)) return { primary: { label: '', value: '' }, error: 'Enter a time like 45:00 and a pace like 8:30.' };
      km = (sec / p) * perUnitKm;
    } else if (v.mode === 'time') {
      km = distanceKm(v);
      const p = parseClock(v.pace);
      if (!(km > 0 && p > 0)) return { primary: { label: '', value: '' }, error: 'Enter a distance and a pace like 8:30.' };
      sec = (km / perUnitKm) * p;
    } else {
      km = distanceKm(v);
      sec = parseClock(v.time);
      if (!(km > 0 && sec > 0)) return { primary: { label: '', value: '' }, error: 'Enter a distance and a time like 52:30 or 1:45:00.' };
    }
    const perKm = sec / km,
      perMi = perKm * KM_PER_MI;
    const kmh = km / (sec / 3600);
    const unitPace = v.unit === 'mi' ? perMi : perKm;
    const primary =
      v.mode === 'pace'
        ? { label: `Pace per ${u}`, value: `${clock(unitPace)} /${v.unit}` }
        : v.mode === 'time'
          ? { label: 'Finish time', value: clock(sec) }
          : { label: 'Distance', value: `${num(km / perUnitKm, 2)} ${v.unit === 'mi' ? 'miles' : 'km'}` };
    // Even splits, one per unit
    const units = km / perUnitKm;
    const splits: (string | number)[][] = [];
    for (let i = 1; i <= Math.min(Math.floor(units), 60); i++) splits.push([`${i} ${v.unit}`, clock(unitPace), clock(unitPace * i)]);
    if (units % 1 > 0.01 && units < 60) splits.push([`${num(units, 2)} ${v.unit}`, clock(unitPace * (units % 1)), clock(sec)]);
    const preds = Object.values(RACES).map((r) => ({ label: r.label, km: r.km, t: riegel(sec, km, r.km) }));
    return {
      primary,
      rows: [
        ...(v.mode !== 'pace' ? [{ label: `Pace per ${u}`, value: `${clock(unitPace)} /${v.unit}` }] : []),
        { label: v.unit === 'mi' ? 'Pace per km' : 'Pace per mile', value: v.unit === 'mi' ? `${clock(perKm)} /km` : `${clock(perMi)} /mi` },
        { label: 'Speed', value: `${num(kmh / KM_PER_MI, 2)} mph · ${num(kmh, 2)} km/h` },
        ...(v.mode !== 'time' ? [] : [{ label: 'Distance', value: `${num(km, 2)} km · ${num(km / KM_PER_MI, 2)} mi` }]),
        ...(v.mode === 'pace' ? [{ label: 'Time', value: clock(sec) }] : []),
        ...preds.filter((p) => Math.abs(p.km - km) > 0.05).map((p) => ({ label: `Predicted ${p.label}`, value: clock(p.t) })),
      ],
      chart: {
        type: 'hbar',
        title: 'Predicted pace per ' + u + ' at each race distance (min)',
        x: preds.map((p) => p.label),
        series: [{ name: 'Pace (minutes)', values: preds.map((p) => ((p.t / p.km) * perUnitKm) / 60) }],
        y: 'num2',
      },
      table: { caption: `Even splits per ${u}`, head: ['Split', 'Split time', 'Elapsed'], rows: splits },
      steps: [`Distance = ${num(km, 3)} km`, `Time = ${clock(sec)} = ${num(sec, 0)} s`, `Pace = time ÷ distance = ${clock(perKm)} per km = ${clock(perMi)} per mile`, `Predictions use Riegel: T₂ = T₁ × (D₂ ÷ D₁)^1.06`],
    };
  },
  answer: {
    text: (r) =>
      `Running a <strong>10K in 52:30</strong> is a pace of <strong>${r.primary.value.replace(' /mi', '')} per mile</strong> (${r.rows![0].value}), or ${r.rows![1].value}. Based on that result, the Riegel formula predicts about ${r.rows!.find((x) => x.label === 'Predicted Half marathon')?.value ?? ''} for a half marathon.`,
  },
  intro: [
    'A pace calculator links three numbers: distance, time and pace. If you know any two, it finds the third. Runners use it to set a target pace for a race, to convert between minutes per mile and minutes per kilometre, and to print even splits.',
    'This calculator also predicts your times at other distances from one race result, using Peter Riegel’s endurance formula. A half marathon is more than twice a 10K, so the prediction allows for slowing down over the longer distance. The chart shows how your predicted pace changes from the mile to the marathon.',
  ],
  formula: {
    expr: 'Pace = time ÷ distance\nTime = pace × distance\nDistance = time ÷ pace\nPredicted time T₂ = T₁ × (D₂ ÷ D₁)^1.06',
    vars: [
      ['1 mile', '1.609344 km'],
      ['1.06', 'Riegel’s fatigue exponent: each doubling of distance adds about 4% to pace'],
    ],
    notes: ['Predictions assume you have trained for the longer distance. For a first marathon, many coaches add 5–10% to the Riegel estimate.'],
  },
  examples: [
    { title: 'Sub-2-hour half marathon', inputs: { mode: 'pace', race: 'half', time: '1:59:59', unit: 'mi' }, explain: (r) => `You need ${r.primary.value}.` },
    { title: 'Marathon at 5:00 per km', inputs: { mode: 'time', race: 'marathon', unit: 'km', pace: '5:00' }, explain: (r) => `Finish time ${r.primary.value}.` },
    { title: 'How far in 30 minutes at 9:15/mi?', inputs: { mode: 'distance', time: '30:00', pace: '9:15', unit: 'mi' }, explain: (r) => `${r.primary.value}.` },
    { title: '5K in 25:00 – what about a 10K?', inputs: { mode: 'pace', race: '5k', time: '25:00', unit: 'km' }, explain: (r) => `${r.primary.value}; predicted 10K ${r.rows!.find((x) => x.label === 'Predicted 10K')!.value}.` },
  ],
  analysis() {
    const goals: [string, number][] = [['Sub-20 5K', 20 * 60], ['Sub-25 5K', 25 * 60], ['Sub-50 10K', 50 * 60], ['Sub-2 half', 2 * 3600], ['Sub-4 marathon', 4 * 3600], ['Sub-3 marathon', 3 * 3600]];
    const kms = [5, 5, 10, 21.0975, 42.195, 42.195];
    return [
      {
        title: 'The paces behind popular race goals',
        insight: 'Breaking 4 hours in the marathon needs about <strong>9:09 per mile</strong> (5:41 per km), held for 26.2 miles. Breaking 3 hours needs 6:52 per mile. The table shows the exact pace for the most common goals.',
        table: { head: ['Goal', 'Pace per mile', 'Pace per km'], rows: goals.map(([g, t], i) => [g, clock((t / kms[i]) * KM_PER_MI), clock(t / kms[i])]) },
      },
      {
        title: 'How a 25-minute 5K translates to longer races',
        insight: `Riegel’s model predicts that a 25:00 5K runner can do a 10K in about <strong>${clock(riegel(1500, 5, 10))}</strong>, a half in ${clock(riegel(1500, 5, 21.0975))} and a marathon in ${clock(riegel(1500, 5, 42.195))}. Pace slows by about 4% each time the distance doubles.`,
        chart: { type: 'bar', title: 'Predicted finish times from a 25:00 5K (minutes)', x: ['5K', '10K', 'Half', 'Marathon'], series: [{ name: 'Minutes', values: [5, 10, 21.0975, 42.195].map((d) => riegel(1500, 5, d) / 60) }], y: 'int' },
      },
    ];
  },
  variantQs: [
    { q: 'Is this a marathon pace calculator?', a: 'Yes. Choose Marathon, enter your goal time, and you get the pace per mile and per km plus a split for every mile or kilometre.' },
    { q: 'Can it predict my race time?', a: 'Yes. Enter any race result and the calculator predicts your time at other distances using the Riegel formula, as long as you have trained for them.' },
    { q: 'How do I convert min/mile to min/km?', a: 'Divide the pace per mile by 1.609. An 8:00 mile pace is 4:58 per km. The calculator shows both at once.' },
  ],
  tips: [
    'Race pace should feel controlled in the first third. Most personal bests come from even or slightly negative splits.',
    'Easy runs are usually 60–90 seconds per mile slower than marathon pace.',
    'GPS watches often measure a race as slightly long, so aim a few seconds per mile faster than your target pace.',
  ],
  faqs: [
    { q: 'How do I calculate my running pace?', a: 'Divide your total time by the distance. 30 minutes for 5 km is 6:00 per km, or 9:39 per mile.' },
    { q: 'What is a good running pace?', a: 'For recreational runners, a 5K pace of 9–11 minutes per mile is common. Competitive club runners are often under 7 minutes per mile. The best pace is one you can sustain and enjoy.' },
    { q: 'How accurate is the Riegel formula?', a: 'It works well from about 3.5 minutes to 4 hours of running for trained athletes. It tends to be optimistic for longer races if your weekly mileage is low.' },
    { q: 'What pace is a 4-hour marathon?', a: 'About 9:09 per mile, or 5:41 per km.' },
  ],
  sources: [
    { label: 'Riegel PS (1981). Athletic records and human endurance. American Scientist 69(3)', url: 'https://www.jstor.org/stable/27850427' },
    { label: 'World Athletics – Road running distances', url: 'https://worldathletics.org/disciplines/road-running/marathon' },
  ],
  related: ['calorie-calculator', 'tdee-calculator', 'bmi-calculator', 'time-calculator', 'one-rep-max-calculator'],
  disclaimer: 'health',
};
export default calc;
