import { usd, usd2, pct } from '../lib/format';
import type { Calculator } from '../lib/types';

export const apyToApr = (apy: number, n: number) => n * (Math.pow(1 + apy / 100, 1 / n) - 1) * 100;
export const aprToApy = (apr: number, n: number) => (Math.pow(1 + apr / 100 / n, n) - 1) * 100;
/** Balance of a CD after m months given APY (compounding already inside APY). */
export const cdValue = (dep: number, apy: number, months: number) => dep * Math.pow(1 + apy / 100, months / 12);

const calc: Calculator = {
  slug: 'cd-calculator',
  name: 'CD Calculator',
  short: 'CD',
  category: 'finance',
  keyword: 'cd calculator',
  volume: 165000,
  variants: ['certificate of deposit calculator', 'cd interest calculator', 'cd rates calculator', 'cd early withdrawal penalty'],
  title: 'CD Calculator – Interest Earned, APY & Early Withdrawal',
  description:
    'Calculate what a certificate of deposit earns by maturity, convert APY and APR, and see what an early withdrawal penalty would cost before you commit.',
  accent: 'before you lock it in',
  icon: '◎',
  inputs: [
    { id: 'deposit', label: 'Deposit', type: 'number', default: 10000, min: 0, step: 500, prefix: '$' },
    { id: 'apy', label: 'APY', type: 'number', default: 4.25, min: 0, max: 20, step: 0.05, suffix: '%' },
    { id: 'months', label: 'Term', type: 'number', default: 12, min: 1, max: 120, step: 1, suffix: 'months' },
    {
      id: 'freq',
      label: 'Compounding (for APR conversion)',
      type: 'select',
      default: '365',
      options: [
        { value: '365', label: 'Daily' },
        { value: '12', label: 'Monthly' },
        { value: '4', label: 'Quarterly' },
        { value: '1', label: 'Annually' },
      ],
    },
    { id: 'penalty', label: 'Early withdrawal penalty', type: 'number', default: 3, min: 0, max: 24, step: 1, suffix: "months' interest" },
    { id: 'exit', label: 'Withdraw early after', type: 'number', default: 6, min: 0, step: 1, suffix: 'months' },
    { id: 'tax', label: 'Your tax rate on interest', type: 'number', default: 22, min: 0, max: 60, step: 1, suffix: '%' },
  ],
  compute(v) {
    const dep = +v.deposit,
      apy = +v.apy,
      m = Math.round(+v.months);
    if (!(dep > 0) || !(m > 0)) return { primary: { label: '', value: '' }, error: 'Enter a deposit and a term.' };
    const fv = cdValue(dep, apy, m);
    const interest = fv - dep;
    const exit = Math.min(Math.max(0, +v.exit || 0), m);
    const earnedAtExit = cdValue(dep, apy, exit) - dep;
    const penalty = dep * (Math.pow(1 + apy / 100, (+v.penalty || 0) / 12) - 1);
    const xs = Array.from({ length: m + 1 }, (_, i) => i);
    return {
      primary: { label: `Value at maturity (${m} months)`, value: usd2(fv) },
      rows: [
        { label: 'Interest earned', value: usd2(interest) },
        { label: 'After-tax interest', value: usd2(interest * (1 - (+v.tax || 0) / 100)) },
        { label: 'Equivalent APR', value: pct(apyToApr(apy, +v.freq), 3) },
        { label: `Interest earned by month ${exit}`, value: usd2(earnedAtExit) },
        { label: 'Penalty if withdrawn then', value: usd2(penalty) },
        { label: 'Net gain if withdrawn then', value: usd2(earnedAtExit - penalty) },
      ],
      note: earnedAtExit - penalty < 0 ? 'Withdrawing at that point would eat into your original deposit.' : undefined,
      chart: {
        type: 'line',
        title: 'Interest earned vs net after early-withdrawal penalty',
        x: xs.map((i) => 'Mo ' + i),
        series: [
          { name: 'Interest earned', values: xs.map((i) => cdValue(dep, apy, i) - dep) },
          { name: 'Net if withdrawn', values: xs.map((i) => (i >= m ? cdValue(dep, apy, i) - dep : cdValue(dep, apy, i) - dep - penalty)) },
        ],
        y: 'usd2',
        xTitle: 'Month',
        markIndex: exit,
      },
    };
  },
  answer: {
    text: (r, v) =>
      `A <strong>$${(+v.deposit).toLocaleString('en-US')}</strong> CD at ${v.apy}% APY for ${v.months} months is worth <strong>${r.primary.value}</strong> at maturity, earning <strong>${r.rows![0].value}</strong>. With a ${v.penalty}-month interest penalty, cashing out after ${v.exit} months would leave you ${r.rows![5].value}.`,
  },
  intro: [
    'A certificate of deposit (CD) pays a fixed rate for a fixed term in exchange for leaving your money untouched. This CD calculator shows your balance at maturity, the interest after tax, and the APR behind the advertised APY.',
    'Its distinctive feature is the early-withdrawal view. Banks charge a penalty measured in months of interest; the chart shows the point at which breaking the CD stops costing you principal, which is the real risk to weigh before choosing a long term.',
  ],
  formula: {
    expr: 'Value = Deposit × (1 + APY)^(months/12)\nAPY = (1 + APR/n)^n − 1\nPenalty ≈ Deposit × ((1 + APY)^(penalty months/12) − 1)',
    vars: [
      ['APY', 'annual percentage yield, already includes compounding'],
      ['APR', 'nominal rate before compounding'],
      ['n', 'compounding periods per year'],
    ],
    notes: ['Some banks calculate penalties on simple interest or on the amount withdrawn; check your account agreement. FDIC insurance covers up to $250,000 per depositor, per insured bank, per ownership category.'],
  },
  examples: [
    { title: '6-month CD', inputs: { deposit: 5000, apy: 4.4, months: 6, exit: 3 }, explain: (r) => `Short terms earn ${r.rows![0].value} — and keep the money available sooner.` },
    { title: '5-year CD', inputs: { deposit: 20000, apy: 4, months: 60, penalty: 12, exit: 12 }, explain: (r) => `Breaking a 5-year CD after a year with a 12-month penalty nets ${r.rows![5].value}.` },
    { title: 'Jumbo CD, 18 months', inputs: { deposit: 100000, apy: 4.3, months: 18 }, explain: (r) => `${r.rows![0].value} of interest, or ${r.rows![1].value} after a 22% tax rate.` },
  ],
  analysis() {
    const apr = 4.2;
    const fs = [
      ['Annually', 1],
      ['Quarterly', 4],
      ['Monthly', 12],
      ['Daily', 365],
    ] as const;
    const apys = fs.map(([, n]) => aprToApy(apr, n));
    const pens = [3, 6, 12];
    const months = Array.from({ length: 25 }, (_, i) => i);
    const series = pens.map((p) => ({
      name: `${p}-mo penalty`,
      values: months.map((i) => cdValue(10000, 4, i) - 10000 - 10000 * (Math.pow(1.04, p / 12) - 1)),
    }));
    const breakEven = pens.map((p) => p); // net turns positive once months held > penalty months
    // Ladder: equal $10k into 1–5 year rungs (hypothetical rates)
    const rungs = [1, 2, 3, 4, 5];
    const ladderRates = [4.2, 4.0, 3.9, 3.9, 4.0];
    return [
      {
        title: 'APR vs APY: why the two numbers differ',
        insight: `A 4.20% APR becomes a ${pct(apys[0], 3)} APY with annual compounding and <strong>${pct(apys[3], 3)}</strong> with daily compounding. Banks advertise APY because it is higher and already includes compounding — so compare CDs on APY.`,
        stats: fs.map(([name], i) => ({ label: `APY, ${name.toLowerCase()} compounding`, value: pct(apys[i], 3) })),
      },
      {
        title: 'When does breaking a CD stop costing principal?',
        insight: `On $10,000 at 4% APY, a 3-month penalty is covered after about ${breakEven[0]} months, but a 12-month penalty takes <strong>${breakEven[2]} months</strong> to earn back. Withdraw before that line crosses zero and you get back less than you deposited.`,
        chart: { type: 'line', title: 'Net gain if withdrawn early, $10k at 4% APY', x: months.map((m) => m + ' mo'), series, y: 'usd', xTitle: 'Months held' },
      },
      {
        title: 'A five-rung CD ladder (illustration)',
        insight: `Splitting $50,000 into five $10,000 CDs maturing in 1–5 years means one rung matures every year, giving regular access to cash while most of the money earns longer-term rates. The rates here are illustrative; enter real quotes above.`,
        table: { head: ['Rung', 'Illustrative APY', 'Value at maturity'], rows: rungs.map((y, i) => [`${y}-year CD`, pct(ladderRates[i], 2), usd(cdValue(10000, ladderRates[i], y * 12))]) },
      },
    ];
  },
  variantQs: [
    { q: 'How does a CD interest calculator work?', a: 'It grows your deposit by the APY for the fraction of a year you hold it: deposit × (1 + APY)^(months ÷ 12). Interest earned is the difference from your deposit.' },
    { q: 'Is a CD calculator useful for comparing CD rates?', a: 'Yes — enter each bank’s APY and term to compare interest in dollars, and check the penalty line before choosing a longer term for a slightly higher rate.' },
  ],
  tips: [
    'Compare CDs by APY and term, then read the early-withdrawal penalty — it varies widely between banks.',
    'No-penalty CDs pay a little less but let you withdraw after a short waiting period.',
    'Interest is taxable as ordinary income in the year it is credited, even if you don’t withdraw it.',
    'Most CDs auto-renew at maturity; set a reminder for the grace period.',
  ],
  faqs: [
    { q: 'How much interest will a $10,000 CD earn?', a: `At 4.25% APY for 12 months, a $10,000 CD earns about ${usd2(cdValue(10000, 4.25, 12) - 10000)}. Over 6 months it earns roughly half that.` },
    { q: 'Can you lose money in a CD?', a: 'Not from market moves — the rate is fixed and deposits are FDIC or NCUA insured up to limits. You can lose part of your principal if an early-withdrawal penalty exceeds the interest earned.' },
    { q: 'What is the difference between APY and APR on a CD?', a: 'APR is the nominal rate; APY includes the effect of compounding over a year. For CDs, APY is the figure to compare.' },
    { q: 'Are CDs better than high-yield savings?', a: 'CDs lock in a rate, which helps if rates fall; savings accounts stay flexible but their rate can change anytime. Many savers keep an emergency fund in savings and longer-term money in CDs.' },
    { q: 'How are CD early withdrawal penalties calculated?', a: 'Most banks charge a set number of months of interest — for example 3 months on short CDs and 6–12 months on longer ones. Check your bank’s schedule.' },
  ],
  sources: [
    { label: 'FDIC – Deposit insurance coverage', url: 'https://www.fdic.gov/resources/deposit-insurance/' },
    { label: 'FDIC – National rates and rate caps', url: 'https://www.fdic.gov/national-rates-and-rate-caps' },
    { label: 'Investor.gov – Certificates of deposit', url: 'https://www.investor.gov/introduction-investing/investing-basics/investment-products/certificates-deposit-cds' },
  ],
  related: ['compound-interest-calculator', 'investment-calculator', 'inflation-calculator', 'percentage-calculator'],
  disclaimer: 'finance',
};
export default calc;
