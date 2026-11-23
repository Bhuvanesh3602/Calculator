import { parseHM, hm } from '../lib/math';
import { num, usd2 } from '../lib/format';
import type { Calculator } from '../lib/types';

export function shiftMinutes(start: string, end: string, breakMin: number) {
  let d = parseHM(end) - parseHM(start);
  if (d < 0) d += 1440;
  return Math.max(0, d - (breakMin || 0));
}

const calc: Calculator = {
  slug: 'hours-calculator',
  name: 'Hours Calculator',
  short: 'Hours',
  category: 'date-time',
  keyword: 'hours calculator',
  volume: 301000,
  variants: ['work hours calculator', 'hours worked calculator', 'shift hours calculator', 'hours between times'],
  title: 'Hours Calculator – Hours Worked Between Two Times, Minus Breaks',
  description:
    'Calculate hours worked between a start and end time minus unpaid breaks, in hours:minutes and decimal, with pay at your hourly rate. Overnight shifts OK.',
  accent: 'minus the breaks',
  icon: 'H',
  inputs: [
    { id: 'start', label: 'Start time', type: 'time', default: '08:30' },
    { id: 'end', label: 'End time', type: 'time', default: '17:15' },
    { id: 'brk', label: 'Unpaid break', type: 'number', default: 30, min: 0, max: 600, step: 5, suffix: 'min' },
    { id: 'rate', label: 'Hourly rate (optional)', type: 'number', default: 22, min: 0, step: 0.25, prefix: '$' },
    { id: 'days', label: 'Same shift, days per week', type: 'number', default: 5, min: 1, max: 7, step: 1 },
  ],
  compute(v) {
    if (!v.start || !v.end) return { primary: { label: '', value: '' }, error: 'Enter start and end times.' };
    const m = shiftMinutes(v.start, v.end, +v.brk);
    const week = m * (+v.days || 1);
    const rate = +v.rate || 0;
    const reg = Math.min(week, 2400),
      ot = Math.max(0, week - 2400);
    return {
      primary: { label: 'Hours worked per shift', value: `${hm(m)}  (${num(m / 60, 2)} h)` },
      rows: [
        { label: 'Decimal hours', value: num(m / 60, 4) },
        { label: 'Pay per shift', value: rate ? usd2((m / 60) * rate) : '—' },
        { label: `Weekly hours (${v.days} days)`, value: `${hm(week)} (${num(week / 60, 2)} h)` },
        { label: 'Weekly pay (incl. 1.5× over 40h)', value: rate ? usd2((reg / 60) * rate + (ot / 60) * rate * 1.5) : '—' },
      ],
    };
  },
  answer: {
    text: (r) =>
      `Working from <strong>8:30 AM to 5:15 PM</strong> with a 30-minute unpaid break is <strong>${r.primary.value.split('  ')[0]}</strong>, or ${r.rows![0].value} hours in decimal. At $22 an hour that shift pays <strong>${r.rows![1].value}</strong>.`,
  },
  intro: [
    'An hours calculator works out how long you worked between clock-in and clock-out, then subtracts unpaid breaks. It gives the answer both as hours and minutes and as decimal hours, the format most payroll systems need.',
    'Add your hourly rate to see pay per shift and per week, including federal overtime at 1.5× for hours over 40. For a different schedule each day, use our time card calculator.',
  ],
  formula: {
    expr: 'Worked = (end − start) − break   (+24 h if the shift crosses midnight)\nDecimal hours = minutes ÷ 60\nPay = decimal hours × rate',
    vars: [['Overtime', 'FLSA: 1.5× regular rate for hours over 40 in a workweek (non-exempt employees)']],
  },
  examples: [
    { title: 'Nurse 7 PM – 7:30 AM', inputs: { start: '19:00', end: '07:30', brk: 30, days: 3, rate: 45 }, explain: (r) => `12 hours a shift; ${r.rows![2].value} weekly.` },
    { title: 'Part-time 10 AM – 2:45 PM', inputs: { start: '10:00', end: '14:45', brk: 0, days: 4, rate: 16 }, explain: (r) => `${r.rows![0].value} decimal hours; pays ${r.rows![1].value}.` },
    { title: '6 days of 9-hour shifts', inputs: { start: '07:00', end: '16:30', brk: 30, days: 6, rate: 20 }, explain: (r) => `14 hours of overtime: weekly pay ${r.rows![3].value}.` },
  ],
  analysis() {
    const brks = [0, 15, 30, 45, 60];
    const paid = brks.map((b) => (shiftMinutes('09:00', '17:00', b) / 60) * 5 * 52 * 20);
    return [
      {
        title: 'What an unpaid break costs over a year',
        insight: `On a 9-to-5 schedule at $20/hour, five days a week, each 15 minutes of unpaid break reduces annual pay by about <strong>${usd2(paid[0] - paid[1])}</strong>. A 30-minute unpaid lunch means 7.5 paid hours, not 8.`,
        chart: { type: 'bar', title: 'Annual pay by unpaid break length ($20/h, 9–5, 5 days)', x: brks.map((b) => b + ' min'), series: [{ name: 'Annual pay', values: paid }], y: 'usd' },
      },
    ];
  },
  variantQs: [
    { q: 'How do I calculate work hours?', a: 'Subtract your start time from your end time, then subtract unpaid breaks. Convert minutes to decimals by dividing by 60.' },
    { q: 'How do I calculate hours worked overnight?', a: 'If the end time is earlier than the start, add 24 hours before subtracting. The calculator does this automatically.' },
  ],
  tips: [
    'Short rest breaks (typically 5–20 minutes) are generally paid under federal rules; meal breaks of 30+ minutes can be unpaid.',
    'Overtime is based on hours actually worked in the workweek, not per day (except in a few states like California).',
    'Keep your own record of hours — it helps resolve payroll errors.',
  ],
  faqs: [
    { q: 'How many hours is 8:30 to 5?', a: '8.5 hours, or 8 hours with a 30-minute unpaid lunch.' },
    { q: 'How do I convert hours and minutes to decimal?', a: 'Divide minutes by 60 and add to the hours. 7 h 45 m = 7 + 45/60 = 7.75.' },
    { q: 'Are lunch breaks paid?', a: 'Under the FLSA, bona fide meal periods (usually 30 minutes or more, fully relieved of duty) don’t have to be paid. State laws may add requirements.' },
    { q: 'When do I get overtime?', a: 'Non-exempt employees covered by the FLSA earn 1.5× their regular rate for hours over 40 in a workweek.' },
  ],
  sources: [
    { label: 'U.S. Department of Labor – Overtime pay', url: 'https://www.dol.gov/agencies/whd/overtime' },
    { label: 'U.S. DOL – Breaks and meal periods', url: 'https://www.dol.gov/general/topic/workhours/breaks' },
  ],
  related: ['time-card-calculator', 'time-calculator', 'paycheck-calculator', 'payroll-calculator', 'date-calculator'],
};
export default calc;
