import { parseHM, hm } from '../lib/math';
import { num } from '../lib/format';
import type { Calculator } from '../lib/types';

const clock = (mins: number) => {
  const m = ((Math.round(mins) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60),
    mm = m % 60;
  const ap = h < 12 ? 'AM' : 'PM';
  return `${((h + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${ap}`;
};

const calc: Calculator = {
  slug: 'time-calculator',
  name: 'Time Calculator',
  short: 'Time',
  category: 'date-time',
  keyword: 'time calculator',
  volume: 673000,
  variants: ['add time calculator', 'time duration calculator', 'time between calculator', 'hours and minutes calculator', 'decimal time converter'],
  title: 'Time Calculator – Add, Subtract & Time Between Two Times',
  description:
    'Add or subtract hours, minutes and seconds, find the duration between two clock times (even past midnight), and convert between H:MM and decimal hours.',
  accent: 'hours, minutes, seconds',
  icon: '⏱',
  inputs: [
    {
      id: 'mode',
      label: 'Calculate',
      type: 'select',
      default: 'between',
      options: [
        { value: 'between', label: 'Time between two clock times' },
        { value: 'add', label: 'Add time to a clock time' },
        { value: 'sub', label: 'Subtract time from a clock time' },
        { value: 'dur', label: 'Add two durations' },
      ],
    },
    { id: 'start', label: 'Start time', type: 'time', default: '09:15', showIf: { field: 'mode', in: ['between', 'add', 'sub'] } },
    { id: 'end', label: 'End time', type: 'time', default: '17:40', showIf: { field: 'mode', in: ['between'] } },
    { id: 'h', label: 'Hours', type: 'number', default: 2, min: 0, step: 1, showIf: { field: 'mode', in: ['add', 'sub', 'dur'] } },
    { id: 'm', label: 'Minutes', type: 'number', default: 45, min: 0, step: 1, showIf: { field: 'mode', in: ['add', 'sub', 'dur'] } },
    { id: 's', label: 'Seconds', type: 'number', default: 0, min: 0, step: 1, showIf: { field: 'mode', in: ['add', 'sub', 'dur'] } },
    { id: 'h2', label: 'Second duration: hours', type: 'number', default: 1, min: 0, step: 1, showIf: { field: 'mode', in: ['dur'] } },
    { id: 'm2', label: 'Second duration: minutes', type: 'number', default: 30, min: 0, step: 1, showIf: { field: 'mode', in: ['dur'] } },
  ],
  compute(v) {
    const dur = (+v.h || 0) * 3600 + (+v.m || 0) * 60 + (+v.s || 0);
    const hms = (sec: number) => {
      const h = Math.floor(sec / 3600),
        m = Math.floor((sec % 3600) / 60),
        s = Math.round(sec % 60);
      return `${h}h ${String(m).padStart(2, '0')}m${s ? ' ' + String(s).padStart(2, '0') + 's' : ''}`;
    };
    if (v.mode === 'between') {
      const a = parseHM(v.start),
        b = parseHM(v.end);
      if (!isFinite(a) || !isFinite(b)) return { primary: { label: '', value: '' }, error: 'Enter both times.' };
      let d = b - a;
      const overnight = d < 0;
      if (overnight) d += 1440;
      return {
        primary: { label: `${clock(a)} → ${clock(b)}${overnight ? ' (next day)' : ''}`, value: hm(d) },
        rows: [
          { label: 'Decimal hours', value: num(d / 60, 4) },
          { label: 'Total minutes', value: String(d) },
          { label: 'Total seconds', value: String(d * 60) },
        ],
      };
    }
    if (v.mode === 'dur') {
      const t = dur + (+v.h2 || 0) * 3600 + (+v.m2 || 0) * 60;
      return { primary: { label: 'Total duration', value: hms(t) }, rows: [{ label: 'Decimal hours', value: num(t / 3600, 4) }, { label: 'Total minutes', value: num(t / 60, 2) }] };
    }
    const a = parseHM(v.start);
    const sign = v.mode === 'sub' ? -1 : 1;
    const res = a * 60 + sign * dur;
    const days = Math.floor(res / 86400);
    const secOfDay = ((res % 86400) + 86400) % 86400;
    const s = Math.round(secOfDay % 60);
    return {
      primary: { label: `${clock(a)} ${sign > 0 ? '+' : '−'} ${hms(dur)}`, value: clock(secOfDay / 60) + (s ? ` +${s}s` : '') },
      rows: [
        { label: 'Day offset', value: days === 0 ? 'Same day' : days > 0 ? `+${days} day(s)` : `${days} day(s)` },
        { label: '24-hour clock', value: `${String(Math.floor(secOfDay / 3600)).padStart(2, '0')}:${String(Math.floor((secOfDay % 3600) / 60)).padStart(2, '0')}` },
      ],
    };
  },
  answer: {
    text: (r) =>
      `From <strong>9:15 AM to 5:40 PM</strong> is <strong>${r.primary.value}</strong>, or ${r.rows![0].value} hours in decimal. Subtract the start from the end; if the end is earlier than the start, add 24 hours because the period crosses midnight.`,
  },
  intro: [
    'Time arithmetic is awkward because it is base 60, not base 10: 1:45 + 0:30 is 2:15, not 2:75. A time calculator does the carrying for you.',
    'Use this one to find the time between two clock times (including overnight shifts), add or subtract hours and minutes from a time, add two durations together, and convert between hours:minutes and decimal hours for payroll or invoices.',
  ],
  formula: {
    expr: 'Duration = end − start   (+ 24 h if end < start)\nDecimal hours = hours + minutes ÷ 60\nMinutes from decimal = fraction × 60',
    vars: [
      ['0.25 h', '15 minutes'],
      ['0.1 h', '6 minutes'],
    ],
  },
  examples: [
    { title: 'Night shift 10 PM – 6:30 AM', inputs: { mode: 'between', start: '22:00', end: '06:30' }, explain: (r) => `${r.primary.value} across midnight.` },
    { title: 'Flight departs 11:50 + 7h 25m', inputs: { mode: 'add', start: '11:50', h: 7, m: 25 }, explain: (r) => `Lands at ${r.primary.value} (origin time zone).` },
    { title: '1h 45m + 2h 50m', inputs: { mode: 'dur', h: 1, m: 45, s: 0, h2: 2, m2: 50 }, explain: (r) => `= ${r.primary.value}.` },
  ],
  analysis() {
    const mins = [5, 6, 10, 12, 15, 20, 25, 30, 40, 45, 50, 55];
    return [
      {
        title: 'Minutes to decimal hours',
        insight: 'The most common timesheet mistake is writing 7 hours 30 minutes as 7.30. It is <strong>7.5</strong> hours. Each minute is 1/60 ≈ 0.0167 of an hour; 6 minutes is exactly 0.1.',
        chart: { type: 'bar', title: 'Decimal value of minutes', x: mins.map((m) => m + ' min'), series: [{ name: 'Hours', values: mins.map((m) => m / 60) }], y: 'num2' },
        table: { head: ['Minutes', 'Decimal hours'], rows: mins.map((m) => [m, num(m / 60, 4)]) },
      },
    ];
  },
  variantQs: [
    { q: 'How do I add time together?', a: 'Add hours and minutes separately, then carry every 60 minutes into an hour. Choose “Add two durations” to do it automatically.' },
    { q: 'How do I calculate the time between two times?', a: 'Subtract the start from the end. If the result is negative, add 24 hours. Choose “Time between two clock times”.' },
  ],
  tips: [
    'Write durations as h:mm, decimal hours as a plain number — never mix them.',
    'Across time zones, convert both times to the same zone first.',
    'Daylight-saving changes can add or remove an hour from overnight spans.',
  ],
  faqs: [
    { q: 'How many hours is 9 AM to 5 PM?', a: '8 hours. Subtract any unpaid break to get hours worked.' },
    { q: 'How do I convert minutes to decimal hours?', a: 'Divide the minutes by 60. 45 minutes ÷ 60 = 0.75 hours.' },
    { q: 'What is 1.3 hours in minutes?', a: '1 hour and 18 minutes (0.3 × 60 = 18).' },
    { q: 'How do I calculate hours past midnight?', a: 'Add 24 hours to the end time before subtracting. 10 PM to 6 AM is (6 + 24) − 22 = 8 hours.' },
  ],
  sources: [{ label: 'NIST – Time and frequency, the SI second', url: 'https://www.nist.gov/pml/time-and-frequency-division' }],
  related: ['hours-calculator', 'time-card-calculator', 'date-calculator', 'age-calculator', 'paycheck-calculator'],
};
export default calc;
