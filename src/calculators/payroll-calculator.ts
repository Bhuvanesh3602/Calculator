import { SS_RATE, SS_WAGE_BASE, MEDICARE_RATE, FUTA_RATE_NET, FUTA_WAGE_BASE, TAX_YEAR } from '../lib/data/tax2026';
import { usd, usd2, pct } from '../lib/format';
import type { Calculator, Values } from '../lib/types';

export function employerCost(v: Values) {
  const wage = +v.salary || 0;
  const ss = Math.min(wage, SS_WAGE_BASE) * SS_RATE;
  const med = wage * MEDICARE_RATE; // employer share has no additional 0.9%
  const futa = Math.min(wage, FUTA_WAGE_BASE) * FUTA_RATE_NET;
  const suta = (Math.min(wage, +v.sutaBase || 0) * (+v.sutaRate || 0)) / 100;
  const wc = (wage / 100) * (+v.wc || 0);
  const benefits = (+v.benefits || 0) * 12;
  const match = (wage * Math.min(+v.match || 0, 100)) / 100;
  const total = wage + ss + med + futa + suta + wc + benefits + match;
  return { wage, ss, med, futa, suta, wc, benefits, match, total };
}

const calc: Calculator = {
  slug: 'payroll-calculator',
  name: 'Payroll Calculator',
  short: 'Payroll',
  category: 'payroll',
  keyword: 'payroll calculator',
  volume: 673000,
  variants: ['employer payroll tax calculator', 'cost of an employee calculator', 'payroll tax calculator', 'employee cost calculator'],
  title: `Payroll Calculator (${TAX_YEAR}) – True Cost of an Employee`,
  description: `Calculate what an employee really costs: ${TAX_YEAR} employer Social Security and Medicare, FUTA, state unemployment, workers’ comp, benefits and 401(k) match.`,
  accent: 'the employer side',
  icon: '⚙',
  inputs: [
    { id: 'salary', label: 'Annual wages', type: 'number', default: 60000, min: 0, step: 1000, prefix: '$' },
    { id: 'sutaRate', label: 'State unemployment (SUTA) rate', type: 'number', default: 2.7, min: 0, max: 15, step: 0.1, suffix: '%', help: 'New-employer rates are often 1–4%. Check your state notice.' },
    { id: 'sutaBase', label: 'SUTA wage base', type: 'number', default: 15000, min: 0, step: 500, prefix: '$' },
    { id: 'wc', label: 'Workers’ comp rate', type: 'number', default: 0.5, min: 0, max: 30, step: 0.05, suffix: 'per $100' },
    { id: 'benefits', label: 'Employer health/benefits cost', type: 'number', default: 650, min: 0, step: 25, prefix: '$', suffix: '/month' },
    { id: 'match', label: '401(k) match', type: 'number', default: 4, min: 0, max: 25, step: 0.5, suffix: '% of pay' },
    {
      id: 'freq',
      label: 'Pay frequency',
      type: 'select',
      default: '26',
      options: [
        { value: '52', label: 'Weekly' },
        { value: '26', label: 'Biweekly' },
        { value: '24', label: 'Semimonthly' },
        { value: '12', label: 'Monthly' },
      ],
    },
  ],
  compute(v) {
    const c = employerCost(v);
    if (!(c.wage > 0)) return { primary: { label: '', value: '' }, error: 'Enter annual wages.' };
    const n = +v.freq;
    return {
      primary: { label: 'Total annual cost to employer', value: usd(c.total) },
      rows: [
        { label: 'Cost multiplier', value: (c.total / c.wage).toFixed(2) + '× wages' },
        { label: 'Cost per pay period', value: usd2(c.total / n) },
        { label: 'Employer Social Security', value: usd(c.ss) },
        { label: 'Employer Medicare', value: usd(c.med) },
        { label: 'FUTA (net 0.6%)', value: usd(c.futa) },
        { label: 'State unemployment', value: usd(c.suta) },
        { label: 'Workers’ comp', value: usd(c.wc) },
        { label: 'Benefits', value: usd(c.benefits) },
        { label: '401(k) match', value: usd(c.match) },
      ],
      chart: {
        type: 'donut',
        title: 'Employer cost breakdown',
        x: ['Wages', 'Payroll taxes', 'Benefits', '401(k) match & comp'],
        series: [{ name: 'Annual', values: [c.wage, c.ss + c.med + c.futa + c.suta, c.benefits, c.match + c.wc] }],
        y: 'usd',
      },
    };
  },
  answer: {
    text: (r) =>
      `A <strong>$60,000</strong> employee costs about <strong>${r.primary.value}</strong> a year once you add ${TAX_YEAR} employer FICA (7.65%), FUTA, state unemployment, workers’ comp, $650/month in benefits and a 4% 401(k) match. That is a multiplier of <strong>${r.rows![0].value}</strong>.`,
  },
  intro: [
    'A payroll calculator for employers shows the full cost of a hire, not just the salary on the offer letter. Employers pay their own half of Social Security and Medicare, federal and state unemployment taxes, workers’ compensation insurance, and usually benefits and retirement contributions.',
    'Use it to budget a new role, price a contract, or compare a salaried hire with a contractor. For the employee side — what lands in their bank account — use our paycheck calculator.',
  ],
  formula: {
    expr: 'Employer FICA = 6.2% × min(wages, SS base) + 1.45% × wages\nFUTA = 0.6% × min(wages, $7,000)\nSUTA = state rate × min(wages, state base)\nTotal = wages + FICA + FUTA + SUTA + comp + benefits + match',
    vars: [
      ['SS base', `${usd(SS_WAGE_BASE)} in ${TAX_YEAR}`],
      ['FUTA', '6.0% less up to 5.4% credit for paying state unemployment on time'],
      ['comp', 'workers’ comp rate per $100 of payroll × wages ÷ 100'],
    ],
    notes: ['FUTA credit reductions apply in some “credit reduction” states; check the Department of Labor list each November.'],
  },
  examples: [
    { title: 'Entry-level $40k hire', inputs: { salary: 40000, benefits: 500, match: 3 }, explain: (r) => `Benefits weigh more at lower wages: multiplier ${r.rows![0].value}.` },
    { title: '$120k engineer', inputs: { salary: 120000, benefits: 900, match: 5, wc: 0.2 }, explain: (r) => `Total cost: ${r.primary.value}, or ${r.rows![1].value} per pay period.` },
    { title: 'Part-time, no benefits', inputs: { salary: 20000, benefits: 0, match: 0 }, explain: (r) => `Without benefits, mainly payroll taxes remain: ${r.rows![0].value}.` },
  ],
  analysis() {
    const wages = [30000, 50000, 75000, 100000, 150000, 200000, 250000];
    const base = { sutaRate: 2.7, sutaBase: 15000, wc: 0.5, benefits: 650, match: 4 };
    const mult = wages.map((w) => employerCost({ ...base, salary: w }).total / w);
    const taxOnly = wages.map((w) => {
      const c = employerCost({ salary: w, sutaRate: 2.7, sutaBase: 15000, wc: 0, benefits: 0, match: 0 });
      return ((c.total - w) / w) * 100;
    });
    return [
      {
        title: 'The cost multiplier falls as wages rise',
        insight: `With fixed benefits of $650/month, a $30,000 employee costs <strong>${mult[0].toFixed(2)}×</strong> wages, while a $150,000 employee costs ${mult[4].toFixed(2)}×. Flat-dollar benefits and capped taxes (FUTA, SUTA, Social Security) weigh less as pay rises.`,
        chart: { type: 'line', title: 'Total cost ÷ wages, by salary', x: wages.map((w) => '$' + w / 1000 + 'k'), series: [{ name: 'Cost multiplier', values: mult }], y: 'num2', xTitle: 'Annual wages' },
      },
      {
        title: 'Employer payroll tax rate by salary',
        insight: `Payroll taxes alone add ${pct(taxOnly[0], 1)} at $30,000 and <strong>${pct(taxOnly[6], 1)}</strong> at $250,000 — above the ${usd(SS_WAGE_BASE)} wage base, only Medicare’s 1.45% continues.`,
        chart: { type: 'bar', title: 'Employer payroll taxes as % of wages', x: wages.map((w) => '$' + w / 1000 + 'k'), series: [{ name: 'Payroll tax rate', values: taxOnly }], y: 'pct', xTitle: 'Annual wages' },
      },
    ];
  },
  variantQs: [
    { q: 'Is a payroll tax calculator the same as a paycheck calculator?', a: 'Not quite. A paycheck calculator shows the employee’s withholding and net pay; an employer payroll calculator shows the taxes and costs the business pays on top of wages.' },
    { q: 'How do I calculate the cost of an employee?', a: 'Add wages, the employer’s 7.65% FICA, FUTA and SUTA, workers’ comp and benefits. As a rule of thumb, total cost is often 1.2–1.4× salary for full-time roles with benefits.' },
  ],
  tips: [
    'Ask your state for your exact SUTA rate — it changes yearly based on your claims history.',
    'Workers’ comp rates vary hugely by job class (office work vs construction).',
    'Budget for payroll software, recruiting and equipment separately; they are real costs too.',
    'Deposit payroll taxes on schedule; IRS penalties for late deposits start at 2%.',
  ],
  faqs: [
    { q: 'What payroll taxes does an employer pay?', a: `Employer Social Security (6.2% up to ${usd(SS_WAGE_BASE)}), Medicare (1.45%), federal unemployment (FUTA, typically 0.6% on the first $7,000) and state unemployment (SUTA). Some states add disability or training taxes.` },
    { q: 'How much does a $60,000 employee cost?', a: `With typical benefits and a 4% match, about ${usd(employerCost({ salary: 60000, sutaRate: 2.7, sutaBase: 15000, wc: 0.5, benefits: 650, match: 4 }).total)} a year. Without benefits, closer to ${usd(employerCost({ salary: 60000, sutaRate: 2.7, sutaBase: 15000, wc: 0.5, benefits: 0, match: 0 }).total)}.` },
    { q: 'Does the employer pay the additional 0.9% Medicare tax?', a: 'No. The additional Medicare tax is employee-only, withheld on wages above $200,000. The employer’s Medicare share stays at 1.45%.' },
    { q: 'Do I pay payroll taxes on contractors?', a: 'No. Independent contractors pay self-employment tax themselves. Misclassifying employees as contractors can lead to back taxes and penalties.' },
  ],
  sources: [
    { label: 'IRS Publication 15 (Circular E), Employer’s Tax Guide', url: 'https://www.irs.gov/publications/p15' },
    { label: 'IRS – FUTA tax (Form 940)', url: 'https://www.irs.gov/forms-pubs/about-form-940' },
    { label: 'U.S. DOL – FUTA credit reductions', url: 'https://oui.doleta.gov/unemploy/futa_credit.asp' },
  ],
  related: ['paycheck-calculator', 'time-card-calculator', 'hours-calculator', 'percentage-calculator'],
  disclaimer: 'tax',
};
export default calc;
