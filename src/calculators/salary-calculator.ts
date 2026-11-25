import { STATES, TAX_YEAR } from '../lib/data/tax2026';
import { usd, usd2, pct } from '../lib/format';
import type { Calculator, Values } from '../lib/types';
import { paycheck } from './paycheck-calculator';

/** Pay periods per year for fixed-period pay (hourly and daily depend on the schedule). */
export const PER_YEAR: Record<string, number> = { week: 52, biweek: 26, semimonth: 24, month: 12, quarter: 4, year: 1 };

/** Convert pay at any frequency to an annual amount. If time off is unpaid, holidays and vacation days are removed. */
export function annualize(amount: number, per: string, hoursPerWeek: number, daysPerWeek: number, daysOff: number, offPaid: boolean) {
  const workDays = 52 * daysPerWeek;
  const hoursPerDay = hoursPerWeek / daysPerWeek;
  const paidDays = offPaid ? workDays : Math.max(0, workDays - daysOff);
  if (per === 'hour') return amount * hoursPerDay * paidDays;
  if (per === 'day') return amount * paidDays;
  const full = amount * (PER_YEAR[per] ?? 1);
  return offPaid ? full : full * (paidDays / workDays);
}

const calc: Calculator = {
  slug: 'salary-calculator',
  name: 'Salary Calculator',
  short: 'Salary',
  category: 'payroll',
  keyword: 'salary calculator',
  volume: 201000,
  variants: ['hourly to salary calculator', 'salary to hourly calculator', 'annual salary calculator', 'how much is $20 an hour annually', 'wage calculator'],
  title: 'Salary Calculator – Hourly to Annual, Monthly & After Tax',
  description:
    'Convert pay between hourly, daily, weekly, bi-weekly, monthly and annual. Adjust for holidays, vacation and unpaid time off, and see take-home pay after tax.',
  accent: 'hourly ⇄ yearly',
  icon: '⇄',
  inputs: [
    { id: 'amount', label: 'Pay amount', type: 'number', default: 32, min: 0, step: 0.5, prefix: '$' },
    {
      id: 'per',
      label: 'Per',
      type: 'select',
      default: 'hour',
      options: [
        { value: 'hour', label: 'Hour' },
        { value: 'day', label: 'Day' },
        { value: 'week', label: 'Week' },
        { value: 'biweek', label: 'Two weeks (bi-weekly)' },
        { value: 'semimonth', label: 'Half month (semi-monthly)' },
        { value: 'month', label: 'Month' },
        { value: 'quarter', label: 'Quarter' },
        { value: 'year', label: 'Year' },
      ],
    },
    { id: 'hours', label: 'Hours per week', type: 'number', default: 40, min: 1, max: 100, step: 0.5, suffix: 'hours' },
    { id: 'days', label: 'Days per week', type: 'number', default: 5, min: 1, max: 7, step: 0.5, suffix: 'days' },
    { id: 'holidays', label: 'Holidays per year', type: 'number', default: 11, min: 0, max: 40, step: 1, suffix: 'days' },
    { id: 'vacation', label: 'Vacation days per year', type: 'number', default: 10, min: 0, max: 60, step: 1, suffix: 'days' },
    {
      id: 'paidOff',
      label: 'Holidays and vacation are',
      type: 'select',
      default: 'paid',
      options: [
        { value: 'paid', label: 'Paid (typical salaried job)' },
        { value: 'unpaid', label: 'Unpaid (contractor / hourly with no PTO)' },
      ],
    },
    {
      id: 'filing',
      label: 'Filing status (for take-home estimate)',
      type: 'select',
      default: 'single',
      options: [
        { value: 'single', label: 'Single' },
        { value: 'married', label: 'Married filing jointly' },
        { value: 'hoh', label: 'Head of household' },
      ],
    },
    { id: 'state', label: 'State', type: 'select', default: 'none', options: STATES.map((s) => ({ value: s.value, label: s.label })) },
    { id: 'stateRate', label: 'State effective tax rate', type: 'number', default: 4, min: 0, max: 15, step: 0.1, suffix: '%', showIf: { field: 'state', in: ['custom'] } },
  ],
  compute(v: Values) {
    const amt = +v.amount,
      hpw = +v.hours,
      dpw = +v.days;
    if (!(amt > 0)) return { primary: { label: '', value: '' }, error: 'Enter your pay.' };
    if (!(hpw > 0 && dpw > 0)) return { primary: { label: '', value: '' }, error: 'Enter hours and days per week.' };
    const off = (+v.holidays || 0) + (+v.vacation || 0);
    const paid = v.paidOff !== 'unpaid';
    const annual = annualize(amt, v.per, hpw, dpw, off, paid);
    const workDays = 52 * dpw;
    const workedDays = Math.max(1, workDays - off);
    const hpd = hpw / dpw;
    const p = paycheck({ payType: 'salary', salary: annual, freq: 'biweekly', filing: v.filing, state: v.state, stateRate: v.stateRate, k401: 0, health: 0 });
    const keep = annual > 0 ? p.net / annual : 0;
    const periods: [string, number][] = [
      ['Hourly', annual / (52 * hpw)],
      ['Daily', annual / workDays],
      ['Weekly', annual / 52],
      ['Bi-weekly', annual / 26],
      ['Semi-monthly', annual / 24],
      ['Monthly', annual / 12],
      ['Quarterly', annual / 4],
      ['Annual', annual],
    ];
    const perWorkedHour = annual / (workedDays * hpd);
    return {
      primary: { label: 'Annual salary (gross)', value: usd(annual) },
      rows: [
        { label: 'Monthly', value: usd2(annual / 12) },
        { label: 'Bi-weekly paycheck', value: usd2(annual / 26) },
        { label: 'Hourly (all paid hours)', value: usd2(annual / (52 * hpw)) },
        { label: 'Per hour actually worked', value: usd2(perWorkedHour) },
        { label: `Take-home after ${TAX_YEAR} taxes (est.)`, value: `${usd(p.net)} a year · ${usd(p.net / 12)} a month` },
        { label: 'Share of pay you keep', value: pct(keep * 100, 1) },
      ],
      table: { head: ['Period', 'Gross pay', 'After tax (est.)'], rows: periods.map(([l, g]) => [l, usd2(g), usd2(g * keep)]) },
      chart: {
        type: 'donut',
        title: 'Where the annual salary goes',
        x: ['Take-home', 'Federal income tax', 'Social Security & Medicare', 'State tax'],
        series: [{ name: 'Amount', values: [p.net, p.fed, p.ss + p.med, p.state] }],
        y: 'usd',
      },
      steps: [
        `${usd2(amt)} per ${v.per === 'semimonth' ? 'half month' : v.per === 'biweek' ? 'two weeks' : v.per} → ${usd(annual)} a year${paid ? '' : ` (only ${workedDays} paid days after ${off} days off)`}`,
        `Paid hours a year = 52 × ${hpw} = ${52 * hpw}`,
        `Days actually worked = ${workDays} − ${off} = ${workedDays}, so ${workedDays * hpd} hours worked`,
      ],
    };
  },
  answer: {
    text: (r) =>
      `<strong>$32 an hour</strong> at 40 hours a week is <strong>${r.primary.value}</strong> a year: $32 × 40 hours × 52 weeks. That is ${r.rows![0].value} a month or ${r.rows![1].value} every two weeks before tax. After federal tax and FICA, a single filer in a no-income-tax state takes home about ${r.rows![4].value.split(' a year')[0]} a year.`,
  },
  intro: [
    'A salary calculator converts pay from one period to another, such as hourly to annual, annual to monthly, or weekly to hourly. The standard assumption is 40 hours a week and 52 weeks a year, which gives 2,080 paid hours.',
    'This calculator also handles two things most salary converters skip. If you are a contractor or an hourly worker without paid time off, it removes unpaid holidays and vacation from the annual figure. It also estimates take-home pay after federal, FICA and state taxes, so you can compare job offers on what you will actually keep.',
  ],
  formula: {
    expr: 'Annual = hourly × hours/week × 52\nMonthly = annual ÷ 12   Bi-weekly = annual ÷ 26\nUnpaid time off: annual = hourly × hours/day × (work days − days off)\nPer hour worked = annual ÷ hours actually worked',
    vars: [
      ['2,080', 'paid hours in a 40-hour, 52-week year'],
      ['260', 'weekdays in a year (52 × 5)'],
    ],
    notes: ['Take-home pay uses the same 2026 federal brackets, standard deduction and FICA rates as our paycheck calculator, with no pre-tax deductions.'],
  },
  examples: [
    { title: '$20 an hour, full time', inputs: { amount: 20, per: 'hour' }, explain: (r) => `${r.primary.value} a year, ${r.rows![0].value} a month.` },
    { title: '$75,000 salary to hourly', inputs: { amount: 75000, per: 'year' }, explain: (r) => `${r.rows![2].value} an hour, or ${r.rows![3].value} per hour actually worked once 21 days off are counted.` },
    { title: 'Contractor at $60/h with 4 weeks unpaid', inputs: { amount: 60, per: 'hour', holidays: 10, vacation: 10, paidOff: 'unpaid' }, explain: (r) => `${r.primary.value} a year, not $124,800, because 20 days are unpaid.` },
  ],
  analysis() {
    const rates = [15, 18, 20, 25, 30, 40, 50, 75, 100];
    return [
      {
        title: 'Hourly to annual at a glance',
        insight: 'A quick rule: double the hourly rate and add three zeros to estimate the annual salary for a 40-hour week. $25 an hour is about $50,000 (exactly $52,000). The table shows exact figures and an estimated take-home for a single filer in a state with no income tax.',
        table: {
          head: ['Hourly', 'Annual (2,080 h)', 'Monthly', 'Take-home a year (est.)'],
          rows: rates.map((h) => {
            const a = h * 2080;
            return [usd(h), usd(a), usd(a / 12), usd(paycheck({ payType: 'salary', salary: a, freq: 'biweekly', filing: 'single', state: 'none', k401: 0, health: 0 }).net)];
          }),
        },
      },
      {
        title: 'Why a contractor needs a higher rate than an employee',
        insight: 'A $100,000 employee earns that while also getting about 21 paid days off. A contractor who takes the same days off unpaid must charge more per hour just to match the salary, and more still to cover the employer’s half of FICA (7.65%) and benefits.',
        chart: {
          type: 'bar',
          title: 'Hourly rate a contractor needs to match a $100k salary',
          x: ['0 days off', '10 days', '21 days', '30 days'],
          series: [{ name: 'Hourly rate', values: [0, 10, 21, 30].map((d) => 100000 / ((260 - d) * 8)) }],
          y: 'usd2',
        },
      },
    ];
  },
  variantQs: [
    { q: 'How much is $20 an hour annually?', a: '$20 an hour at 40 hours a week is $41,600 a year: 20 × 40 × 52. That is $3,467 a month or $1,600 every two weeks before tax.' },
    { q: 'How do I convert salary to hourly?', a: 'Divide the annual salary by 2,080 for a 40-hour week. $60,000 a year is $28.85 an hour.' },
    { q: 'How much is $50,000 a year per month?', a: '$50,000 ÷ 12 = $4,166.67 a month before tax. Paid bi-weekly, each check is $1,923.08.' },
  ],
  tips: [
    'Bi-weekly pay means 26 paychecks a year, so two months each year have three paychecks. Semi-monthly pay is always 24.',
    'When comparing offers, include the employer 401(k) match and health premiums, not just the salary.',
    'Freelancers often aim for 1.5–2× the employee hourly rate to cover unpaid time, self-employment tax and benefits.',
  ],
  faqs: [
    { q: 'How many work hours are in a year?', a: '2,080 for a 40-hour week (40 × 52). Subtract holidays and vacation to get the hours you actually work, typically 1,900–1,950.' },
    { q: 'What is the difference between bi-weekly and semi-monthly pay?', a: 'Bi-weekly is every two weeks, 26 paychecks a year. Semi-monthly is twice a month, usually on the 15th and the last day, 24 paychecks a year. Each semi-monthly check is a little larger.' },
    { q: 'Is salary quoted before or after tax?', a: 'In the US, salaries and hourly rates are quoted gross, before taxes and deductions. The take-home row shows an estimate after federal tax, FICA and the state tax you choose.' },
    { q: 'What does “adjusted for holidays and vacation” mean?', a: 'If time off is unpaid, you earn nothing on those days, so the annual total falls. If time off is paid, the annual figure is unchanged, but you earn more per hour actually worked.' },
  ],
  sources: [
    { label: 'US Bureau of Labor Statistics – Employee benefits: paid holidays and vacations', url: 'https://www.bls.gov/ebs/' },
    { label: 'US Department of Labor – Fair Labor Standards Act (overtime and hours)', url: 'https://www.dol.gov/agencies/whd/flsa' },
  ],
  related: ['paycheck-calculator', 'income-tax-calculator', 'hours-calculator', 'time-card-calculator', 'payroll-calculator'],
  disclaimer: 'tax',
};
export default calc;
