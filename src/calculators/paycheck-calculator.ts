import {
  federalTax,
  marginalRate,
  STANDARD_DEDUCTION,
  SS_RATE,
  SS_WAGE_BASE,
  MEDICARE_RATE,
  ADDL_MEDICARE_RATE,
  ADDL_MEDICARE_THRESHOLD,
  STATES,
  TAX_YEAR,
  LIMIT_401K,
  type Filing,
} from '../lib/data/tax2026';
import { usd, usd2, pct } from '../lib/format';
import type { Calculator, Values } from '../lib/types';

const PERIODS: Record<string, number> = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 };

export function paycheck(v: Values) {
  const gross = v.payType === 'hourly' ? (+v.hourly || 0) * (+v.hours || 0) * 52 : +v.salary || 0;
  const filing = (v.filing || 'single') as Filing;
  const k401 = Math.min(LIMIT_401K, (gross * (+v.k401 || 0)) / 100);
  const periods = PERIODS[v.freq] ?? 26;
  const health = (+v.health || 0) * periods; // section 125: pre-tax for income tax and FICA
  const ficaWages = Math.max(0, gross - health);
  const taxable = Math.max(0, gross - k401 - health - STANDARD_DEDUCTION[filing]);
  const fed = federalTax(taxable, filing);
  const ss = Math.min(ficaWages, SS_WAGE_BASE) * SS_RATE;
  const med = ficaWages * MEDICARE_RATE + Math.max(0, ficaWages - ADDL_MEDICARE_THRESHOLD[filing]) * ADDL_MEDICARE_RATE;
  const st = STATES.find((s) => s.value === v.state);
  const stateRate = st?.rate ?? (+v.stateRate || 0);
  const state = (Math.max(0, gross - k401 - health) * stateRate) / 100;
  const net = gross - k401 - health - fed - ss - med - state;
  return { gross, k401, health, fed, ss, med, state, net, periods, taxable, filing };
}

const calc: Calculator = {
  slug: 'paycheck-calculator',
  name: 'Paycheck Calculator',
  short: 'Paycheck',
  category: 'payroll',
  keyword: 'paycheck calculator',
  volume: 550000,
  variants: ['take home pay calculator', 'salary after tax calculator', 'hourly paycheck calculator', 'net pay calculator'],
  title: `Paycheck Calculator (${TAX_YEAR}) – Take-Home Pay After Taxes`,
  description: `Estimate your ${TAX_YEAR} take-home pay per paycheck after federal tax, Social Security, Medicare, state tax, 401(k) and health premiums. Salary or hourly.`,
  accent: 'what actually lands',
  icon: '¢',
  inputs: [
    {
      id: 'payType',
      label: 'Pay type',
      type: 'select',
      default: 'salary',
      options: [
        { value: 'salary', label: 'Annual salary' },
        { value: 'hourly', label: 'Hourly wage' },
      ],
    },
    { id: 'salary', label: 'Annual salary', type: 'number', default: 65000, min: 0, step: 1000, prefix: '$', showIf: { field: 'payType', in: ['salary'] } },
    { id: 'hourly', label: 'Hourly rate', type: 'number', default: 25, min: 0, step: 0.25, prefix: '$', showIf: { field: 'payType', in: ['hourly'] } },
    { id: 'hours', label: 'Hours per week', type: 'number', default: 40, min: 0, max: 100, step: 1, showIf: { field: 'payType', in: ['hourly'] } },
    {
      id: 'freq',
      label: 'Pay frequency',
      type: 'select',
      default: 'biweekly',
      options: [
        { value: 'weekly', label: 'Weekly (52)' },
        { value: 'biweekly', label: 'Every two weeks (26)' },
        { value: 'semimonthly', label: 'Twice a month (24)' },
        { value: 'monthly', label: 'Monthly (12)' },
      ],
    },
    {
      id: 'filing',
      label: 'Filing status',
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
    { id: 'k401', label: '401(k) contribution', type: 'number', default: 5, min: 0, max: 100, step: 1, suffix: '% of pay' },
    { id: 'health', label: 'Pre-tax health premium', type: 'number', default: 75, min: 0, step: 5, prefix: '$', suffix: '/check' },
  ],
  compute(v) {
    const p = paycheck(v);
    if (!(p.gross > 0)) return { primary: { label: '', value: '' }, error: 'Enter your pay.' };
    const per = (x: number) => usd2(x / p.periods);
    return {
      primary: { label: 'Take-home pay per paycheck', value: per(p.net) },
      rows: [
        { label: 'Gross pay per check', value: per(p.gross) },
        { label: 'Federal income tax', value: per(p.fed) },
        { label: 'Social Security (6.2%)', value: per(p.ss) },
        { label: 'Medicare (1.45%)', value: per(p.med) },
        { label: 'State income tax', value: per(p.state) },
        { label: '401(k)', value: per(p.k401) },
        { label: 'Health premium', value: per(p.health) },
        { label: 'Annual take-home', value: usd(p.net) },
        { label: 'Effective total tax rate', value: pct(((p.fed + p.ss + p.med + p.state) / p.gross) * 100, 1) },
        { label: 'Federal marginal bracket', value: pct(marginalRate(p.taxable, p.filing) * 100, 0) },
      ],
      chart: {
        type: 'donut',
        title: 'Where each paycheck goes',
        x: ['Take-home', 'Federal tax', 'FICA', 'State tax', '401(k) & health'],
        series: [{ name: 'Per paycheck', values: [p.net, p.fed, p.ss + p.med, p.state, p.k401 + p.health].map((x) => x / p.periods) }],
        y: 'usd2',
      },
    };
  },
  answer: {
    text: (r) =>
      `On a <strong>$65,000</strong> salary paid every two weeks, a single filer in a no-income-tax state with 5% to a 401(k) and a $75 health premium takes home about <strong>${r.primary.value} per paycheck</strong> (${r.rows![7].value} a year) under ${TAX_YEAR} federal rules. Taxes take ${r.rows![8].value} of gross pay.`,
  },
  intro: [
    'A paycheck calculator estimates your net pay: what is left of your gross wages after federal income tax withholding, Social Security, Medicare, state income tax and pre-tax deductions such as 401(k) contributions and health insurance premiums.',
    `This one uses the ${TAX_YEAR} federal brackets and standard deductions, the ${TAX_YEAR} Social Security wage base of ${usd(SS_WAGE_BASE)}, and the additional 0.9% Medicare tax on high earners. It models withholding as your annual tax liability spread evenly over the year, which is how the current W-4 system is designed to work.`,
  ],
  formula: {
    expr: 'Taxable = Gross − 401(k) − Health − Standard deduction\nFederal tax = Σ (income in bracket × bracket rate)\nFICA = 6.2% × min(Gross − Health, wage base) + 1.45% × (Gross − Health)\nNet = Gross − 401(k) − Health − Federal − FICA − State',
    vars: [
      ['Gross', 'annual wages (hourly × hours × 52 for hourly workers)'],
      ['401(k)', 'traditional pre-tax contribution; reduces income tax, not FICA'],
      ['Health', 'Section 125 premium; reduces income tax and FICA'],
    ],
    notes: [
      'State tax is simplified: we apply flat-rate states’ rates to wages after pre-tax deductions; for graduated-rate states enter your effective rate. Local taxes, credits (such as the Child Tax Credit), supplemental-wage withholding on bonuses and W-4 adjustments are not modelled.',
    ],
  },
  examples: [
    { title: '$25/hour, weekly', inputs: { payType: 'hourly', hourly: 25, hours: 40, freq: 'weekly', k401: 0, health: 30 }, explain: (r) => `A $1,000 gross week becomes ${r.primary.value} in take-home pay.` },
    { title: '$120k married, Illinois', inputs: { salary: 120000, filing: 'married', state: 'IL', freq: 'semimonthly', k401: 8, health: 150 }, explain: (r) => `Illinois’ flat 4.95% takes ${r.rows![4].value} per check.` },
    { title: '$250k single, monthly', inputs: { salary: 250000, freq: 'monthly', k401: 10, health: 200 }, explain: (r) => `The 401(k) hits the IRS cap of ${usd(LIMIT_401K)}; marginal bracket ${r.rows![9].value}.` },
  ],
  analysis() {
    const sal = [30000, 50000, 75000, 100000, 150000, 200000, 250000];
    const base = { payType: 'salary', freq: 'biweekly', filing: 'single', k401: 0, health: 0 };
    const none = sal.map((s) => paycheck({ ...base, salary: s, state: 'none' }));
    const il = sal.map((s) => paycheck({ ...base, salary: s, state: 'IL' }));
    const keep = none.map((p) => (p.net / p.gross) * 100);
    const k = [0, 5, 10, 15];
    const kp = k.map((x) => paycheck({ ...base, salary: 75000, state: 'none', k401: x }));
    const costPer100 = ((kp[0].net - kp[1].net) / (kp[1].k401 - kp[0].k401)) * 100;
    return [
      {
        title: 'Share of pay you keep at each salary',
        insight: `A single filer with no state income tax keeps <strong>${pct(keep[0], 0)}</strong> of a $30,000 salary but ${pct(keep[6], 0)} of $250,000. The drop is gradual because the US system is progressive: only income above each threshold is taxed at the higher rate.`,
        chart: {
          type: 'line',
          title: `Annual take-home pay by salary, single, ${TAX_YEAR}`,
          x: sal.map((s) => '$' + s / 1000 + 'k'),
          series: [
            { name: 'No state tax', values: none.map((p) => p.net) },
            { name: 'Illinois (4.95%)', values: il.map((p) => p.net) },
          ],
          y: 'usd',
          xTitle: 'Gross salary',
        },
        table: { head: ['Salary', 'Take-home (no state tax)', 'Kept', 'Take-home (IL)'], rows: sal.map((s, i) => [usd(s), usd(none[i].net), pct(keep[i], 1), usd(il[i].net)]) },
      },
      {
        title: 'What a 401(k) contribution really costs your paycheck',
        insight: `On $75,000, each $100 you put into a traditional 401(k) reduces take-home pay by only about <strong>${usd2(costPer100)}</strong>, because it comes out before federal income tax (22% bracket here). The rest is a tax deferral you would otherwise pay now.`,
        chart: {
          type: 'stacked',
          title: 'Annual take-home vs 401(k) savings, $75k salary',
          x: k.map((x) => x + '% to 401(k)'),
          series: [
            { name: 'Take-home', values: kp.map((p) => p.net) },
            { name: '401(k) savings', values: kp.map((p) => p.k401) },
          ],
          y: 'usd',
        },
      },
    ];
  },
  variantQs: [
    { q: 'Is this a take-home pay calculator?', a: 'Yes. Take-home pay, net pay and “salary after tax” all mean the amount deposited in your account after taxes and deductions — the headline figure above.' },
    { q: 'How does the hourly paycheck calculator work?', a: 'Choose “Hourly wage”, enter your rate and weekly hours. The calculator annualises your pay (rate × hours × 52) to apply the yearly brackets, then divides by your pay frequency.' },
    { q: 'What about my employer’s payroll tool?', a: 'Payroll providers use the same IRS withholding tables plus your exact W-4 and local taxes, so their number is authoritative. Use this calculator to understand and plan, then check your actual pay stub.' },
  ],
  tips: [
    'Review your W-4 after a raise, marriage or second job — mismatched withholding leads to a big bill or refund.',
    'Contribute at least enough to get any employer 401(k) match; it is part of your pay.',
    'Bonuses are often withheld at a flat 22% federal rate, so a bonus check can look smaller than a regular one.',
    'Once you pass the Social Security wage base, the 6.2% tax stops for the rest of the year and checks get bigger.',
  ],
  faqs: [
    { q: `How much is $65,000 a year after taxes in ${TAX_YEAR}?`, a: `For a single filer with no state income tax and no deductions, about ${usd(paycheck({ payType: 'salary', salary: 65000, freq: 'biweekly', filing: 'single', state: 'none', k401: 0, health: 0 }).net)} a year, or ${usd2(paycheck({ payType: 'salary', salary: 65000, freq: 'biweekly', filing: 'single', state: 'none', k401: 0, health: 0 }).net / 26)} every two weeks.` },
    { q: 'What taxes come out of my paycheck?', a: 'Federal income tax, Social Security (6.2%), Medicare (1.45%, plus 0.9% on high incomes), and in most states a state income tax. Some cities and counties also levy local income tax.' },
    { q: `What is the Social Security wage base for ${TAX_YEAR}?`, a: `${usd(SS_WAGE_BASE)}. Wages above that amount are not subject to the 6.2% Social Security tax, though Medicare tax still applies.` },
    { q: 'Why is my actual paycheck different?', a: 'Your W-4 choices, local taxes, post-tax deductions (such as Roth 401(k) or union dues), and employer-specific benefits all change the result. Compare line by line with your pay stub.' },
    { q: 'Which states have no income tax?', a: 'Alaska, Florida, Nevada, New Hampshire (no tax on wages), South Dakota, Tennessee, Texas, Washington and Wyoming.' },
  ],
  sources: [
    { label: `IRS – Tax inflation adjustments for tax year ${TAX_YEAR}`, url: 'https://www.irs.gov/newsroom' },
    { label: 'IRS Publication 15-T – Federal income tax withholding methods', url: 'https://www.irs.gov/publications/p15t' },
    { label: `SSA – ${TAX_YEAR} Social Security changes (wage base)`, url: 'https://www.ssa.gov/news/press/factsheets/colafacts.pdf' },
  ],
  related: ['payroll-calculator', 'time-card-calculator', 'hours-calculator', 'investment-calculator', 'percentage-calculator'],
  disclaimer: 'tax',
  reference: {
    caption: `${TAX_YEAR} Federal Income Tax Brackets (Single)`,
    asOf: `tax year ${TAX_YEAR}`,
    source: 'IRS Rev. Proc. 2025-32',
    head: ['Rate', 'Taxable income from', 'Up to'],
    rows: [
      ['10%', '$0', '$12,400'],
      ['12%', '$12,401', '$50,400'],
      ['22%', '$50,401', '$105,700'],
      ['24%', '$105,701', '$201,775'],
      ['32%', '$201,776', '$256,225'],
      ['35%', '$256,226', '$640,600'],
      ['37%', '$640,601', 'and above'],
    ],
  },
};
export default calc;
