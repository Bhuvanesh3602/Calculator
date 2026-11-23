import { addDays, fmtDate, parseDate } from '../lib/math';
import type { Calculator } from '../lib/types';

/** Probability of conception from a single act of intercourse by day relative to ovulation (Wilcox et al., NEJM 1995). */
export const WILCOX: [number, number][] = [
  [-5, 10],
  [-4, 16],
  [-3, 14],
  [-2, 27],
  [-1, 31],
  [0, 33],
];

const short = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const calc: Calculator = {
  slug: 'ovulation-calculator',
  name: 'Ovulation Calculator',
  short: 'Ovulation',
  category: 'health',
  keyword: 'ovulation calculator',
  volume: 368000,
  variants: ['calculator of ovulation period', 'fertile window calculator', 'ovu calculator', 'when am I ovulating'],
  title: 'Ovulation Calculator – Fertile Window for the Next 3 Cycles',
  description:
    'Predict ovulation and your fertile window for the next three cycles from your last period and cycle length, with research-based conception odds by day.',
  accent: 'and your fertile window',
  icon: '○',
  inputs: [
    { id: 'lmp', label: 'First day of last period', type: 'date', default: 'today-10' },
    { id: 'cycle', label: 'Average cycle length', type: 'number', default: 28, min: 20, max: 45, step: 1, suffix: 'days' },
    { id: 'luteal', label: 'Luteal phase', type: 'number', default: 14, min: 10, max: 16, step: 1, suffix: 'days', help: 'Days from ovulation to next period. 14 if unknown.' },
  ],
  compute(v) {
    const lmp = parseDate(v.lmp);
    const c = +v.cycle,
      l = +v.luteal;
    if (!(c >= 20 && c <= 45)) return { primary: { label: '', value: '' }, error: 'Cycle length should be between 20 and 45 days.' };
    const cycles = [0, 1, 2].map((i) => {
      const start = addDays(lmp, i * c);
      const ov = addDays(start, c - l);
      return { start, ov, from: addDays(ov, -5), to: addDays(ov, 1), next: addDays(start, c) };
    });
    return {
      primary: { label: 'Estimated ovulation', value: fmtDate(cycles[0].ov) },
      rows: [
        { label: 'Fertile window', value: `${short(cycles[0].from)} – ${short(cycles[0].to)}` },
        { label: 'Most fertile days', value: `${short(addDays(cycles[0].ov, -2))} – ${short(cycles[0].ov)}` },
        { label: 'Next period expected', value: fmtDate(cycles[0].next) },
        { label: 'Pregnancy test from', value: fmtDate(addDays(cycles[0].ov, 14)) },
      ],
      chart: {
        type: 'bar',
        title: 'Chance of conception by day, this cycle',
        x: WILCOX.map(([d]) => short(addDays(cycles[0].ov, d))),
        series: [{ name: 'Conception chance', values: WILCOX.map(([, p]) => p) }],
        y: 'pct',
        xTitle: 'Day (ovulation is the last bar)',
      },
      table: { head: ['Cycle', 'Fertile window', 'Ovulation', 'Next period'], rows: cycles.map((x, i) => [i + 1, `${short(x.from)} – ${short(x.to)}`, fmtDate(x.ov), fmtDate(x.next)]) },
    };
  },
  answer: {
    text: () =>
      'With a regular <strong>28-day cycle</strong>, ovulation usually happens around <strong>day 14</strong> — 14 days before the next period. Your fertile window is the <strong>5 days before ovulation plus ovulation day</strong>, and the two days just before ovulation give the highest chance of conceiving.',
  },
  intro: [
    'An ovulation calculator predicts when an egg is likely to be released, so you can time intercourse when trying to conceive. Ovulation typically occurs about 14 days before your next period — not necessarily on day 14 of your cycle.',
    'Enter the first day of your last period and your usual cycle length. We estimate ovulation and the six-day fertile window for your next three cycles and show research-based conception chances for each day of the window.',
  ],
  formula: {
    expr: 'Ovulation = cycle start + (cycle length − luteal phase)\nFertile window = ovulation − 5 days  →  ovulation + 1 day',
    vars: [
      ['luteal phase', 'usually 12–14 days and fairly constant for each person'],
      ['−5 days', 'sperm can survive up to about five days'],
    ],
    notes: ['Calendar methods are less reliable with irregular cycles. Ovulation tests (LH strips), basal body temperature and cervical mucus tracking give more precise timing.'],
  },
  examples: [
    { title: '28-day cycle', inputs: { lmp: '2026-12-01' }, explain: (r) => `Ovulation around ${r.primary.value}.` },
    { title: '32-day cycle', inputs: { lmp: '2026-12-01', cycle: 32 }, explain: (r) => `Longer cycles mean later ovulation: ${r.primary.value}.` },
    { title: 'Short luteal phase', inputs: { lmp: '2026-12-01', cycle: 26, luteal: 12 }, explain: (r) => `Fertile window ${r.rows![0].value}.` },
  ],
  analysis() {
    const cycles = [24, 26, 28, 30, 32, 35];
    return [
      {
        title: 'Conception chance by day of the fertile window',
        insight: 'In a landmark study of 221 couples, the chance of conception from a single act of intercourse rose from about 10% five days before ovulation to roughly <strong>a third</strong> on the two days before and the day of ovulation. After ovulation, the chance fell to near zero.',
        chart: { type: 'bar', title: 'Approximate conception probability by day (Wilcox et al., 1995)', x: WILCOX.map(([d]) => (d === 0 ? 'Ovulation' : d + ' days')), series: [{ name: 'Probability', values: WILCOX.map(([, p]) => p) }], y: 'pct' },
      },
      {
        title: 'Cycle length changes ovulation day, not luteal length',
        insight: 'With a 14-day luteal phase, ovulation falls on day 10 of a 24-day cycle but day 21 of a 35-day cycle. Using “day 14” for everyone mistimes the window for many people.',
        chart: { type: 'bar', title: 'Ovulation cycle day by cycle length', x: cycles.map((c) => c + '-day cycle'), series: [{ name: 'Ovulation day', values: cycles.map((c) => c - 14) }], y: 'int' },
      },
    ];
  },
  variantQs: [
    { q: 'What is a calculator of ovulation period?', a: 'It estimates the days in your cycle when you can get pregnant — the fertile window — based on your period dates and cycle length.' },
    { q: 'Is “ovu calculator” the same thing?', a: 'Yes, it is shorthand for ovulation calculator.' },
  ],
  tips: [
    'Track 3–6 cycles to find your true average cycle length.',
    'Having sex every 1–2 days during the fertile window maximises chances.',
    'See a doctor if you are under 35 and haven’t conceived after 12 months of trying (6 months if 35+).',
    'Calendar methods are not reliable birth control.',
  ],
  faqs: [
    { q: 'When am I most fertile?', a: 'The two days before ovulation and the day of ovulation have the highest chance of conception.' },
    { q: 'Can I get pregnant right after my period?', a: 'Yes, especially with short cycles, because sperm can survive several days and ovulation may come early.' },
    { q: 'How long does ovulation last?', a: 'The egg survives about 12–24 hours after release, but the fertile window is about six days because of sperm survival.' },
    { q: 'How accurate are ovulation calculators?', a: 'They are estimates. Cycles vary month to month; combining the calendar with LH tests improves accuracy.' },
  ],
  sources: [
    { label: 'Wilcox AJ et al. (1995), NEJM – Timing of sexual intercourse in relation to ovulation', url: 'https://www.nejm.org/doi/full/10.1056/NEJM199512073332301' },
    { label: 'ACOG – Trying to get pregnant? Here’s when to have sex', url: 'https://www.acog.org/womens-health/experts-and-stories/the-latest/trying-to-get-pregnant-heres-when-to-have-sex' },
  ],
  related: ['due-date-calculator', 'pregnancy-calculator', 'date-calculator', 'bmi-calculator'],
  disclaimer: 'health',
};
export default calc;
