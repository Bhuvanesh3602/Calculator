import { parseDate, daysBetween, ymd, fmtDate } from '../lib/math';
import { num } from '../lib/format';
import type { Calculator } from '../lib/types';

export const GENERATIONS: [string, number, number][] = [
  ['Silent Generation', 1928, 1945],
  ['Baby Boomers', 1946, 1964],
  ['Generation X', 1965, 1980],
  ['Millennials', 1981, 1996],
  ['Generation Z', 1997, 2012],
  ['Generation Alpha', 2013, 2030],
];

const calc: Calculator = {
  slug: 'age-calculator',
  name: 'Age Calculator',
  short: 'Age',
  category: 'date-time',
  keyword: 'age calculator',
  volume: 550000,
  variants: ['age calculation calculator', 'age as on calculator', 'birthday calculator', 'how old am I', 'date of birth calculator'],
  title: 'Age Calculator – Exact Age in Years, Months & Days',
  description:
    'Calculate your exact age in years, months and days on any date, plus days lived, the weekday you were born and a countdown to your next birthday.',
  accent: 'to the day',
  icon: '🎂',
  inputs: [
    { id: 'dob', label: 'Date of birth', type: 'date', default: '1990-06-15' },
    { id: 'on', label: 'Age on (as of) date', type: 'date', default: 'today' },
  ],
  compute(v) {
    const dob = parseDate(v.dob),
      on = parseDate(v.on);
    if (on < dob) return { primary: { label: '', value: '' }, error: 'The “as of” date is before the date of birth.' };
    const a = ymd(dob, on);
    const days = daysBetween(dob, on);
    let next = new Date(on.getFullYear(), dob.getMonth(), dob.getDate(), 12);
    if (next < on || daysBetween(on, next) === 0) {
      if (daysBetween(on, next) !== 0) next = new Date(on.getFullYear() + 1, dob.getMonth(), dob.getDate(), 12);
    }
    const toNext = daysBetween(on, next);
    const gen = GENERATIONS.find(([, s, e]) => dob.getFullYear() >= s && dob.getFullYear() <= e);
    const ms = [18, 21, 30, 40, 50, 62, 65, 67, 73];
    return {
      primary: { label: 'Age', value: `${a.years} years ${a.months} months ${a.days} days` },
      rows: [
        { label: 'Born on a', value: dob.toLocaleDateString('en-US', { weekday: 'long' }) },
        { label: 'Total months', value: num(a.years * 12 + a.months, 0) },
        { label: 'Total weeks', value: num(Math.floor(days / 7), 0) },
        { label: 'Total days', value: num(days, 0) },
        { label: 'Next birthday', value: toNext === 0 ? 'Today — happy birthday! 🎉' : `${fmtDate(next)} (in ${toNext} days, turning ${next.getFullYear() - dob.getFullYear()})` },
        { label: 'Generation', value: gen ? `${gen[0]} (${gen[1]}–${gen[2] === 2030 ? '' : gen[2]})` : '—' },
      ],
      table: { head: ['Milestone age', 'Date reached'], rows: ms.map((m) => [m, fmtDate(new Date(dob.getFullYear() + m, dob.getMonth(), dob.getDate(), 12))]) },
    };
  },
  answer: {
    text: (r) =>
      `Someone born on <strong>June 15, 1990</strong> is <strong>${r.primary.value}</strong> old today. That is ${r.rows![3].value} days, or ${r.rows![2].value} weeks. Enter any birth date and “as of” date to get an exact age — useful for forms that ask “age as on” a specific date.`,
  },
  intro: [
    'An age calculator works out exactly how old someone is on a given date, in years, months and days. It counts calendar months properly, so it handles different month lengths and leap-day birthdays correctly.',
    'Set the “as of” date to find age on a past or future date — for school admission cut-offs, exam eligibility, insurance quotes or retirement planning. You also get total days lived, the weekday you were born, your generation and dates for milestone birthdays.',
  ],
  formula: {
    expr: 'Years = full years elapsed since birth\nMonths = full months after the last birthday\nDays = remaining days (borrowing the previous month’s length if needed)',
    vars: [['Feb 29 birthdays', 'in non-leap years the birthday is treated as Feb 28 for counting purposes in this tool; legal rules vary']],
  },
  examples: [
    { title: 'Age on a school cut-off', inputs: { dob: '2021-09-03', on: '2026-09-01' }, explain: (r) => `${r.primary.value} — just under 5 on the cut-off date.` },
    { title: 'Retirement planning', inputs: { dob: '1965-03-20', on: '2032-03-20' }, explain: (r) => `Exactly ${r.primary.value.split(' ')[0]} on that date.` },
    { title: 'Leap-day baby', inputs: { dob: '2004-02-29', on: '2026-03-01' }, explain: (r) => `${r.primary.value}.` },
  ],
  analysis() {
    const yrs = GENERATIONS.map(([n, s, e]) => ({ n, span: Math.min(e, 2026) - s + 1, age: 2026 - Math.round((s + Math.min(e, 2026)) / 2) }));
    return [
      {
        title: 'Generations and their age in 2026',
        insight: 'Generation boundaries are conventions, not science. Pew Research Center defines Millennials as born 1981–1996 and Gen Z as 1997–2012; in 2026 Millennials are roughly 30 to 45.',
        chart: { type: 'hbar', title: 'Approximate midpoint age in 2026', x: yrs.map((y) => y.n), series: [{ name: 'Midpoint age', values: yrs.map((y) => y.age) }], y: 'int' },
        table: { head: ['Generation', 'Born', 'Age range in 2026'], rows: GENERATIONS.map(([n, s, e]) => [n, `${s}–${e === 2030 ? 'present' : e}`, `${Math.max(0, 2026 - Math.min(e, 2026))}–${2026 - s}`]) },
      },
      {
        title: 'Key US age milestones',
        insight: 'Many rights and benefits switch on at specific ages. Some vary by state; federal ages are shown.',
        table: {
          head: ['Age', 'Milestone (US)'],
          rows: [
            ['18', 'Vote in federal elections; legal adult in most states'],
            ['21', 'Minimum legal age to buy alcohol and tobacco'],
            ['26', 'Coverage on a parent’s health plan ends'],
            ['59½', 'Penalty-free IRA/401(k) withdrawals begin'],
            ['62', 'Earliest Social Security retirement benefits'],
            ['65', 'Medicare eligibility'],
            ['67', 'Full Social Security retirement age (born 1960+)'],
            ['73–75', 'Required minimum distributions begin'],
          ],
        },
      },
    ];
  },
  variantQs: [
    { q: 'What is an “age as on” calculator?', a: 'It calculates age on a specific date rather than today — common for exam and job applications. Set the “Age on” field to the required date.' },
    { q: 'Can I use this as a birthday calculator?', a: 'Yes. It shows the day of the week you were born, days until your next birthday and the dates of milestone birthdays.' },
  ],
  tips: [
    'For official forms, check whether the cut-off counts age “on” or “before” the date.',
    'Leap-day birthdays are legally recognised on Feb 28 or Mar 1 depending on the jurisdiction.',
    'Use the milestone table to plan Social Security or Medicare decisions.',
  ],
  faqs: [
    { q: 'How do I calculate my exact age?', a: 'Count full years since your birth date, then full months since your last birthday, then the remaining days. The calculator does this automatically.' },
    { q: 'How many days old am I?', a: 'Enter your date of birth; the “Total days” line shows how many days you have lived as of today.' },
    { q: 'What day of the week was I born?', a: 'It is shown in the “Born on a” line.' },
    { q: 'How is age calculated for a February 29 birthday?', a: 'In non-leap years, the person typically turns a year older on Feb 28 or Mar 1, depending on local law. This tool counts the birthday as complete once Feb 28 has passed.' },
  ],
  sources: [
    { label: 'Pew Research Center – Defining generations', url: 'https://www.pewresearch.org/short-reads/2019/01/17/where-millennials-end-and-generation-z-begins/' },
    { label: 'Social Security Administration – Retirement age', url: 'https://www.ssa.gov/benefits/retirement/planner/agereduction.html' },
  ],
  related: ['date-calculator', 'time-calculator', 'rmd-calculator', 'height-calculator', 'pregnancy-calculator'],
};
export default calc;
