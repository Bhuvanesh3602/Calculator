import { usd, usd2, pct, num } from '../lib/format';
import type { Calculator } from '../lib/types';

export type InterestMode = 'simple' | '1' | '4' | '12' | '365' | 'continuous';

/** Monthly-step growth for simple, periodic or continuous compounding. Contributions are made at the end of each month. */
export function interestGrowth(principal: number, ratePct: number, years: number, mode: InterestMode, monthly = 0) {
  const r = ratePct / 100;
  const months = Math.round(years * 12);
  const eff = mode === 'continuous' ? Math.exp(r / 12) - 1 : mode === 'simple' ? 0 : Math.pow(1 + r / +mode, +mode / 12) - 1;
  let bal = principal,
    contributed = principal,
    simpleInterest = 0;
  const snaps = [{ year: 0, balance: principal, contributed: principal, interest: 0 }];
  for (let m = 1; m <= months; m++) {
    if (mode === 'simple') {
      // Simple interest: every dollar deposited so far earns r/12 per month; interest never earns interest.
      simpleInterest += (contributed * r) / 12;
      contributed += monthly;
      bal = contributed + simpleInterest;
    } else {
      bal = bal * (1 + eff) + monthly;
      contributed += monthly;
    }
    if (m % 12 === 0 || m === months) snaps.push({ year: +(m / 12).toFixed(2), balance: bal, contributed, interest: bal - contributed });
  }
  return snaps;
}

const MODE_LABEL: Record<string, string> = { simple: 'simple interest', '1': 'yearly compounding', '4': 'quarterly compounding', '12': 'monthly compounding', '365': 'daily compounding', continuous: 'continuous compounding' };

const calc: Calculator = {
  slug: 'interest-calculator',
  name: 'Interest Calculator',
  short: 'Interest',
  category: 'finance',
  keyword: 'interest calculator',
  volume: 301000,
  variants: ['simple interest calculator', 'savings interest calculator', 'interest earned calculator', 'continuous compounding calculator', 'how much interest will I earn'],
  title: 'Interest Calculator – Simple vs Compound, After Tax & Inflation',
  description:
    'Work out the interest earned on savings with simple, daily, monthly or continuous compounding. See after-tax and inflation-adjusted results side by side.',
  accent: 'simple or compound',
  icon: 'i',
  inputs: [
    { id: 'principal', label: 'Starting amount', type: 'number', default: 10000, min: 0, step: 100, prefix: '$' },
    { id: 'rate', label: 'Annual interest rate', type: 'number', default: 4.5, min: -10, max: 50, step: 0.05, suffix: '%' },
    { id: 'years', label: 'Time', type: 'number', default: 10, min: 0.1, max: 100, step: 0.5, suffix: 'years' },
    {
      id: 'mode',
      label: 'Interest type',
      type: 'select',
      default: '12',
      options: [
        { value: 'simple', label: 'Simple interest (no compounding)' },
        { value: '1', label: 'Compounded yearly' },
        { value: '4', label: 'Compounded quarterly' },
        { value: '12', label: 'Compounded monthly' },
        { value: '365', label: 'Compounded daily' },
        { value: 'continuous', label: 'Compounded continuously' },
      ],
    },
    { id: 'monthly', label: 'Monthly deposit (optional)', type: 'number', default: 100, min: 0, step: 25, prefix: '$' },
    { id: 'tax', label: 'Tax rate on interest', type: 'number', default: 22, min: 0, max: 60, step: 1, suffix: '%', help: 'Your marginal income-tax rate; use 0 for a Roth IRA or other tax-free account.' },
    { id: 'inflation', label: 'Inflation', type: 'number', default: 2.5, min: 0, max: 30, step: 0.1, suffix: '%' },
  ],
  compute(v) {
    const P = +v.principal || 0,
      years = +v.years,
      rate = +v.rate,
      monthly = +v.monthly || 0;
    if (!(years > 0)) return { primary: { label: '', value: '' }, error: 'Enter a time period longer than zero.' };
    if (P <= 0 && monthly <= 0) return { primary: { label: '', value: '' }, error: 'Enter a starting amount or a monthly deposit.' };
    const mode = v.mode as InterestMode;
    const g = interestGrowth(P, rate, years, mode, monthly);
    const end = g.at(-1)!;
    const other = interestGrowth(P, rate, years, mode === 'simple' ? '12' : 'simple', monthly).at(-1)!;
    const taxRate = (+v.tax || 0) / 100;
    const afterTax = end.contributed + end.interest * (1 - taxRate);
    const real = afterTax / Math.pow(1 + (+v.inflation || 0) / 100, years);
    const apy = mode === 'simple' ? rate : mode === 'continuous' ? (Math.exp(rate / 100) - 1) * 100 : (Math.pow(1 + rate / 100 / +mode, +mode) - 1) * 100;
    const doubling = rate > 0 ? (mode === 'simple' ? 100 / rate : Math.log(2) / Math.log(1 + apy / 100)) : Infinity;
    const simpleSeries = interestGrowth(P, rate, years, 'simple', monthly);
    const compSeries = mode === 'simple' ? interestGrowth(P, rate, years, '12', monthly) : g;
    return {
      primary: { label: `Interest earned in ${num(years, 2)} years`, value: usd2(end.interest) },
      rows: [
        { label: 'Ending balance', value: usd2(end.balance) },
        { label: 'Total deposited', value: usd2(end.contributed) },
        { label: `Tax on interest (${pct(taxRate * 100, 0)})`, value: usd2(end.interest * taxRate) },
        { label: 'Balance after tax', value: usd2(afterTax) },
        { label: 'After tax, in today’s dollars', value: usd2(real) },
        { label: 'Effective annual yield (APY)', value: pct(apy, 3) },
        { label: mode === 'simple' ? 'With monthly compounding instead' : 'With simple interest instead', value: usd2(other.interest) + ' interest' },
        { label: 'Time to double the starting amount', value: isFinite(doubling) ? `${num(doubling, 1)} years` : 'never at this rate' },
      ],
      chart: {
        type: 'line',
        title: 'Simple vs compound interest on the same deposits',
        x: compSeries.map((s) => s.year),
        series: [
          { name: 'Compound', values: compSeries.map((s) => s.balance) },
          { name: 'Simple', values: simpleSeries.map((s) => s.balance) },
          { name: 'Deposits only', values: compSeries.map((s) => s.contributed) },
        ],
        y: 'usd',
        xTitle: 'Year',
      },
      table: {
        head: ['Year', 'Deposits to date', 'Interest to date', 'Balance'],
        rows: g.slice(1).map((s) => [s.year, usd2(s.contributed), usd2(s.interest), usd2(s.balance)]),
      },
      steps:
        mode === 'simple'
          ? [`Interest each month = balance of deposits × ${rate}% ÷ 12`, `Interest is never added to the base, so it does not earn more interest`, `Total interest = ${usd2(end.interest)}`]
          : [`Periodic rate = ${rate}% ÷ ${mode === 'continuous' ? '∞ (e^rt)' : mode}`, `APY = ${pct(apy, 3)}`, `Balance = ${usd2(P)} grown for ${num(years, 2)} years + ${usd(monthly)} each month`, `Interest = ${usd2(end.balance)} − ${usd2(end.contributed)} deposited = ${usd2(end.interest)}`],
    };
  },
  answer: {
    text: (r) =>
      `<strong>$10,000</strong> at <strong>4.5%</strong> compounded monthly, plus $100 a month for 10 years, earns <strong>${r.primary.value}</strong> in interest for an ending balance of ${r.rows![0].value}. After 22% tax and 2.5% inflation, it is worth ${r.rows![4].value} in today’s money. Simple interest would earn only ${r.rows![6].value.replace(' interest', '')}.`,
  },
  intro: [
    'An interest calculator shows how much a deposit earns over time. <strong>Simple interest</strong> is paid only on the money you put in. <strong>Compound interest</strong> is also paid on interest already earned, so the balance grows faster each year.',
    'Most interest calculators stop at the gross balance. This one also takes off tax on the interest and adjusts for inflation, so you see what the money will really buy. It also shows the simple and compound results on the same chart, so you can see how much compounding adds.',
  ],
  formula: {
    expr: 'Simple:      I = P × r × t\nCompound:    A = P × (1 + r/n)^(n·t)\nContinuous:  A = P × e^(r·t)\nReal value = A_after-tax ÷ (1 + inflation)^t',
    vars: [
      ['P', 'starting amount (principal)'],
      ['r', 'annual rate as a decimal'],
      ['n', 'compounding periods per year'],
      ['t', 'time in years'],
      ['e', '2.71828…, the limit of compounding infinitely often'],
    ],
    notes: ['Monthly deposits are added at the end of each month. With simple interest, each deposit earns interest from the month after it is made.'],
  },
  examples: [
    { title: 'High-yield savings, no deposits', inputs: { principal: 25000, rate: 4.25, years: 3, mode: '365', monthly: 0 }, explain: (r) => `${r.primary.value} interest; ${r.rows![3].value} after tax.` },
    { title: 'Simple-interest bond, 5 years', inputs: { principal: 5000, rate: 5, years: 5, mode: 'simple', monthly: 0, tax: 24 }, explain: (r) => `Exactly ${r.primary.value}: $5,000 × 5% × 5. Compounding monthly would pay ${r.rows![6].value}.` },
    { title: 'Kid’s savings for 18 years', inputs: { principal: 1000, rate: 4, years: 18, mode: '12', monthly: 50, tax: 0 }, explain: (r) => `Balance ${r.rows![0].value}, of which ${r.primary.value} is interest.` },
  ],
  analysis() {
    const modes: InterestMode[] = ['simple', '1', '4', '12', '365', 'continuous'];
    const ends = modes.map((m) => interestGrowth(10000, 6, 10, m).at(-1)!.interest);
    const rates = [1, 2, 3, 4, 5, 6, 8, 10];
    return [
      {
        title: 'How much does compounding frequency matter?',
        insight: `On $10,000 at 6% for 10 years, switching from simple interest to yearly compounding adds <strong>${usd(ends[1] - ends[0])}</strong>. Going from yearly to continuous adds only another ${usd(ends[5] - ends[1])}. Whether interest compounds at all matters far more than how often it does.`,
        chart: { type: 'bar', title: 'Interest on $10,000 at 6% over 10 years', x: ['Simple', 'Yearly', 'Quarterly', 'Monthly', 'Daily', 'Continuous'], series: [{ name: 'Interest', values: ends }], y: 'usd' },
      },
      {
        title: 'Tax and inflation can cancel out a low rate',
        insight: 'The table shows the real after-tax return at each rate for someone in the 22% bracket with 2.5% inflation. Below about 3.2%, the saver loses buying power even though the balance keeps growing. This is why emergency funds belong in savings, but long-term money usually needs higher-returning assets.',
        table: {
          head: ['Nominal rate', 'After 22% tax', 'Real (after 2.5% inflation)'],
          rows: rates.map((r) => {
            const at = r * 0.78;
            return [pct(r, 0), pct(at, 2), pct(((1 + at / 100) / 1.025 - 1) * 100, 2)];
          }),
        },
      },
    ];
  },
  variantQs: [
    { q: 'Is this a simple interest calculator?', a: 'Yes. Choose “Simple interest” to get I = P × r × t. The page also shows what the same money would earn with monthly compounding, so you can compare.' },
    { q: 'How much interest will I earn on $10,000?', a: 'At 4.5% compounded monthly, $10,000 earns about $5,670 in 10 years with no extra deposits. At 2% it earns about $2,210. Change the inputs above to see your own numbers.' },
    { q: 'What is continuous compounding?', a: 'It is the limit as interest compounds infinitely often: A = Pe^(rt). Few banks pay it, but it is used in finance and calculus as the upper bound on compounding.' },
  ],
  tips: [
    'Compare savings accounts by <strong>APY</strong>, not the nominal rate, because APY already includes compounding.',
    'Interest in an ordinary savings account is taxed every year, even if you never withdraw it.',
    'Use the real (inflation-adjusted) result for long-term goals. A balance 20 years from now buys much less than the same balance today.',
  ],
  faqs: [
    { q: 'What is the difference between simple and compound interest?', a: 'Simple interest is paid only on the original deposit. Compound interest is paid on the deposit plus the interest already added, so it grows faster over time.' },
    { q: 'How is interest calculated monthly?', a: 'Divide the annual rate by 12 and multiply by the balance. At 6% a year, the monthly rate is 0.5%, so a $1,000 balance earns $5 in a month.' },
    { q: 'What is APY?', a: 'Annual percentage yield is the rate actually earned in a year once compounding is included. 4.5% compounded monthly is an APY of 4.594%.' },
    { q: 'What is the rule of 72?', a: 'Divide 72 by the annual rate to estimate the years needed to double your money. At 6%, that is about 12 years. The calculator shows the exact figure.' },
    { q: 'Is interest earned taxable?', a: 'In the US, interest from savings accounts, CDs and most bonds is taxed as ordinary income in the year it is credited. Interest in IRAs and 401(k)s is tax-deferred or, in Roth accounts, tax-free.' },
  ],
  sources: [
    { label: 'Investor.gov – Compound interest calculator (SEC)', url: 'https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator' },
    { label: 'IRS Topic No. 403 – Interest received', url: 'https://www.irs.gov/taxtopics/tc403' },
  ],
  related: ['compound-interest-calculator', 'cd-calculator', 'interest-rate-calculator', 'inflation-calculator', 'investment-calculator'],
  disclaimer: 'finance',
};
export default calc;
