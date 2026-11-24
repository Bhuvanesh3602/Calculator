import { hm, parseHM } from '../lib/math';
import { num, usd2 } from '../lib/format';
import type { Calculator, Values } from '../lib/types';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const day = (d: string, i: string, o: string, b: number) => ({ day: d, in: i, out: o, brk: b });

/** Round a clock time to the nearest quarter hour (the FLSA “7-minute rule”). */
export const roundQ = (mins: number) => Math.round(mins / 15) * 15;

export function card(rows: Values[], rounding: boolean): (Values & { mins: number })[] {
  return rows.map((r) => {
    let a = parseHM(r.in),
      b = parseHM(r.out);
    if (!isFinite(a) || !isFinite(b)) return { ...r, mins: 0 };
    if (rounding) {
      a = roundQ(a);
      b = roundQ(b);
    }
    let d = b - a;
    if (d < 0) d += 1440;
    return { ...r, mins: Math.max(0, d - (+r.brk || 0)) };
  });
}

const calc: Calculator = {
  slug: 'time-card-calculator',
  name: 'Time Card Calculator',
  short: 'Time Card',
  category: 'date-time',
  keyword: 'time card calculator',
  volume: 201000,
  variants: ['timesheet calculator', 'weekly time card calculator', 'time clock calculator', 'punch card calculator'],
  title: 'Time Card Calculator – Weekly Timesheet with Overtime & Pay',
  description:
    'Fill in a weekly time card with clock-in, clock-out and breaks. Get total hours, overtime over 40, and gross pay, with optional quarter-hour rounding.',
  accent: 'a full week, totalled',
  icon: '▤',
  inputs: [
    {
      id: 'rows',
      label: 'This week',
      type: 'rows',
      addLabel: 'Add day',
      maxRows: 14,
      columns: [
        { id: 'day', label: 'Day', type: 'text', default: 'Sat' },
        { id: 'in', label: 'In', type: 'time', default: '09:00' },
        { id: 'out', label: 'Out', type: 'time', default: '17:00' },
        { id: 'brk', label: 'Break (min)', type: 'number', default: 30, min: 0, step: 5 },
      ],
      default: [day('Mon', '08:55', '17:32', 30), day('Tue', '09:02', '17:45', 30), day('Wed', '08:47', '18:10', 45), day('Thu', '09:00', '17:00', 30), day('Fri', '08:58', '16:20', 30)],
    },
    { id: 'rate', label: 'Hourly rate', type: 'number', default: 24, min: 0, step: 0.25, prefix: '$' },
    { id: 'ot', label: 'Overtime after', type: 'number', default: 40, min: 0, max: 80, step: 1, suffix: 'h/week' },
    { id: 'otx', label: 'Overtime multiplier', type: 'number', default: 1.5, min: 1, max: 3, step: 0.25, suffix: '×' },
    {
      id: 'round',
      label: 'Round punches to nearest 15 min',
      type: 'select',
      default: 'no',
      options: [
        { value: 'no', label: 'No – exact minutes' },
        { value: 'yes', label: 'Yes – 7-minute rule' },
      ],
    },
  ],
  compute(v) {
    const rows = card(v.rows || [], v.round === 'yes');
    const total = rows.reduce((a, r) => a + r.mins, 0);
    const otAt = (+v.ot || 40) * 60;
    const reg = Math.min(total, otAt),
      ot = Math.max(0, total - otAt);
    const rate = +v.rate || 0;
    const pay = (reg / 60) * rate + (ot / 60) * rate * (+v.otx || 1.5);
    return {
      primary: { label: 'Total hours this week', value: `${hm(total)}  (${num(total / 60, 2)} h)` },
      rows: [
        { label: 'Regular hours', value: num(reg / 60, 2) },
        { label: 'Overtime hours', value: num(ot / 60, 2) },
        { label: 'Regular pay', value: usd2((reg / 60) * rate) },
        { label: 'Overtime pay', value: usd2((ot / 60) * rate * (+v.otx || 1.5)) },
        { label: 'Gross pay', value: usd2(pay) },
      ],
      chart: {
        type: 'bar',
        title: 'Hours worked per day',
        x: rows.map((r) => String(r.day || '')),
        series: [{ name: 'Hours', values: rows.map((r) => r.mins / 60) }],
        y: 'num2',
      },
      table: { head: ['Day', 'In', 'Out', 'Break', 'Hours'], rows: rows.map((r) => [r.day, r.in, r.out, r.brk + ' min', num(r.mins / 60, 2)]) },
    };
  },
  answer: {
    text: (r) =>
      `For a week of five shifts with breaks, the time card totals <strong>${r.primary.value.split('  ')[0]}</strong> (${r.rows![0].value} regular hours). At $24/hour, gross pay is <strong>${r.rows![4].value}</strong>. Hours above 40 in the week are paid at 1.5× under federal overtime rules.`,
  },
  intro: [
    'A time card calculator totals a week of clock-in and clock-out times. Enter each day’s punches and unpaid break; it adds everything up, splits regular hours from overtime, and multiplies by your rate to get gross pay.',
    'Employers can turn on quarter-hour rounding, which the U.S. Department of Labor permits as long as it averages out fairly over time (punches within 7 minutes round down, 8+ round up). Comparing rounded and exact totals is a quick way to check that a policy is neutral.',
  ],
  formula: {
    expr: 'Daily hours = (out − in) − break\nRegular = min(total, 40)\nOvertime = max(0, total − 40)\nGross pay = regular × rate + overtime × rate × 1.5',
    vars: [['7-minute rule', 'round each punch to the nearest 15 minutes (1–7 min down, 8–14 min up)']],
  },
  examples: [
    { title: 'Five 9-hour days', inputs: { rows: DAYS.slice(0, 5).map((d) => day(d, '08:00', '17:30', 30)), rate: 20 }, explain: (r) => `${r.rows![1].value} overtime hours → gross ${r.rows![4].value}.` },
    { title: 'Part-time, 3 days', inputs: { rows: DAYS.slice(0, 3).map((d) => day(d, '12:00', '18:00', 0)), rate: 17 }, explain: (r) => `${r.primary.value.split('  ')[0]}, no overtime.` },
    { title: 'With rounding on', inputs: { round: 'yes' }, explain: (r) => `Rounded total ${r.primary.value.split('  ')[0]} — compare with exact minutes.` },
  ],
  analysis() {
    const hours = [30, 35, 40, 45, 50, 55, 60];
    const pay = hours.map((h) => Math.min(h, 40) * 24 + Math.max(0, h - 40) * 36);
    const eff = hours.map((h, i) => pay[i] / h);
    return [
      {
        title: 'How overtime changes weekly pay',
        insight: `At $24/hour, a 50-hour week pays <strong>${usd2(pay[4])}</strong> — ${usd2(pay[4] - 50 * 24)} more than 50 straight-time hours. The effective hourly rate rises to ${usd2(eff[4])}.`,
        chart: { type: 'bar', title: 'Gross weekly pay by hours worked ($24/h, 1.5× over 40)', x: hours.map((h) => h + ' h'), series: [{ name: 'Gross pay', values: pay }], y: 'usd' },
        table: { head: ['Hours', 'Gross pay', 'Effective hourly'], rows: hours.map((h, i) => [h, usd2(pay[i]), usd2(eff[i])]) },
      },
      {
        title: 'Rounding: neutral on average, not every day',
        insight: 'Under the 7-minute rule, a punch at 8:07 counts as 8:00 and 8:08 counts as 8:15. Over many punches that are randomly early or late, the gains and losses roughly cancel. A policy that only ever rounds in the employer’s favor is not allowed.',
        table: { head: ['Actual punch', 'Rounded to'], rows: [['8:52', '8:45'], ['8:53', '9:00'], ['9:07', '9:00'], ['9:08', '9:15'], ['5:22', '5:15'], ['5:23', '5:30']] },
      },
    ];
  },
  variantQs: [
    { q: 'Is this a timesheet calculator?', a: 'Yes — time card and timesheet calculators do the same job: total daily hours into a weekly figure with overtime.' },
    { q: 'How do I calculate a time card with lunch breaks?', a: 'Enter each day’s unpaid break in minutes. It is subtracted from that day’s hours.' },
  ],
  tips: [
    'Overtime is calculated per workweek — a fixed, recurring 168-hour period chosen by the employer.',
    'Some states (such as California) also require daily overtime over 8 hours; check your state.',
    'Keep copies of your time cards for at least as long as your employer must (2–3 years under federal rules).',
  ],
  faqs: [
    { q: 'How do I total hours on a time card?', a: 'For each day subtract the in time from the out time, subtract breaks, convert to decimal hours, and add the days.' },
    { q: 'How is overtime calculated?', a: 'For non-exempt employees, hours over 40 in a workweek are paid at 1.5 times the regular rate.' },
    { q: 'Is time-clock rounding legal?', a: 'Yes, under federal rules, if it rounds to the nearest 5, 6 or 15 minutes and averages out so employees are paid for all time worked.' },
    { q: 'Can I add more than 7 rows?', a: 'Yes, up to 14 — useful for biweekly cards or split shifts. Note that overtime is still applied to the combined total.' },
  ],
  sources: [
    { label: 'U.S. DOL – Overtime pay', url: 'https://www.dol.gov/agencies/whd/overtime' },
    { label: '29 CFR 785.48 – Use of time clocks (rounding)', url: 'https://www.ecfr.gov/current/title-29/section-785.48' },
  ],
  related: ['hours-calculator', 'paycheck-calculator', 'time-calculator', 'payroll-calculator'],
};
export default calc;
