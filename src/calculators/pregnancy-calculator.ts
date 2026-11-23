import { eddFromLmp, gestation, trimester, MILESTONES, lmpFromEdd } from '../lib/pregnancy';
import { addDays, fmtDate, parseDate, daysBetween } from '../lib/math';
import type { Calculator, Values } from '../lib/types';

function lmpOf(v: Values) {
  if (v.method === 'edd') return lmpFromEdd(parseDate(v.edd));
  if (v.method === 'conception') return addDays(parseDate(v.conception), -14);
  return addDays(parseDate(v.lmp), -(+v.cycle - 28)); // shift so 280-day math works for long/short cycles
}

const calc: Calculator = {
  slug: 'pregnancy-calculator',
  name: 'Pregnancy Calculator',
  short: 'Pregnancy',
  category: 'health',
  keyword: 'pregnancy calculator',
  volume: 368000,
  variants: ['how far along am I', 'pregnancy week calculator', 'calculator for pregnant', 'weeks pregnant calculator'],
  title: 'Pregnancy Calculator – How Far Along Am I? Week by Week',
  description:
    'Find out how many weeks pregnant you are, your trimester, due date and upcoming milestones — from your last period, conception date or a known due date.',
  accent: 'week by week',
  icon: '♡',
  inputs: [
    {
      id: 'method',
      label: 'Calculate from',
      type: 'select',
      default: 'lmp',
      options: [
        { value: 'lmp', label: 'First day of last period' },
        { value: 'conception', label: 'Conception date' },
        { value: 'edd', label: 'Known due date' },
      ],
    },
    { id: 'lmp', label: 'First day of last period', type: 'date', default: 'today-70', showIf: { field: 'method', in: ['lmp'] } },
    { id: 'cycle', label: 'Average cycle length', type: 'number', default: 28, min: 20, max: 45, step: 1, suffix: 'days', showIf: { field: 'method', in: ['lmp'] } },
    { id: 'conception', label: 'Conception date', type: 'date', default: 'today-56', showIf: { field: 'method', in: ['conception'] } },
    { id: 'edd', label: 'Due date', type: 'date', default: 'today+210', showIf: { field: 'method', in: ['edd'] } },
    { id: 'on', label: 'Calculate for date', type: 'date', default: 'today' },
  ],
  compute(v) {
    const lmp = lmpOf(v);
    const on = parseDate(v.on);
    const g = gestation(lmp, on);
    if (g.days < 0) return { primary: { label: '', value: '' }, error: 'That date is before the pregnancy began.' };
    if (g.days > 44 * 7) return { primary: { label: '', value: '' }, error: 'That is more than 44 weeks — please check the dates.' };
    const edd = eddFromLmp(lmp);
    const next = MILESTONES.find(([w]) => w * 7 > g.days);
    return {
      primary: { label: 'You are', value: `${g.weeks} weeks ${g.rem} days` },
      rows: [
        { label: 'Trimester', value: trimester(g.weeks) },
        { label: 'Estimated due date', value: fmtDate(edd) },
        { label: 'Days to go', value: String(Math.max(0, daysBetween(on, edd))) },
        { label: 'Progress', value: Math.min(100, Math.round((g.days / 280) * 100)) + '%' },
        { label: 'Next milestone', value: next ? `${next[1]} — week ${next[0]} (${fmtDate(addDays(lmp, next[0] * 7))})` : 'Any day now' },
      ],
      chart: {
        type: 'stacked',
        title: 'Pregnancy progress by trimester (weeks)',
        x: ['1st (0–13)', '2nd (14–27)', '3rd (28–40)'],
        series: [
          { name: 'Weeks done', values: [Math.min(g.days / 7, 14), Math.min(Math.max(g.days / 7 - 14, 0), 14), Math.min(Math.max(g.days / 7 - 28, 0), 12)] },
          { name: 'Weeks to go', values: [Math.max(14 - g.days / 7, 0), Math.max(14 - Math.max(g.days / 7 - 14, 0), 0), Math.max(12 - Math.max(g.days / 7 - 28, 0), 0)] },
        ],
        y: 'num',
      },
      table: { head: ['Week', 'Milestone', 'Date'], rows: MILESTONES.map(([w, m]) => [w, m, fmtDate(addDays(lmp, w * 7))]) },
    };
  },
  answer: {
    text: () =>
      `If the first day of your last period was <strong>10 weeks ago</strong>, you are <strong>10 weeks 0 days pregnant</strong> — in the first trimester — and your estimated due date is 30 weeks from today. Pregnancy is counted from the last period, about two weeks before conception.`,
  },
  intro: [
    'A pregnancy calculator tells you how far along you are, in weeks and days, and what is coming next. Doctors count pregnancy from the first day of your last menstrual period (LMP), so at conception you are already “two weeks pregnant”.',
    'Enter your last period, your conception date or a due date from your provider. We adjust for cycles longer or shorter than 28 days and list the key appointments and milestones with their actual dates.',
  ],
  formula: {
    expr: 'Gestational age = date − LMP\nDue date = LMP + 280 days + (cycle length − 28)\nFrom conception: LMP ≈ conception − 14 days',
    vars: [
      ['LMP', 'first day of last menstrual period'],
      ['280 days', '40 weeks, the standard length of pregnancy from LMP'],
    ],
    notes: ['An early ultrasound gives the most accurate dating. If it differs from your LMP date, your provider may change your due date.'],
  },
  examples: [
    { title: 'Period 6 weeks ago', inputs: { lmp: 'today-42' }, explain: (r) => `${r.primary.value} — ${r.rows![0].value}.` },
    { title: '35-day cycles', inputs: { lmp: 'today-84', cycle: 35 }, explain: (r) => `Longer cycles shift dating by a week: ${r.primary.value}.` },
    { title: 'From a due date', inputs: { method: 'edd', edd: 'today+100' }, explain: (r) => `${r.primary.value}, ${r.rows![0].value.toLowerCase()}.` },
  ],
  analysis() {
    return [
      {
        title: 'How the 40 weeks are divided',
        insight: 'The first trimester runs to the end of week 13, the second from week 14 through 27, and the third from week 28 until birth. “Full term” is 39 weeks 0 days to 40 weeks 6 days under ACOG definitions.',
        chart: { type: 'bar', title: 'Length of each trimester (weeks)', x: ['1st trimester', '2nd trimester', '3rd trimester (to 40 wks)'], series: [{ name: 'Weeks', values: [13 + 6 / 7, 14, 12] }], y: 'num' },
        table: {
          head: ['Term category (ACOG)', 'Gestational age'],
          rows: [
            ['Early term', '37w0d – 38w6d'],
            ['Full term', '39w0d – 40w6d'],
            ['Late term', '41w0d – 41w6d'],
            ['Post-term', '42w0d and beyond'],
          ],
        },
      },
    ];
  },
  variantQs: [
    { q: 'How far along am I?', a: 'Count the days since the first day of your last period and divide by 7. The calculator does this, adjusts for your cycle length, and shows weeks plus days.' },
    { q: 'Is there a calculator for pregnant women to track weeks?', a: 'Yes — this page. Bookmark it with your dates in the URL; it recalculates every time you open it.' },
  ],
  tips: [
    'Write down the first day of each period — it is the key input for dating.',
    'Your provider’s ultrasound dating overrides calculator dates.',
    'Start a prenatal vitamin with folic acid as early as possible.',
  ],
  faqs: [
    { q: 'How are pregnancy weeks counted?', a: 'From the first day of your last menstrual period, not from conception. That is why you are considered about 2 weeks pregnant at conception.' },
    { q: 'When does each trimester start?', a: 'The second trimester begins at 14 weeks and the third at 28 weeks.' },
    { q: 'What if I don’t know my last period date?', a: 'Use the conception date if known, or ask your provider for a dating ultrasound, which is most accurate in the first trimester.' },
    { q: 'How many weeks is a full-term pregnancy?', a: '39 weeks 0 days to 40 weeks 6 days. Babies born from 37 weeks are “early term”.' },
  ],
  sources: [
    { label: 'ACOG Committee Opinion 700 – Methods for estimating the due date', url: 'https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/05/methods-for-estimating-the-due-date' },
    { label: 'ACOG – Definition of term pregnancy', url: 'https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2013/11/definition-of-term-pregnancy' },
  ],
  related: ['due-date-calculator', 'ovulation-calculator', 'date-calculator', 'calorie-calculator', 'age-calculator'],
  disclaimer: 'health',
};
export default calc;
