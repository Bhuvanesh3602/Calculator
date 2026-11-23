import { eddFromLmp, trimester, gestation } from '../lib/pregnancy';
import { addDays, fmtDate, parseDate } from '../lib/math';
import type { Calculator, Values } from '../lib/types';

export function dueDate(v: Values) {
  switch (v.method) {
    case 'conception':
      return addDays(parseDate(v.conception), 266);
    case 'ivf3':
      return addDays(parseDate(v.transfer), 263);
    case 'ivf5':
      return addDays(parseDate(v.transfer), 261);
    case 'ultrasound':
      return addDays(parseDate(v.scan), 280 - (+v.usWeeks * 7 + +v.usDays));
    default:
      return eddFromLmp(parseDate(v.lmp), +v.cycle);
  }
}

const calc: Calculator = {
  slug: 'due-date-calculator',
  name: 'Due Date Calculator',
  short: 'Due Date',
  category: 'health',
  keyword: 'due date calculator',
  volume: 301000,
  variants: ['pregnancy due date calculator', 'ivf due date calculator', 'conception date calculator', 'when is my baby due'],
  title: 'Due Date Calculator – From Last Period, Conception, IVF or Scan',
  description:
    'Estimate your due date from your last period, conception, IVF transfer (day 3 or 5) or an ultrasound, and see the window when birth is likely.',
  accent: 'five ways to date it',
  icon: '◷',
  inputs: [
    {
      id: 'method',
      label: 'Method',
      type: 'select',
      default: 'lmp',
      options: [
        { value: 'lmp', label: 'Last menstrual period' },
        { value: 'conception', label: 'Conception date' },
        { value: 'ivf3', label: 'IVF – day 3 embryo transfer' },
        { value: 'ivf5', label: 'IVF – day 5 blastocyst transfer' },
        { value: 'ultrasound', label: 'Ultrasound dating' },
      ],
    },
    { id: 'lmp', label: 'First day of last period', type: 'date', default: 'today-60', showIf: { field: 'method', in: ['lmp'] } },
    { id: 'cycle', label: 'Cycle length', type: 'number', default: 28, min: 20, max: 45, step: 1, suffix: 'days', showIf: { field: 'method', in: ['lmp'] } },
    { id: 'conception', label: 'Conception date', type: 'date', default: 'today-46', showIf: { field: 'method', in: ['conception'] } },
    { id: 'transfer', label: 'Transfer date', type: 'date', default: 'today-30', showIf: { field: 'method', in: ['ivf3', 'ivf5'] } },
    { id: 'scan', label: 'Scan date', type: 'date', default: 'today-7', showIf: { field: 'method', in: ['ultrasound'] } },
    { id: 'usWeeks', label: 'Gestational age at scan (weeks)', type: 'number', default: 8, min: 4, max: 40, step: 1, showIf: { field: 'method', in: ['ultrasound'] } },
    { id: 'usDays', label: '…plus days', type: 'number', default: 2, min: 0, max: 6, step: 1, showIf: { field: 'method', in: ['ultrasound'] } },
  ],
  compute(v) {
    const edd = dueDate(v);
    const lmp = addDays(edd, -280);
    const g = gestation(lmp, parseDate('today'));
    return {
      primary: { label: 'Estimated due date', value: fmtDate(edd) },
      rows: [
        { label: 'Today you are', value: g.days >= 0 ? `${g.weeks} weeks ${g.rem} days` : 'not yet pregnant by this date' },
        { label: 'Stage', value: g.days >= 0 ? trimester(g.weeks) : '—' },
        { label: 'Full term begins (39w)', value: fmtDate(addDays(lmp, 273)) },
        { label: 'Likely window (37–42 weeks)', value: `${fmtDate(addDays(lmp, 259))} – ${fmtDate(addDays(lmp, 294))}` },
      ],
    };
  },
  answer: {
    text: () =>
      `If your last period started on a given date and your cycle is 28 days, your due date is <strong>280 days (40 weeks) later</strong> — Naegele’s rule. For example, a last period on <strong>January 1, 2026</strong> gives a due date of <strong>${fmtDate(eddFromLmp(new Date(2026, 0, 1, 12)))}</strong>. Most babies arrive in the two weeks either side.`,
  },
  intro: [
    'A due date calculator estimates the day you reach 40 weeks of pregnancy. It is a planning date, not a prediction of birth day: only a small share of babies are born exactly on it.',
    'This calculator supports every common dating method — last menstrual period (with cycle-length adjustment), known conception, IVF day-3 and day-5 transfers, and ultrasound measurements — and shows the full-term and likely-birth windows.',
  ],
  formula: {
    expr: 'LMP:        EDD = LMP + 280 days + (cycle − 28)\nConception: EDD = conception + 266 days\nIVF day 3:  EDD = transfer + 263 days\nIVF day 5:  EDD = transfer + 261 days\nUltrasound: EDD = scan date + (280 − GA at scan in days)',
    vars: [
      ['EDD', 'estimated date of delivery'],
      ['GA', 'gestational age measured at the scan'],
    ],
  },
  examples: [
    { title: 'Period on Mar 15, 2026', inputs: { lmp: '2026-03-15' }, explain: (r) => `Due ${r.primary.value}.` },
    { title: 'Day-5 IVF transfer', inputs: { method: 'ivf5', transfer: '2026-04-10' }, explain: (r) => `Transfer + 261 days: ${r.primary.value}.` },
    { title: '32-day cycle', inputs: { lmp: '2026-03-15', cycle: 32 }, explain: (r) => `Four days later than a 28-day cycle: ${r.primary.value}.` },
  ],
  analysis() {
    const lmp = new Date(2026, 0, 1, 12);
    const methods: [string, number][] = [
      ['LMP (Jan 1)', 280],
      ['Conception (Jan 15)', 266 + 14],
      ['IVF day 3 (Jan 18)', 263 + 17],
      ['IVF day 5 (Jan 20)', 261 + 19],
    ];
    const cats: [string, number, number][] = [
      ['Early term', 259, 272],
      ['Full term', 273, 286],
      ['Late term', 287, 293],
    ];
    return [
      {
        title: 'Every method lands on the same day — when the inputs agree',
        insight: `For a pregnancy with a January 1, 2026 period, conception about January 15, a day-3 transfer on January 18 or a day-5 transfer on January 20 all give <strong>${fmtDate(addDays(lmp, 280))}</strong>. The offsets (266, 263, 261 days) exist only to convert each starting point back to the 280-day LMP scale.`,
        table: { head: ['Starting point', 'Days from LMP to due date', 'Due date'], rows: methods.map(([m, d]) => [m, d, fmtDate(addDays(lmp, d))]) },
      },
      {
        title: 'Your due date is the middle of a window',
        insight: 'ACOG classifies 37–38 weeks as early term, 39–40 weeks as full term and 41 weeks as late term. That is a five-week span in which a healthy birth is normal — plan for the whole window, not one day.',
        chart: { type: 'bar', title: 'Length of each term category (days)', x: cats.map((c) => c[0]), series: [{ name: 'Days', values: cats.map((c) => c[2] - c[1] + 1) }], y: 'int' },
        table: { head: ['Category', 'Starts (LMP Jan 1, 2026)', 'Ends'], rows: cats.map(([n, a, b]) => [n, fmtDate(addDays(lmp, a)), fmtDate(addDays(lmp, b))]) },
      },
    ];
  },
  variantQs: [
    { q: 'How does an IVF due date calculator work?', a: 'IVF gives an exact embryo age. A day-5 blastocyst is already 5 days past fertilisation, so the due date is the transfer date plus 261 days (263 for day-3 embryos).' },
    { q: 'Can I calculate my conception date from my due date?', a: 'Roughly: conception is about 266 days (38 weeks) before the due date, give or take a few days.' },
  ],
  tips: [
    'If you have irregular cycles, an early ultrasound is the most reliable dating method.',
    'Pack your hospital bag by 36 weeks.',
    'Ask your provider which due date is “official” if scan and LMP dates differ.',
  ],
  faqs: [
    { q: 'How accurate is a due date?', a: 'It is an estimate. Only a small minority of babies are born exactly on the due date; most arrive within about two weeks of it.' },
    { q: 'What is Naegele’s rule?', a: 'Add one year, subtract three months and add seven days to the first day of the last period — equivalent to adding 280 days.' },
    { q: 'Can my due date change?', a: 'Yes. Providers may adjust it after an early ultrasound if the measured size differs from the LMP date by more than a set threshold.' },
    { q: 'Does cycle length change my due date?', a: 'Yes. Naegele’s rule assumes a 28-day cycle with ovulation around day 14. With longer cycles ovulation is later, so we add the extra days; shorter cycles move the date earlier.' },
  ],
  sources: [
    { label: 'ACOG Committee Opinion 700 – Methods for estimating the due date', url: 'https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/05/methods-for-estimating-the-due-date' },
    { label: 'CDC National Vital Statistics – Births data', url: 'https://www.cdc.gov/nchs/nvss/births.htm' },
  ],
  related: ['pregnancy-calculator', 'ovulation-calculator', 'date-calculator', 'age-calculator'],
  disclaimer: 'health',
};
export default calc;
