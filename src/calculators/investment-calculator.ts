import { usd, pct } from '../lib/format';
import type { Calculator } from '../lib/types';

/** Monthly simulation with annual contribution step-up and annual fee drag. */
export function invest(o: { start: number; monthly: number; stepUp: number; ret: number; fee: number; years: number }) {
  const net = (1 + o.ret / 100) / (1 + o.fee / 100) - 1; // fee applied as % of assets yearly
  const mr = Math.pow(1 + net, 1 / 12) - 1;
  let bal = o.start,
    contrib = o.start,
    m = o.monthly;
  const snaps = [{ year: 0, balance: bal, contributed: contrib }];
  for (let y = 1; y <= o.years; y++) {
    for (let k = 0; k < 12; k++) {
      bal = bal * (1 + mr) + m;
      contrib += m;
    }
    snaps.push({ year: y, balance: bal, contributed: contrib });
    m *= 1 + o.stepUp / 100;
  }
  return snaps;
}

const calc: Calculator = {
  slug: 'investment-calculator',
  name: 'Investment Calculator',
  short: 'Investment',
  category: 'finance',
  keyword: 'investment calculator',
  volume: 450000,
  variants: ['investment return calculator', 'sip calculator', 'stock investment calculator', 'how much will my investment grow'],
  title: 'Investment Calculator – Growth with Step-Ups & Fee Drag',
  description:
    'Project your investment balance with monthly contributions, yearly step-ups and fund fees. Compare return scenarios and see how much fees cost you over time.',
  accent: 'fees included',
  icon: '↗',
  inputs: [
    { id: 'start', label: 'Starting amount', type: 'number', default: 5000, min: 0, step: 500, prefix: '$' },
    { id: 'monthly', label: 'Monthly investment', type: 'number', default: 500, min: 0, step: 25, prefix: '$' },
    { id: 'stepUp', label: 'Increase contribution each year', type: 'number', default: 3, min: 0, max: 30, step: 0.5, suffix: '%', help: 'A “step-up” or SIP top-up, e.g. in line with raises.' },
    { id: 'ret', label: 'Expected annual return', type: 'number', default: 7, min: -10, max: 30, step: 0.1, suffix: '%' },
    { id: 'fee', label: 'Annual fund fee (expense ratio)', type: 'number', default: 0.5, min: 0, max: 5, step: 0.05, suffix: '%' },
    { id: 'years', label: 'Years', type: 'number', default: 25, min: 1, max: 60, step: 1, suffix: 'years' },
  ],
  compute(v) {
    const o = { start: +v.start || 0, monthly: +v.monthly || 0, stepUp: +v.stepUp || 0, ret: +v.ret, fee: +v.fee || 0, years: Math.round(+v.years) };
    if (!(o.years > 0)) return { primary: { label: '', value: '' }, error: 'Enter at least 1 year.' };
    const s = invest(o);
    const noFee = invest({ ...o, fee: 0 });
    const lo = invest({ ...o, ret: o.ret - 2 }),
      hi = invest({ ...o, ret: o.ret + 2 });
    const end = s.at(-1)!;
    return {
      primary: { label: `Projected value in ${o.years} years`, value: usd(end.balance) },
      rows: [
        { label: 'Total invested', value: usd(end.contributed) },
        { label: 'Investment growth', value: usd(end.balance - end.contributed) },
        { label: 'Lost to fees', value: usd(noFee.at(-1)!.balance - end.balance) },
        { label: `If returns are ${o.ret - 2}%`, value: usd(lo.at(-1)!.balance) },
        { label: `If returns are ${o.ret + 2}%`, value: usd(hi.at(-1)!.balance) },
      ],
      chart: {
        type: 'line',
        title: 'Projected balance: three return scenarios',
        x: s.map((x) => 'Yr ' + x.year),
        series: [
          { name: `${o.ret + 2}% return`, values: hi.map((x) => x.balance) },
          { name: `${o.ret}% return`, values: s.map((x) => x.balance) },
          { name: `${o.ret - 2}% return`, values: lo.map((x) => x.balance) },
          { name: 'Invested', values: s.map((x) => x.contributed) },
        ],
        y: 'usd',
        xTitle: 'Year',
      },
    };
  },
  answer: {
    text: (r, v) =>
      `Investing <strong>$${v.monthly} a month</strong> (raised ${v.stepUp}% a year) on top of $${(+v.start).toLocaleString('en-US')} at a ${v.ret}% return with a ${v.fee}% fee grows to about <strong>${r.primary.value}</strong> in ${v.years} years. You contribute ${r.rows![0].value}; fees cost roughly <strong>${r.rows![2].value}</strong> along the way.`,
  },
  intro: [
    'An investment calculator projects how a portfolio could grow from a starting amount and regular contributions at an assumed rate of return. Because real returns are never smooth, it is best used to compare scenarios rather than to predict an exact number.',
    'This one adds two things most calculators leave out: an annual contribution step-up (as in a SIP top-up, or raising your 401(k) contribution with each pay rise) and the fund’s expense ratio, so you can see how much a seemingly small fee takes from your final balance. For a guaranteed rate over a fixed term, compare it with the <a href="/cd-calculator/">CD calculator</a>.',
  ],
  formula: {
    expr: 'Net return  g = (1 + R) / (1 + F) − 1\nMonthly rate m = (1 + g)^(1/12) − 1\nBalance_(k+1) = Balance_k × (1 + m) + C_year\nC_(year+1) = C_year × (1 + step-up)',
    vars: [
      ['R', 'expected annual return'],
      ['F', 'annual fee (expense ratio)'],
      ['C', 'monthly contribution, raised once a year'],
    ],
  },
  examples: [
    { title: 'Index fund, low fee', inputs: { start: 0, monthly: 500, stepUp: 0, ret: 7, fee: 0.05, years: 30 }, explain: (r) => `A 0.05% fee costs only ${r.rows![2].value} over 30 years.` },
    { title: 'Same plan, 1% fee', inputs: { start: 0, monthly: 500, stepUp: 0, ret: 7, fee: 1, years: 30 }, explain: (r) => `A 1% fee costs ${r.rows![2].value} — the same contributions, much less money.` },
    { title: 'SIP with 10% annual top-up', inputs: { start: 0, monthly: 200, stepUp: 10, ret: 10, fee: 0.5, years: 20 }, explain: (r) => `Raising the SIP 10% a year builds ${r.primary.value} from a small start.` },
  ],
  analysis() {
    const fees = [0.05, 0.25, 0.5, 1, 1.5, 2];
    const base = { start: 0, monthly: 500, stepUp: 0, ret: 7, years: 30 };
    const gross = invest({ ...base, fee: 0 }).at(-1)!.balance;
    const lost = fees.map((f) => gross - invest({ ...base, fee: f }).at(-1)!.balance);
    const ages = [25, 30, 35, 40, 45];
    const at65 = ages.map((a) => invest({ start: 0, monthly: 500, stepUp: 0, ret: 7, fee: 0.2, years: 65 - a }).at(-1)!.balance);
    const steps = [0, 3, 5, 10];
    const stepEnd = steps.map((s) => invest({ start: 0, monthly: 300, stepUp: s, ret: 8, fee: 0.3, years: 25 }).at(-1)!.balance);
    return [
      {
        title: 'What fund fees cost over 30 years',
        insight: `On $500 a month at 7% for 30 years, a 1% fee costs <strong>${usd(lost[3])}</strong> compared with no fee — about ${pct((lost[3] / gross) * 100, 0)} of the final balance. A 0.05% index fund costs ${usd(lost[0])}.`,
        chart: { type: 'bar', title: 'Money lost to fees by expense ratio', x: fees.map((f) => f + '%'), series: [{ name: 'Lost to fees', values: lost }], y: 'usd', xTitle: 'Annual fee' },
      },
      {
        title: 'The cost of waiting to start',
        insight: `$500 a month at 7% from age 25 reaches about <strong>${usd(at65[0])}</strong> by 65. Starting at 35 gives ${usd(at65[2])}, and at 45 just ${usd(at65[4])}. Each decade of delay roughly halves the outcome.`,
        chart: { type: 'bar', title: 'Balance at 65 by starting age ($500/month, 7%)', x: ages.map((a) => 'Age ' + a), series: [{ name: 'Balance at 65', values: at65 }], y: 'usd', xTitle: 'Starting age' },
      },
      {
        title: 'Step-ups beat bigger starting amounts',
        insight: `Starting at $300 a month and raising it 5% a year ends at ${usd(stepEnd[2])} after 25 years (8% return), versus ${usd(stepEnd[0])} with no increases. A 10% step-up reaches <strong>${usd(stepEnd[3])}</strong>.`,
        stats: steps.map((s, i) => ({ label: `${s}% yearly step-up`, value: usd(stepEnd[i]) })),
      },
    ];
  },
  variantQs: [
    { q: 'Can I use this as a SIP calculator?', a: 'Yes. A Systematic Investment Plan is a fixed monthly investment, and a “step-up SIP” raises it each year — both are modeled here. Enter amounts in your own currency; the math is the same.' },
    { q: 'How do I calculate investment returns?', a: 'Use the expected annual return of your asset mix. Historical stock market averages are higher than bonds or cash but come with large year-to-year swings; the ±2% scenarios show a range.' },
  ],
  tips: [
    'Model several return rates — the chart’s three lines are a reminder that results are a range.',
    'Check your fund’s expense ratio on its fact sheet; small differences compound for decades.',
    'Automate contributions and step-ups so increases happen without a decision each year.',
    'Use tax-advantaged accounts (401(k), IRA, HSA) where possible so taxes don’t interrupt compounding.',
  ],
  faqs: [
    { q: 'What rate of return should I use?', a: 'For a diversified stock portfolio, many planners use 5–7% after inflation or 7–10% before it. For bonds or cash, use much lower figures. Always test a lower-return scenario.' },
    { q: 'How much will $500 a month be worth in 30 years?', a: `At a 7% annual return with no fees, about ${usd(invest({ start: 0, monthly: 500, stepUp: 0, ret: 7, fee: 0, years: 30 }).at(-1)!.balance)}. You would have contributed $180,000.` },
    { q: 'Are investment returns guaranteed?', a: 'No. Investments can lose value, and real returns vary every year. This calculator uses a steady average for planning only.' },
    { q: 'What is an expense ratio?', a: 'The annual fee a fund charges, expressed as a percentage of your balance. A 0.5% expense ratio costs $5 a year per $1,000 invested, every year.' },
    { q: 'Does this include inflation?', a: 'No — results are in future dollars. Use a lower “real” return (for example 7% − 2.5% inflation ≈ 4.5%) to see values in today’s money, or try our inflation calculator.' },
  ],
  sources: [
    { label: 'SEC Investor.gov – Mutual fund fees and expenses', url: 'https://www.investor.gov/introduction-investing/investing-basics/glossary/mutual-fund-fees-and-expenses' },
    { label: 'FINRA – Fund Analyzer', url: 'https://tools.finra.org/fund_analyzer/' },
  ],
  related: ['compound-interest-calculator', 'inflation-calculator', 'cd-calculator', 'rmd-calculator', 'paycheck-calculator'],
  disclaimer: 'finance',
};
export default calc;
