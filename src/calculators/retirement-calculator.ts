import { usd, pct, num } from '../lib/format';
import type { Calculator, Values } from '../lib/types';

export interface RetirementInput {
  age: number;
  retireAge: number;
  endAge: number;
  savings: number;
  monthly: number;
  raise: number;
  preReturn: number;
  postReturn: number;
  inflation: number;
  income: number;
  other: number;
}

const mRate = (annualPct: number) => Math.pow(1 + annualPct / 100, 1 / 12) - 1;

/**
 * Month-by-month projection. Saving phase: contributions grow by `raise` each year.
 * Spending phase: withdraw (income − other income), both stated in today's dollars and
 * inflated every year, from a balance that keeps earning `postReturn`.
 */
export function retirementPlan(p: RetirementInput) {
  const yearsToRetire = Math.max(0, p.retireAge - p.age);
  const rPre = mRate(p.preReturn),
    rPost = mRate(p.postReturn);
  let bal = p.savings,
    contrib = p.monthly,
    contributed = p.savings;
  const byAge: { age: number; balance: number }[] = [{ age: p.age, balance: bal }];
  for (let y = 0; y < yearsToRetire; y++) {
    for (let m = 0; m < 12; m++) {
      bal = bal * (1 + rPre) + contrib;
      contributed += contrib;
    }
    contrib *= 1 + p.raise / 100;
    byAge.push({ age: p.age + y + 1, balance: bal });
  }
  const atRetirement = bal;
  const infl = Math.pow(1 + p.inflation / 100, yearsToRetire);
  const firstWithdrawal = Math.max(0, p.income - p.other) * infl; // monthly, in retirement-year dollars
  // Nest egg needed: present value at retirement of a growing monthly withdrawal over the spending years.
  const spendYears = Math.max(0, p.endAge - p.retireAge);
  let need = 0,
    w = firstWithdrawal,
    disc = 1;
  for (let y = 0; y < spendYears; y++) {
    for (let m = 0; m < 12; m++) {
      need += w * disc;
      disc /= 1 + rPost;
    }
    w *= 1 + p.inflation / 100;
  }
  // Drawdown
  let runsOutAge: number | null = null;
  w = firstWithdrawal;
  for (let y = 0; y < spendYears; y++) {
    for (let m = 0; m < 12; m++) {
      bal = bal * (1 + rPost) - w;
      if (bal < 0 && runsOutAge === null) runsOutAge = p.retireAge + y + m / 12;
    }
    w *= 1 + p.inflation / 100;
    byAge.push({ age: p.retireAge + y + 1, balance: Math.max(0, bal) });
  }
  // The balance at retirement is linear in the monthly contribution, so the extra saving needed is gap ÷ (FV of $1/month growing by `raise`).
  let fvPerDollar = 0,
    c = 1;
  for (let y = 0; y < yearsToRetire; y++) {
    for (let m = 0; m < 12; m++) fvPerDollar = fvPerDollar * (1 + rPre) + c;
    c *= 1 + p.raise / 100;
  }
  const gap = need - atRetirement;
  const extraMonthly = gap > 0 && fvPerDollar > 0 ? gap / fvPerDollar : 0;
  return { atRetirement, need, gap, extraMonthly, runsOutAge, endBalance: Math.max(0, bal), contributed, firstWithdrawal, byAge, yearsToRetire, real: atRetirement / infl };
}

function input(v: Values): RetirementInput {
  return {
    age: +v.age,
    retireAge: +v.retireAge,
    endAge: +v.endAge,
    savings: +v.savings || 0,
    monthly: +v.monthly || 0,
    raise: +v.raise || 0,
    preReturn: +v.preReturn,
    postReturn: +v.postReturn,
    inflation: +v.inflation || 0,
    income: +v.income || 0,
    other: +v.other || 0,
  };
}

const calc: Calculator = {
  slug: 'retirement-calculator',
  name: 'Retirement Calculator',
  short: 'Retirement',
  category: 'finance',
  keyword: 'retirement calculator',
  volume: 368000,
  variants: ['retirement savings calculator', 'how much do I need to retire', 'retirement planner', 'will my money last calculator', '401k retirement calculator'],
  title: 'Retirement Calculator – How Much You Need & Will It Last?',
  description:
    'Project your retirement savings, the nest egg you need for the income you want, the age your money runs out and the extra monthly saving that closes any gap.',
  accent: 'will it last?',
  icon: '⌛',
  inputs: [
    { id: 'age', label: 'Current age', type: 'number', default: 35, min: 16, max: 90, step: 1, suffix: 'years' },
    { id: 'retireAge', label: 'Retirement age', type: 'number', default: 67, min: 30, max: 95, step: 1, suffix: 'years' },
    { id: 'endAge', label: 'Plan until age', type: 'number', default: 92, min: 50, max: 115, step: 1, suffix: 'years', help: 'Planning to 90–95 covers most people; about 1 in 3 65-year-olds will live past 90 (SSA).' },
    { id: 'savings', label: 'Retirement savings today', type: 'number', default: 85000, min: 0, step: 1000, prefix: '$' },
    { id: 'monthly', label: 'Monthly saving (incl. employer match)', type: 'number', default: 900, min: 0, step: 50, prefix: '$' },
    { id: 'raise', label: 'Annual increase in saving', type: 'number', default: 2, min: 0, max: 15, step: 0.5, suffix: '%' },
    { id: 'preReturn', label: 'Return before retirement', type: 'number', default: 7, min: -5, max: 15, step: 0.1, suffix: '%' },
    { id: 'postReturn', label: 'Return during retirement', type: 'number', default: 5, min: -5, max: 12, step: 0.1, suffix: '%' },
    { id: 'inflation', label: 'Inflation', type: 'number', default: 2.5, min: 0, max: 10, step: 0.1, suffix: '%' },
    { id: 'income', label: 'Monthly income wanted in retirement (today’s $)', type: 'number', default: 6000, min: 0, step: 100, prefix: '$' },
    { id: 'other', label: 'Social Security & pensions per month (today’s $)', type: 'number', default: 2400, min: 0, step: 100, prefix: '$' },
  ],
  compute(v) {
    const p = input(v);
    if (!(p.retireAge > p.age)) return { primary: { label: '', value: '' }, error: 'Retirement age must be later than your current age.' };
    if (!(p.endAge > p.retireAge)) return { primary: { label: '', value: '' }, error: '“Plan until age” must be later than the retirement age.' };
    const r = retirementPlan(p);
    const lasts = r.runsOutAge === null ? `Beyond ${p.endAge}` : `Age ${Math.floor(r.runsOutAge)}`;
    return {
      primary: { label: r.runsOutAge === null ? 'Your savings last' : 'Savings run out at', value: lasts },
      rows: [
        { label: `Projected savings at ${p.retireAge}`, value: usd(r.atRetirement) },
        { label: '… in today’s dollars', value: usd(r.real) },
        { label: 'Nest egg needed at retirement', value: usd(r.need) },
        { label: r.gap > 0 ? 'Shortfall' : 'Surplus', value: usd(Math.abs(r.gap)) },
        { label: 'Extra monthly saving to close the gap', value: r.gap > 0 ? usd(r.extraMonthly) + ' more per month' : 'none needed' },
        { label: `First-year withdrawal (age ${p.retireAge})`, value: usd(r.firstWithdrawal * 12) + ' a year' },
        { label: 'Initial withdrawal rate', value: r.atRetirement > 0 ? pct((r.firstWithdrawal * 12 * 100) / r.atRetirement, 1) : '—' },
        { label: `Balance left at ${p.endAge}`, value: usd(r.endBalance) },
      ],
      note: 'Returns are assumed steady every year. Real markets vary, and a few bad years early in retirement (sequence risk) can shorten how long savings last.',
      chart: { type: 'area', title: 'Projected balance by age', x: r.byAge.map((b) => b.age), series: [{ name: 'Balance', values: r.byAge.map((b) => b.balance) }], y: 'usd', xTitle: 'Age', markIndex: r.yearsToRetire },
      table: { head: ['Age', 'Balance (nominal)'], rows: r.byAge.map((b) => [b.age, usd(b.balance)]) },
    };
  },
  answer: {
    text: (r) =>
      `A 35-year-old with <strong>$85,000</strong> saved, putting away $900 a month at a 7% return, reaches about <strong>${r.rows![0].value}</strong> by 67. To draw $6,000 a month in today’s money, with $2,400 coming from Social Security, the plan needs ${r.rows![2].value}. Savings last: <strong>${r.primary.value.toLowerCase()}</strong>.`,
  },
  intro: [
    'A retirement calculator answers two questions: how much will I have, and how long will it last? This one models both phases month by month. While you work, your savings get contributions and returns. After you retire, withdrawals rise with inflation each year.',
    'Many retirement calculators give only a target number. This one also shows the age your money runs out and the exact extra monthly saving that would close a shortfall. Income is entered in today’s dollars, the way you actually think about spending.',
  ],
  formula: {
    expr: 'Saving:   B(m+1) = B(m) × (1 + r_pre) + contribution\nSpending: B(m+1) = B(m) × (1 + r_post) − withdrawal\nwithdrawal = (income − Social Security) × (1 + inflation)^years\nNest egg = Σ withdrawal(m) ÷ (1 + r_post)^m',
    vars: [
      ['r_pre, r_post', 'monthly equivalents of the annual returns before and during retirement'],
      ['contribution', 'monthly saving, raised by the annual increase each year'],
      ['Nest egg', 'present value at retirement of every future withdrawal'],
    ],
    notes: ['Use returns after fees. A diversified stock-and-bond portfolio has historically returned roughly 4–5% a year above inflation, but no future return is guaranteed.'],
  },
  examples: [
    { title: 'Late starter, age 50', inputs: { age: 50, savings: 120000, monthly: 2000, income: 5000, other: 2200 }, explain: (r) => `${r.rows![0].value} at 67; savings last: ${r.primary.value.toLowerCase()}.` },
    { title: 'Early retirement at 55', inputs: { age: 30, retireAge: 55, endAge: 95, savings: 60000, monthly: 2500, income: 5500, other: 0 }, explain: (r) => `Needs ${r.rows![2].value}; projected ${r.rows![0].value}. ${r.rows![4].value === 'none needed' ? 'On track.' : 'Add ' + r.rows![4].value + '.'}` },
    { title: 'Already retired at 67', inputs: { age: 66, retireAge: 67, savings: 900000, monthly: 0, income: 7000, other: 3200 }, explain: (r) => `Withdrawal rate ${r.rows![6].value}; money lasts: ${r.primary.value.toLowerCase()}.` },
  ],
  analysis() {
    const starts = [25, 30, 35, 40, 45, 50, 55];
    const ends = starts.map((a) => retirementPlan({ age: a, retireAge: 67, endAge: 68, savings: 0, monthly: 500, raise: 0, preReturn: 7, postReturn: 5, inflation: 0, income: 0, other: 0 }).atRetirement);
    const rates = [3, 3.5, 4, 4.5, 5, 6];
    const lasts = rates.map((wr) => {
      const r = retirementPlan({ age: 66, retireAge: 66, endAge: 116, savings: 1_000_000, monthly: 0, raise: 0, preReturn: 0, postReturn: 5, inflation: 2.5, income: (1_000_000 * wr) / 100 / 12, other: 0 });
      return r.runsOutAge === null ? '50+ years' : `${num(r.runsOutAge - 66, 0)} years`;
    });
    return [
      {
        title: 'The cost of waiting ten years',
        insight: `Saving $500 a month at 7% from age 25 builds about <strong>${usd(ends[0])}</strong> by 67. Starting at 35 gives ${usd(ends[2])}, and starting at 45 only ${usd(ends[4])}. The person who starts at 25 deposits 31% more money but ends with ${num(ends[0] / ends[2], 1)} times the balance of the 35-year-old starter.`,
        chart: { type: 'bar', title: '$500 a month at 7% until age 67, by starting age', x: starts.map((a) => 'From ' + a), series: [{ name: 'Balance at 67', values: ends }], y: 'usd' },
      },
      {
        title: 'How long $1 million lasts at different withdrawal rates',
        insight: 'This table assumes a steady 5% return and withdrawals that rise 2.5% a year with inflation. The well-known 4% rule comes from studies of historical US markets that included bad decades. With steady returns it lasts far longer than 30 years, which leaves a cushion for poor markets.',
        table: { head: ['First-year withdrawal', 'Annual amount', 'Money lasts'], rows: rates.map((wr, i) => [pct(wr, 1), usd(10000 * wr), lasts[i]]) },
      },
    ];
  },
  variantQs: [
    { q: 'How much do I need to retire?', a: 'It depends on the income you want, minus Social Security and pensions. As a rough guide, the nest egg needed is about 25 times the yearly gap (the 4% rule). This calculator works out the exact figure from your own ages, returns and inflation.' },
    { q: 'Will my retirement savings last?', a: 'The headline result shows the age your balance reaches zero, or “Beyond” your planning age if it never does. Try a lower return during retirement to stress-test the plan.' },
    { q: 'Is this a 401(k) retirement calculator?', a: 'Yes. Enter your total 401(k), IRA and other retirement balances as savings today, and your own plus employer contributions as monthly saving. Use our RMD calculator for required withdrawals after age 73.' },
  ],
  tips: [
    'Count your employer match as part of your monthly saving. Not taking the full match is the costliest mistake in retirement saving.',
    'Look up your estimated Social Security benefit at ssa.gov/myaccount rather than guessing it.',
    'Plan to age 90 or later. Running out of money at 85 is a much bigger problem than leaving some unspent.',
    'Each year you delay claiming Social Security after full retirement age, up to 70, raises the benefit by 8%.',
  ],
  faqs: [
    { q: 'What is the 4% rule?', a: 'It says you can withdraw 4% of your savings in the first year of retirement, then raise the amount with inflation, and the money has historically lasted at least 30 years. $1 million supports about $40,000 a year.' },
    { q: 'What rate of return should I assume?', a: 'Many planners use 6–7% before retirement for a stock-heavy portfolio and 4–5% during retirement for a more conservative mix, both after fees. Lower numbers give a safer plan.' },
    { q: 'How much of my income should I save for retirement?', a: 'A common guideline is 15% of gross income, including any employer match, starting in your 20s. Starting later means saving a larger share.' },
    { q: 'Does this include taxes?', a: 'No. Enter the income you want before tax. Withdrawals from traditional 401(k)s and IRAs are taxed as income, so a pre-tax target should be higher than your planned take-home spending.' },
    { q: 'At what age can I retire?', a: 'Full Social Security retirement age is 67 for anyone born in 1960 or later. You can claim from 62 with a permanently reduced benefit, and 401(k) withdrawals are penalty-free from 59½.' },
  ],
  sources: [
    { label: 'SSA – Retirement age and benefit reduction', url: 'https://www.ssa.gov/benefits/retirement/planner/agereduction.html' },
    { label: 'Investor.gov – Saving and investing for retirement', url: 'https://www.investor.gov/additional-resources/retirement-toolkit' },
    { label: 'SSA – Longevity: how long will you live?', url: 'https://www.ssa.gov/oact/population/longevity.html' },
  ],
  related: ['investment-calculator', 'compound-interest-calculator', 'rmd-calculator', 'inflation-calculator', 'paycheck-calculator'],
  disclaimer: 'finance',
};
export default calc;
