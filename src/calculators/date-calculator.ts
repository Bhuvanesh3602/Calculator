import { parseDate, daysBetween, ymd, businessDays, addDays, fmtDate } from '../lib/math';
import { num } from '../lib/format';
import type { Calculator } from '../lib/types';

const calc: Calculator = {
  slug: 'date-calculator',
  name: 'Date Calculator',
  short: 'Date',
  category: 'date-time',
  keyword: 'date calculator',
  volume: 550000,
  variants: ['days between dates calculator', 'date and calculator', 'add days to date', 'calendar calculator', 'business days calculator'],
  title: 'Date Calculator – Days Between Dates & Add or Subtract Days',
  description:
    'Count the days, weeks, months and business days between two dates, or add and subtract days, weeks, months or years from any date. Leap years handled.',
  accent: 'count or shift any date',
  icon: '▦',
  inputs: [
    {
      id: 'mode',
      label: 'Calculate',
      type: 'select',
      default: 'diff',
      options: [
        { value: 'diff', label: 'Days between two dates' },
        { value: 'add', label: 'Add to a date' },
        { value: 'sub', label: 'Subtract from a date' },
      ],
    },
    { id: 'from', label: 'Start date', type: 'date', default: 'today' },
    { id: 'to', label: 'End date', type: 'date', default: 'today+30', showIf: { field: 'mode', in: ['diff'] } },
    {
      id: 'inclusive',
      label: 'Count the end date?',
      type: 'select',
      default: 'no',
      options: [
        { value: 'no', label: 'No (standard)' },
        { value: 'yes', label: 'Yes (include both days)' },
      ],
      showIf: { field: 'mode', in: ['diff'] },
    },
    { id: 'years', label: 'Years', type: 'number', default: 0, min: 0, step: 1, showIf: { field: 'mode', in: ['add', 'sub'] } },
    { id: 'months', label: 'Months', type: 'number', default: 0, min: 0, step: 1, showIf: { field: 'mode', in: ['add', 'sub'] } },
    { id: 'weeks', label: 'Weeks', type: 'number', default: 0, min: 0, step: 1, showIf: { field: 'mode', in: ['add', 'sub'] } },
    { id: 'days', label: 'Days', type: 'number', default: 90, min: 0, step: 1, showIf: { field: 'mode', in: ['add', 'sub'] } },
  ],
  compute(v) {
    const a = parseDate(v.from);
    if (v.mode === 'diff') {
      const b = parseDate(v.to);
      const d = daysBetween(a, b) + (v.inclusive === 'yes' ? Math.sign(daysBetween(a, b) || 1) : 0);
      const p = ymd(a, b);
      return {
        primary: { label: `${fmtDate(a)} → ${fmtDate(b)}`, value: `${num(d, 0)} days` },
        rows: [
          { label: 'Years, months, days', value: `${p.years} y ${p.months} m ${p.days} d` },
          { label: 'Weeks and days', value: `${Math.trunc(d / 7)} weeks ${Math.abs(d % 7)} days` },
          { label: 'Business days (Mon–Fri)', value: num(businessDays(a, b), 0) },
          { label: 'Hours', value: num(d * 24, 0) },
          { label: 'Weekend days', value: num(Math.abs(d) - Math.abs(businessDays(a, b)), 0) },
        ],
        note: 'Business days exclude weekends but not public holidays.',
      };
    }
    const s = v.mode === 'sub' ? -1 : 1;
    const r = new Date(a);
    r.setFullYear(r.getFullYear() + s * (+v.years || 0));
    const targetMonth = r.getMonth() + s * (+v.months || 0);
    const day = r.getDate();
    r.setDate(1);
    r.setMonth(targetMonth);
    const dim = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate();
    r.setDate(Math.min(day, dim)); // clamp Jan 31 + 1 month → Feb 28/29
    const out = addDays(r, s * ((+v.weeks || 0) * 7 + (+v.days || 0)));
    return {
      primary: { label: 'Resulting date', value: fmtDate(out) },
      rows: [
        { label: 'Day of week', value: out.toLocaleDateString('en-US', { weekday: 'long' }) },
        { label: 'Total days shifted', value: num(Math.abs(daysBetween(a, out)), 0) },
        { label: 'Day of year', value: String(daysBetween(new Date(out.getFullYear(), 0, 1, 12), out) + 1) },
      ],
    };
  },
  answer: {
    text: () =>
      `To count the days between two dates, subtract the earlier date from the later one. From <strong>January 1, 2026 to December 25, 2026</strong> there are <strong>${daysBetween(new Date(2026, 0, 1, 12), new Date(2026, 11, 25, 12))} days</strong> (${businessDays(new Date(2026, 0, 1, 12), new Date(2026, 11, 25, 12))} of them weekdays). Choose “Add to a date” to find a deadline such as 90 days from today.`,
  },
  intro: [
    'A date calculator answers two everyday questions: how long is it between two dates, and what date is it X days (or weeks, months, years) from now? It handles month lengths and leap years so you don’t have to.',
    'Use it for deadlines, notice periods, warranties, countdowns, project plans and anniversaries. It also counts business days, which is what many contracts and shipping estimates mean by “days”.',
  ],
  formula: {
    expr: 'Days = date₂ − date₁ (calendar days, end date excluded)\nAdding months: same day-of-month, clamped to the month’s last day\nLeap year: divisible by 4, except centuries not divisible by 400',
    vars: [
      ['Business days', 'Monday–Friday, public holidays not removed'],
      ['Inclusive', 'adds 1 to count both the start and end date'],
    ],
  },
  examples: [
    { title: '90 days from Jan 15, 2026', inputs: { mode: 'add', from: '2026-01-15', days: 90 }, explain: (r) => `= ${r.primary.value}.` },
    { title: 'Project: Mar 2 – Jun 30, 2026', inputs: { mode: 'diff', from: '2026-03-02', to: '2026-06-30' }, explain: (r) => `${r.primary.value}, or ${r.rows![2].value} working days.` },
    { title: 'Jan 31 + 1 month', inputs: { mode: 'add', from: '2026-01-31', days: 0, months: 1 }, explain: (r) => `Clamped to ${r.primary.value} because February is shorter.` },
  ],
  analysis() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const bd = months.map((_, i) => businessDays(new Date(2026, i, 0, 12), new Date(2026, i + 1, 0, 12)));
    return [
      {
        title: 'Business days in each month of 2026',
        insight: `Months contain between ${Math.min(...bd)} and <strong>${Math.max(...bd)}</strong> weekdays in 2026, depending on length and where weekends fall. “30 days” and “one month” are rarely the same number of working days.`,
        chart: { type: 'bar', title: 'Weekdays per month, 2026 (before holidays)', x: months, series: [{ name: 'Business days', values: bd }], y: 'int' },
      },
    ];
  },
  variantQs: [
    { q: 'How do I count business days between dates?', a: 'Use “Days between two dates” — the result includes business days (Monday to Friday). Subtract any public holidays that apply to you.' },
    { q: 'Is a calendar calculator the same as a date calculator?', a: 'Yes. Both add or subtract time on the calendar and count days between dates.' },
  ],
  tips: [
    'Check whether a deadline counts calendar days or business days.',
    '“Within 30 days” usually excludes the start day; use the inclusive option if both count.',
    'Adding months to the 29th–31st can land on a shorter month’s last day.',
  ],
  faqs: [
    { q: 'How many days until Christmas?', a: 'Set the end date to December 25 and the start date to today; the calculator updates daily.' },
    { q: 'What date is 100 days from today?', a: 'Choose “Add to a date”, leave the start as today and enter 100 days.' },
    { q: 'How many weeks are in a year?', a: '52 weeks and 1 day (52 weeks and 2 days in a leap year).' },
    { q: 'Is 2028 a leap year?', a: 'Yes. 2028 is divisible by 4 and not a century year, so February has 29 days.' },
  ],
  sources: [{ label: 'U.S. Naval Observatory – Calendars and leap years', url: 'https://aa.usno.navy.mil/faq/calendars' }],
  related: ['age-calculator', 'time-calculator', 'due-date-calculator', 'hours-calculator', 'pregnancy-calculator'],
};
export default calc;
