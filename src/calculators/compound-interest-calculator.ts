import { growth } from '../lib/math';
import { usd, pct } from '../lib/format';
import type { Calculator } from '../lib/types';

const calc: Calculator = {
  slug: 'compound-interest-calculator',
  name: 'Compound Interest Calculator',
  short: 'Compound Interest',
  category: 'finance',
  keyword: 'compound interest calculator',
  volume: 823000,
  variants: [
    'compound and interest calculator',
    'accumulated interest calculator',
    'interest compound calculator',
    'calculating compound interest calculator',
    'calculator compounding',
    'composite interest calculator',
  ],
  title: 'Compound Interest Calculator – Growth with Monthly Deposits',
  description:
    'See how savings grow with compound interest and monthly deposits. Choose daily, monthly or yearly compounding, adjust for inflation and find your time to a goal.',
  accent: 'watch it snowball',
  icon: '%',
  inputs: [
    { id: 'principal', label: 'Initial deposit', type: 'number', default: 10000, min: 0, step: 500, prefix: '$' },
    { id: 'monthly', label: 'Monthly contribution', type: 'number', default: 200, min: 0, step: 25, prefix: '$' },
    { id: 'rate', label: 'Annual interest rate', type: 'number', default: 7, min: -20, max: 50, step: 0.1, suffix: '%' },
    { id: 'years', label: 'Years', type: 'number', default: 20, min: 1, max: 80, step: 1, suffix: 'years' },
    {
      id: 'freq',
      label: 'Compounding',
      type: 'select',
      default: '12',
      options: [
        { value: '365', label: 'Daily' },
        { value: '12', label: 'Monthly' },
        { value: '4', label: 'Quarterly' },
        { value: '1', label: 'Annually' },
      ],
    },
    {
      id: 'timing',
      label: 'Contributions made',
      type: 'select',
      default: 'end',
      options: [
        { value: 'end', label: 'End of each month' },
        { value: 'start', label: 'Start of each month' },
      ],
    },
    { id: 'inflation', label: 'Inflation (for real value)', type: 'number', default: 2.5, min: 0, step: 0.1, suffix: '%' },
    { id: 'goal', label: 'Savings goal (optional)', type: 'number', default: 250000, min: 0, step: 1000, prefix: '$' },
  ],
  compute(v) {
    const g = growth({ principal: +v.principal || 0, ratePct: +v.rate, years: +v.years, compoundsPerYear: +v.freq, monthly: +v.monthly || 0, timing: v.timing });
    const end = g[g.length - 1];
    const real = end.balance / Math.pow(1 + (+v.inflation || 0) / 100, +v.years);
    let goalYears = '—';
    if (+v.goal > 0) {
      const long = growth({ principal: +v.principal || 0, ratePct: +v.rate, years: 100, compoundsPerYear: +v.freq, monthly: +v.monthly || 0, timing: v.timing });
      const hit = long.find((s) => s.balance >= +v.goal);
      goalYears = hit ? `${hit.year} years` : 'over 100 years';
    }
    return {
      primary: { label: `Balance after ${v.years} years`, value: usd(end.balance) },
      rows: [
        { label: 'Total contributions', value: usd(end.contributed) },
        { label: 'Interest earned', value: usd(end.interest) },
        { label: `In today’s money (${v.inflation}% inflation)`, value: usd(real) },
        { label: 'Interest share of balance', value: pct((end.interest / end.balance) * 100, 0) },
        { label: `Time to reach ${usd(+v.goal)}`, value: goalYears },
      ],
      chart: {
        type: 'stacked',
        title: 'Contributions vs interest, year by year',
        x: g.slice(1).map((s) => 'Yr ' + s.year),
        series: [
          { name: 'Contributions', values: g.slice(1).map((s) => s.contributed) },
          { name: 'Interest', values: g.slice(1).map((s) => s.interest) },
        ],
        y: 'usd',
        xTitle: 'Year',
      },
      table: { head: ['Year', 'Contributed', 'Interest', 'Balance'], rows: g.map((s) => [s.year, usd(s.contributed), usd(s.interest), usd(s.balance)]) },
    };
  },
  answer: {
    text: (r, v) =>
      `Investing <strong>$${(+v.principal).toLocaleString('en-US')}</strong> plus $${v.monthly} a month at ${v.rate}% compounded monthly grows to about <strong>${r.primary.value}</strong> in ${v.years} years. You put in ${r.rows![0].value}; the other <strong>${r.rows![1].value}</strong> is compound interest — interest earned on earlier interest.`,
  },
  intro: [
    'Compound interest means you earn interest on your original money <em>and</em> on the interest it has already earned. The effect is small at first and then accelerates, which is why time matters more than almost anything else in saving.',
    'This compound interest calculator models a starting deposit plus regular monthly contributions, any compounding frequency, contributions at the start or end of each month, and an inflation adjustment so you can see what the final balance is worth in today’s money. It also tells you how long it takes to reach a savings goal.',
  ],
  formula: {
    expr: 'A = P(1 + r/n)^(n·t) + PMT × [((1 + i)^(12t) − 1) / i]\ni = (1 + r/n)^(n/12) − 1',
    vars: [
      ['A', 'ending balance'],
      ['P', 'initial deposit'],
      ['r', 'annual interest rate (decimal)'],
      ['n', 'compounding periods per year'],
      ['t', 'years'],
      ['PMT', 'monthly contribution'],
      ['i', 'effective monthly rate equivalent to the chosen compounding'],
    ],
    notes: ['For contributions at the start of each month, the annuity part is multiplied by (1 + i). The real (inflation-adjusted) value divides A by (1 + inflation)^t.'],
  },
  examples: [
    { title: 'Start at 25, $300/month', inputs: { principal: 0, monthly: 300, rate: 7, years: 40 }, explain: (r) => `Contributions of ${r.rows![0].value} become ${r.primary.value} — interest does most of the work.` },
    { title: 'Start at 35, $300/month', inputs: { principal: 0, monthly: 300, rate: 7, years: 30 }, explain: (r) => `Ten fewer years means ending with ${r.primary.value}, far less than the early starter.` },
    { title: 'Lump sum, no top-ups', inputs: { principal: 25000, monthly: 0, rate: 5, years: 15 }, explain: (r) => `$25,000 at 5% grows to ${r.primary.value} with no further deposits.` },
  ],
  analysis() {
    const rates = [2, 4, 6, 7, 8, 10, 12];
    const r72 = rates.map((r) => ({ r, rule: 72 / r, exact: Math.log(2) / Math.log(1 + r / 100) }));
    const yrs = [0, 5, 10, 15, 20, 25, 30];
    const series = [4, 7, 10].map((r) => ({
      name: r + '% return',
      values: yrs.map((y) => (y ? growth({ principal: 0, ratePct: r, years: y, monthly: 100 }).at(-1)!.balance : 0)),
    }));
    const freq = [
      ['Annually', 1],
      ['Quarterly', 4],
      ['Monthly', 12],
      ['Daily', 365],
    ] as const;
    const fv = freq.map(([, n]) => 10000 * Math.pow(1 + 0.05 / n, n * 10));
    return [
      {
        title: '$100 a month at three different returns',
        insight: `Saving $100 a month for 30 years puts in $36,000. At 4% it grows to <strong>${usd(series[0].values[6])}</strong>; at 7%, ${usd(series[1].values[6])}; at 10%, ${usd(series[2].values[6])}. The gap between curves widens every year — that widening is compounding.`,
        chart: { type: 'line', title: '$100/month growth over 30 years', x: yrs.map((y) => y + ' yrs'), series, y: 'usd', xTitle: 'Years invested' },
      },
      {
        title: 'Rule of 72 vs exact doubling time',
        insight: `Divide 72 by the rate to estimate how many years money takes to double. At 7%, the rule says ${(72 / 7).toFixed(1)} years and the exact answer is ${r72[3].exact.toFixed(1)}. It is most accurate between 6% and 10% and drifts at very low or high rates.`,
        chart: {
          type: 'bar',
          title: 'Years to double: Rule of 72 vs exact',
          x: rates.map((r) => r + '%'),
          series: [
            { name: 'Rule of 72', values: r72.map((x) => x.rule) },
            { name: 'Exact', values: r72.map((x) => x.exact) },
          ],
          y: 'num',
          xTitle: 'Annual rate',
        },
      },
      {
        title: 'Does compounding frequency matter? Less than you think',
        insight: `$10,000 at 5% for 10 years ends at ${usd(fv[0])} with annual compounding and ${usd(fv[3])} with daily — a difference of only <strong>${usd(fv[3] - fv[0])}</strong>. The rate and the time invested matter far more than how often interest is credited.`,
        stats: freq.map(([name], i) => ({ label: name + ' compounding', value: usd(fv[i]) })),
      },
    ];
  },
  variantQs: [
    { q: 'What is an accumulated interest calculator?', a: 'It shows how much interest has built up on a balance over time — the “interest earned” line above. With compounding, accumulated interest also earns interest.' },
    { q: 'Is a “composite” or “complex” interest calculator the same thing?', a: 'Yes. These are translations or alternative names for compound interest, used in some countries. The formula is the same.' },
    { q: 'How do I compute compound interest by hand?', a: 'Multiply the principal by (1 + r/n) raised to n × t. For $1,000 at 5% compounded yearly for 3 years: 1,000 × 1.05³ = $1,157.63.' },
  ],
  tips: [
    'Use a realistic rate: savings accounts and CDs pay a known rate; stock returns vary year to year.',
    'Start contributions as early as possible — the first years of compounding are the most valuable.',
    'Compare investments by <strong>APY</strong>, which already includes compounding frequency.',
    'Taxes and fees reduce effective returns; tax-advantaged accounts let more of the interest compound.',
  ],
  faqs: [
    { q: 'How does compound interest work?', a: 'Each period, interest is added to your balance, and the next period’s interest is calculated on that larger balance. Over time you earn interest on interest, so growth accelerates.' },
    { q: 'How much will $10,000 grow in 20 years?', a: `At 7% compounded monthly with no additional deposits, $10,000 grows to about ${usd(growth({ principal: 10000, ratePct: 7, years: 20 }).at(-1)!.balance)} in 20 years.` },
    { q: 'What is the difference between simple and compound interest?', a: 'Simple interest is paid only on the original principal. Compound interest is paid on principal plus accumulated interest, so it grows faster over time.' },
    { q: 'Is daily compounding better than monthly?', a: 'Slightly. At typical rates the difference is a few dollars per thousand over a decade. A higher rate beats more frequent compounding.' },
    { q: 'What is the Rule of 72?', a: 'A shortcut: divide 72 by the annual interest rate to estimate how many years it takes to double your money. At 8%, money doubles in about 9 years.' },
  ],
  sources: [
    { label: 'Investor.gov (SEC) – Compound interest calculator & explainer', url: 'https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator' },
    { label: 'FDIC – Understanding APY', url: 'https://www.fdic.gov/resources/consumers/consumer-news/' },
  ],
  related: ['investment-calculator', 'cd-calculator', 'inflation-calculator', 'mortgage-calculator', 'percentage-calculator'],
  disclaimer: 'finance',
};
export default calc;
