import { addDays, daysBetween, fmtDate, parseDate } from '../lib/math';
import { gestation, trimester } from '../lib/pregnancy';
import type { Calculator, Values } from '../lib/types';

/**
 * Conception is dated from ovulation, about 14 days before the next period would start.
 * For a regular cycle of length L, ovulation ≈ LMP + (L − 14). A 28-day cycle gives LMP + 14,
 * and conception ≈ due date − 266 days.
 */
export function conception(v: Values) {
  const cycle = +v.cycle || 28;
  let lmp: Date;
  let birthMode = false;
  switch (v.method) {
    case 'due':
      lmp = addDays(parseDate(v.due), -280);
      break;
    case 'birth':
      birthMode = true;
      lmp = addDays(parseDate(v.birth), -Math.round((+v.weeksAtBirth || 40) * 7));
      break;
    default:
      lmp = parseDate(v.lmp);
  }
  // Due-date and birth methods already assume a standard 28-day cycle.
  const ovulation = addDays(lmp, v.method === 'lmp' ? cycle - 14 : 14);
  const edd = addDays(ovulation, 266);
  return { lmp, ovulation, edd, fertileStart: addDays(ovulation, -5), fertileEnd: addDays(ovulation, 1), birthMode };
}

const calc: Calculator = {
  slug: 'pregnancy-conception-calculator',
  name: 'Pregnancy Conception Calculator',
  short: 'Conception Date',
  category: 'health',
  keyword: 'pregnancy conception calculator',
  volume: 90500,
  variants: ['conception date calculator', 'when did I conceive', 'conception calculator by due date', 'when was I conceived calculator', 'conception calculator from birth date'],
  title: 'Conception Calculator – When Did I Conceive? (Due Date or LMP)',
  description:
    'Estimate the date you conceived from your due date, last period or a baby’s birth date. See the fertile window when intercourse most likely led to pregnancy.',
  accent: 'counting back',
  icon: '◌',
  inputs: [
    {
      id: 'method',
      label: 'I know my',
      type: 'select',
      default: 'due',
      options: [
        { value: 'due', label: 'Due date' },
        { value: 'lmp', label: 'Last menstrual period (LMP)' },
        { value: 'birth', label: 'Baby’s birth date' },
      ],
    },
    { id: 'due', label: 'Estimated due date', type: 'date', default: 'today+180', showIf: { field: 'method', in: ['due'] } },
    { id: 'lmp', label: 'First day of last period', type: 'date', default: 'today-60', showIf: { field: 'method', in: ['lmp'] } },
    { id: 'cycle', label: 'Average cycle length', type: 'number', default: 28, min: 20, max: 45, step: 1, suffix: 'days', showIf: { field: 'method', in: ['lmp'] } },
    { id: 'birth', label: 'Birth date', type: 'date', default: '2025-06-15', showIf: { field: 'method', in: ['birth'] } },
    { id: 'weeksAtBirth', label: 'Born at (weeks of pregnancy)', type: 'number', default: 40, min: 22, max: 43, step: 0.5, suffix: 'weeks', help: 'Use 40 if you don’t know. Full term is 39–40 weeks.', showIf: { field: 'method', in: ['birth'] } },
  ],
  compute(v) {
    const c = conception(v);
    if (isNaN(c.ovulation.getTime())) return { primary: { label: '', value: '' }, error: 'Enter a valid date.' };
    const today = parseDate('today');
    const g = gestation(c.lmp, today);
    const rows = [
      { label: 'Fertile window (intercourse most likely led to pregnancy)', value: `${fmtDate(c.fertileStart)} – ${fmtDate(c.fertileEnd)}` },
      { label: 'Last period started (estimated)', value: fmtDate(c.lmp) },
      { label: c.birthMode ? 'Due date would have been' : 'Estimated due date', value: fmtDate(c.edd) },
    ];
    if (c.birthMode) {
      rows.push({ label: 'Possible conception range (±2 weeks)', value: `${fmtDate(addDays(c.ovulation, -14))} – ${fmtDate(addDays(c.ovulation, 14))}` });
    } else if (g.days >= 0 && g.days <= 300) {
      rows.push({ label: 'Pregnancy today', value: `${g.weeks} weeks ${g.rem} days (${trimester(g.weeks).toLowerCase()})` });
      rows.push({ label: 'Days since conception', value: String(Math.max(0, daysBetween(c.ovulation, today))) });
    }
    const timeline: (string | number)[][] = [
      ['Last period starts', 'Week 0', fmtDate(c.lmp)],
      ['Fertile window opens', `Day ${daysBetween(c.lmp, c.fertileStart)}`, fmtDate(c.fertileStart)],
      ['Ovulation & conception', `Day ${daysBetween(c.lmp, c.ovulation)} (week 2)`, fmtDate(c.ovulation)],
      ['Implantation', '6–10 days after conception', `${fmtDate(addDays(c.ovulation, 6))} – ${fmtDate(addDays(c.ovulation, 10))}`],
      ['Positive home test likely', 'From missed period', fmtDate(addDays(c.ovulation, 14))],
      ['Due date', 'Week 40', fmtDate(c.edd)],
    ];
    return {
      primary: { label: 'Most likely conception date', value: fmtDate(c.ovulation) },
      rows,
      table: { caption: 'Early-pregnancy timeline', head: ['Event', 'Timing', 'Date'], rows: timeline },
      note: 'Conception dates are estimates. Ovulation can vary by several days even in regular cycles, and sperm can survive up to 5 days. Only an early ultrasound can date a pregnancy precisely.',
      steps: [
        v.method === 'due' ? 'Conception ≈ due date − 266 days (38 weeks)' : v.method === 'birth' ? `Estimated LMP = birth date − ${+v.weeksAtBirth || 40} weeks; conception ≈ LMP + 14 days` : `Ovulation ≈ LMP + (cycle ${+v.cycle || 28} − 14) days`,
        `Most likely conception: ${fmtDate(c.ovulation)}`,
        'Fertile window = 5 days before ovulation to 1 day after',
      ],
    };
  },
  answer: {
    text: () => {
      const c = conception({ method: 'due', due: '2026-12-25' });
      return `If your due date is <strong>December 25, 2026</strong>, conception most likely happened around <strong>${fmtDate(c.ovulation)}</strong>, 266 days earlier. Intercourse that led to the pregnancy probably took place between ${fmtDate(c.fertileStart)} and ${fmtDate(c.fertileEnd)}, because sperm can survive up to five days before ovulation.`;
    },
  },
  intro: [
    'A pregnancy conception calculator works backwards from your due date, last period or a baby’s birth date to estimate when conception happened. Conception usually occurs within a day of ovulation, about two weeks after the start of the last period. That is 38 weeks, or 266 days, before the due date.',
    'Because sperm can live up to five days, the intercourse that led to a pregnancy can be up to five days before ovulation. This calculator shows the most likely conception date, the full fertile window around it, and a timeline from implantation to the first positive test. If you enter a birth date, it also shows a wider ±2-week range, because babies are rarely born exactly on their due date.',
  ],
  formula: {
    expr: 'From due date:  conception ≈ EDD − 266 days\nFrom LMP:       conception ≈ LMP + (cycle length − 14) days\nFrom birth:     LMP ≈ birth − weeks at birth; conception ≈ LMP + 14\nFertile window = ovulation − 5 days … ovulation + 1 day',
    vars: [
      ['EDD', 'estimated due date (40 weeks after LMP)'],
      ['14 days', 'average luteal phase, the time from ovulation to the next period'],
    ],
  },
  examples: [
    { title: 'Due on September 1, 2026', inputs: { method: 'due', due: '2026-09-01' }, explain: (r) => `Conceived around ${r.primary.value}.` },
    { title: 'LMP March 2, 2026, 32-day cycle', inputs: { method: 'lmp', lmp: '2026-03-02', cycle: 32 }, explain: (r) => `Ovulation and conception around ${r.primary.value}, four days later than with a 28-day cycle.` },
    { title: 'Born May 10, 2026 at 39 weeks', inputs: { method: 'birth', birth: '2026-05-10', weeksAtBirth: 39 }, explain: (r) => `Most likely ${r.primary.value}; range ${r.rows![3].value}.` },
  ],
  analysis() {
    const days = [-6, -5, -4, -3, -2, -1, 0, 1];
    // Wilcox et al. (1995) NEJM: probability of conception by day of intercourse relative to ovulation.
    const prob = [0, 10, 16, 14, 27, 31, 33, 0];
    return [
      {
        title: 'Which days actually lead to pregnancy?',
        insight: 'In a landmark study of 221 women trying to conceive, every pregnancy came from intercourse in a six-day window ending on the day of ovulation. The two days before ovulation and ovulation day itself had the highest chance, around 30%. This is why “conception date” is really a short window, not a single day.',
        chart: { type: 'bar', title: 'Chance of conception by day of intercourse (%)', x: days.map((d) => (d === 0 ? 'Ovulation' : d < 0 ? `${d} days` : `+${d} day`)), series: [{ name: 'Chance', values: prob }], y: 'int' },
      },
      {
        title: 'Cycle length shifts the conception date',
        insight: 'The luteal phase (after ovulation) is fairly constant at about 14 days, so longer cycles mean later ovulation. With a 35-day cycle, conception is about a week later than the standard “LMP + 14” rule.',
        table: { head: ['Cycle length', 'Ovulation / conception', 'Days later than 28-day cycle'], rows: [24, 26, 28, 30, 32, 35].map((L) => [`${L} days`, `Day ${L - 14}`, String(L - 28)]) },
      },
    ];
  },
  variantQs: [
    { q: 'When did I conceive based on my due date?', a: 'Subtract 266 days (38 weeks) from your due date. A due date of June 30 points to conception around October 7 of the previous year.' },
    { q: 'When was I conceived?', a: 'Choose “Baby’s birth date”, enter your birthday and, if you know it, how many weeks into the pregnancy you were born. The result is an estimate with a range of about two weeks either side.' },
    { q: 'Can a conception calculator prove paternity?', a: 'No. Ovulation timing varies, sperm survive several days and due dates are estimates, so dates cannot reliably separate two possible fathers a few days apart. Only a DNA test can establish paternity.' },
  ],
  tips: [
    'An ultrasound between 8 and 13 weeks dates a pregnancy to within about 5–7 days, which is more accurate than counting from your period.',
    'If your cycles are irregular, the LMP method can be off by a week or more.',
    'IVF pregnancies have exact conception dates: use our due date calculator’s IVF option.',
  ],
  faqs: [
    { q: 'How accurate is a conception date calculator?', a: 'It is usually accurate to within a few days for regular cycles. Ovulation can still vary from cycle to cycle, and from a birth date the error is larger, about ±2 weeks.' },
    { q: 'Is conception the same as the day we had sex?', a: 'Not necessarily. Sperm can survive up to five days, so conception can happen several days after intercourse, when the egg is released.' },
    { q: 'How many weeks pregnant am I at conception?', a: 'About two weeks. Doctors count pregnancy from the first day of the last period, so conception is at roughly “2 weeks 0 days”.' },
    { q: 'When does implantation happen?', a: 'Usually 6 to 10 days after ovulation. A home pregnancy test usually turns positive a few days after implantation, around the time of the missed period.' },
  ],
  sources: [
    { label: 'Wilcox AJ, Weinberg CR, Baird DD (1995). Timing of sexual intercourse in relation to ovulation. NEJM 333:1517–21', url: 'https://www.nejm.org/doi/full/10.1056/NEJM199512073332301' },
    { label: 'ACOG Committee Opinion 700 – Methods for estimating the due date', url: 'https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/05/methods-for-estimating-the-due-date' },
  ],
  related: ['due-date-calculator', 'pregnancy-calculator', 'ovulation-calculator', 'date-calculator', 'age-calculator'],
  disclaimer: 'health',
};
export default calc;
