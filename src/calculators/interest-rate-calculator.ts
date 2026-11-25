import { pmt } from '../lib/math';
import { usd, usd2, pct } from '../lib/format';
import type { Calculator } from '../lib/types';

/** Annual rate (%) that makes a loan of `principal` cost `payment` per month for `months` months. NaN if impossible. */
export function rateFromPayment(principal: number, payment: number, months: number): number {
  if (!(principal > 0 && payment > 0 && months > 0)) return NaN;
  if (payment * months < principal - 1e-9) return NaN; // would need a negative rate
  if (Math.abs(payment * months - principal) < 1e-9) return 0;
  let lo = 0,
    hi = 1000;
  if (pmt(principal, hi, months) < payment) return NaN;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (pmt(principal, mid, months) < payment) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Compound annual growth rate (%) from a start value to an end value over `years`. */
export const cagr = (start: number, end: number, years: number) => (Math.pow(end / start, 1 / years) - 1) * 100;

const calc: Calculator = {
  slug: 'interest-rate-calculator',
  name: 'Interest Rate Calculator',
  short: 'Interest Rate',
  category: 'finance',
  keyword: 'interest rate calculator',
  volume: 60500,
  variants: ['what is my interest rate', 'find interest rate from payment', 'loan rate calculator', 'cagr calculator', 'rate of return calculator'],
  title: 'Interest Rate Calculator – Find the Rate from Your Payment',
  description:
    'Find the real interest rate on a loan from the amount, monthly payment and term, or the annual growth rate between two values. Shows APR, APY and total interest.',
  accent: 'the rate they didn’t say',
  icon: 'r%',
  inputs: [
    {
      id: 'mode',
      label: 'What do you want to find?',
      type: 'select',
      default: 'loan',
      options: [
        { value: 'loan', label: 'Rate on a loan (from the payment)' },
        { value: 'growth', label: 'Growth rate between two values (CAGR)' },
      ],
    },
    { id: 'amount', label: 'Loan amount', type: 'number', default: 25000, min: 1, step: 500, prefix: '$', showIf: { field: 'mode', in: ['loan'] } },
    { id: 'payment', label: 'Monthly payment', type: 'number', default: 495, min: 1, step: 5, prefix: '$', showIf: { field: 'mode', in: ['loan'] } },
    { id: 'months', label: 'Loan term', type: 'number', default: 60, min: 1, max: 480, step: 1, suffix: 'months', showIf: { field: 'mode', in: ['loan'] } },
    { id: 'start', label: 'Starting value', type: 'number', default: 10000, min: 0.01, step: 100, prefix: '$', showIf: { field: 'mode', in: ['growth'] } },
    { id: 'end', label: 'Ending value', type: 'number', default: 18000, min: 0.01, step: 100, prefix: '$', showIf: { field: 'mode', in: ['growth'] } },
    { id: 'years', label: 'Years between them', type: 'number', default: 6, min: 0.1, max: 100, step: 0.5, suffix: 'years', showIf: { field: 'mode', in: ['growth'] } },
  ],
  compute(v) {
    if (v.mode === 'growth') {
      const s = +v.start,
        e = +v.end,
        y = +v.years;
      if (!(s > 0 && e > 0 && y > 0)) return { primary: { label: '', value: '' }, error: 'Enter positive starting and ending values and a time period.' };
      const r = cagr(s, e, y);
      const pts = Array.from({ length: Math.ceil(y) + 1 }, (_, i) => Math.min(i, y));
      return {
        primary: { label: 'Annual growth rate (CAGR)', value: pct(r, 3) },
        rows: [
          { label: 'Total change', value: pct((e / s - 1) * 100, 2) },
          { label: 'Simple average per year', value: pct(((e / s - 1) * 100) / y, 3) },
          { label: 'Monthly equivalent', value: pct((Math.pow(1 + r / 100, 1 / 12) - 1) * 100, 4) },
          { label: 'Years to double at this rate', value: r > 0 ? (Math.log(2) / Math.log(1 + r / 100)).toFixed(1) + ' years' : 'never' },
        ],
        chart: { type: 'line', title: 'Steady growth path at the CAGR', x: pts.map((p) => +p.toFixed(1)), series: [{ name: 'Value', values: pts.map((p) => s * Math.pow(1 + r / 100, p)) }], y: 'usd', xTitle: 'Year' },
        steps: [`CAGR = (end ÷ start)^(1 ÷ years) − 1`, `= (${usd(e)} ÷ ${usd(s)})^(1 ÷ ${y}) − 1`, `= ${pct(r, 3)}`],
      };
    }
    const P = +v.amount,
      M = +v.payment,
      n = Math.round(+v.months);
    const r = rateFromPayment(P, M, n);
    if (!isFinite(r)) {
      if (M * n < P) return { primary: { label: '', value: '' }, error: `The payments add up to ${usd(M * n)}, less than the loan, so no positive rate fits. Check the payment or term.` };
      return { primary: { label: '', value: '' }, error: 'Those numbers imply a rate above 1,000% a year. Check the inputs.' };
    }
    const total = M * n;
    const apy = (Math.pow(1 + r / 1200, 12) - 1) * 100;
    const around = [-2, -1, 0, 1, 2].map((d) => Math.max(0, r + d));
    return {
      primary: { label: 'Annual interest rate (APR)', value: pct(r, 3) },
      rows: [
        { label: 'Monthly rate', value: pct(r / 12, 4) },
        { label: 'Effective annual rate (APY)', value: pct(apy, 3) },
        { label: 'Total of payments', value: usd2(total) },
        { label: 'Total interest', value: usd2(total - P) },
        { label: 'Interest as a share of the loan', value: pct(((total - P) / P) * 100, 1) },
      ],
      table: { head: ['Rate', 'Monthly payment', 'Total interest'], rows: around.map((x) => [pct(x, 2), usd2(pmt(P, x, n)), usd2(pmt(P, x, n) * n - P)]) },
      chart: { type: 'bar', title: 'Payment at nearby rates', x: around.map((x) => pct(x, 1)), series: [{ name: 'Monthly payment', values: around.map((x) => pmt(P, x, n)) }], y: 'usd2', markIndex: 2 },
      steps: [`Solve ${usd2(M)} = ${usd(P)} × i ÷ (1 − (1 + i)^−${n}) for i`, `Bisection gives i = ${pct(r / 12, 5)} per month`, `Annual rate = i × 12 = ${pct(r, 3)}`],
    };
  },
  answer: {
    text: (r) =>
      `A <strong>$25,000</strong> loan repaid at <strong>$495 a month</strong> for 60 months has an interest rate of <strong>${r.primary.value}</strong> a year. You repay ${r.rows![2].value} in total, of which ${r.rows![3].value} is interest. A dealer or lender may quote only the payment, and this tells you the rate behind it.`,
  },
  intro: [
    'An interest rate calculator works backwards. You enter what you know, such as the loan amount, the monthly payment and the term, and it finds the interest rate those numbers imply. It is useful when a car dealer, furniture store or buy-now-pay-later offer quotes a payment but not a rate.',
    'There is no algebraic formula for the rate in the loan equation, so the calculator solves it numerically. It also has a second mode for investments: the compound annual growth rate (CAGR) between a starting and an ending value.',
  ],
  formula: {
    expr: 'Loan:   M = P × i ÷ (1 − (1 + i)^−n)   → solve for i\nAPR = 12 × i      APY = (1 + i)^12 − 1\nGrowth: CAGR = (End ÷ Start)^(1/years) − 1',
    vars: [
      ['M', 'monthly payment'],
      ['P', 'amount borrowed'],
      ['i', 'monthly interest rate'],
      ['n', 'number of monthly payments'],
    ],
    notes: ['If the payment includes fees or add-ons, such as GAP insurance or an extended warranty, the rate you find is the true cost of the whole package. That is usually higher than the advertised rate.'],
  },
  examples: [
    { title: 'Car dealer’s payment quote', inputs: { mode: 'loan', amount: 32000, payment: 640, months: 60 }, explain: (r) => `Implied rate ${r.primary.value}; interest ${r.rows![3].value}.` },
    { title: '“Low monthly payment” sofa', inputs: { mode: 'loan', amount: 2400, payment: 125, months: 24 }, explain: (r) => `That is ${r.primary.value} a year.` },
    { title: 'House bought for $250k, now $410k after 9 years', inputs: { mode: 'growth', start: 250000, end: 410000, years: 9 }, explain: (r) => `${r.primary.value} a year compound growth.` },
  ],
  analysis() {
    const quotes = [450, 475, 500, 525, 550, 575];
    const rates = quotes.map((q) => rateFromPayment(25000, q, 60));
    return [
      {
        title: 'Small payment changes hide big rate changes',
        insight: `On a $25,000, 60-month loan, a payment of $450 means about <strong>${pct(rates[0], 1)}</strong>, while $550 means <strong>${pct(rates[4], 1)}</strong>. Each extra $25 a month adds roughly 2 percentage points to the rate. When comparing offers, always convert the payment back to a rate, and never compare only the monthly amount.`,
        chart: { type: 'line', title: 'Implied rate for each payment ($25,000 over 60 months)', x: quotes.map((q) => '$' + q), series: [{ name: 'APR', values: rates }], y: 'pct' },
      },
      {
        title: 'CAGR vs the simple average return',
        insight: 'An investment that rises 50% and then falls 50% has a simple average return of 0%, but you lose 25% of your money. CAGR reports the steady yearly rate that gives the same end result, so it is the honest figure to compare.',
        table: { head: ['Year', 'Return', 'Value of $100'], rows: [['Start', '—', '$100'], ['1', '+50%', '$150'], ['2', '−50%', '$75'], ['Average', '0%', ''], ['CAGR', pct(cagr(100, 75, 2), 1), '']] },
      },
    ];
  },
  variantQs: [
    { q: 'How do I find the interest rate on my loan?', a: 'Enter the amount borrowed, the monthly payment and the number of months. The calculator finds the annual rate that makes those numbers match.' },
    { q: 'Is this a CAGR calculator?', a: 'Yes. Switch the mode to “Growth rate between two values” and enter a starting value, an ending value and the years between them.' },
    { q: 'What is the difference between APR and APY?', a: 'APR is the yearly rate without compounding: 12 × the monthly rate. APY includes compounding, so 12% APR compounded monthly is 12.68% APY.' },
  ],
  tips: [
    'Ask any lender for the APR in writing. US law (the Truth in Lending Act) requires it to be disclosed.',
    'Subtract any down payment and trade-in before entering the loan amount.',
    'If the implied rate is far above the advertised rate, fees or add-ons have been built into the payment.',
  ],
  faqs: [
    { q: 'Can I calculate an interest rate without a formula?', a: 'Not exactly. The loan equation cannot be rearranged for the rate, so calculators and spreadsheets (Excel’s RATE function) solve it by trial and error. This page uses bisection, which always converges.' },
    { q: 'What is a good interest rate on a car loan?', a: 'It depends on your credit and the market. Borrowers with excellent credit usually get the lowest rates, while subprime rates can be several times higher. Check credit unions and banks before accepting dealer financing.' },
    { q: 'What does “0% financing” mean?', a: 'The payments add up to exactly the price, so the rate is zero. Check whether a cash rebate is lost by taking 0%. If it is, the effective rate is not zero.' },
    { q: 'How is CAGR different from average return?', a: 'Average return adds the yearly returns and divides by the years. CAGR is the constant rate that turns the start value into the end value. It is always equal to or lower than the average.' },
  ],
  sources: [
    { label: 'CFPB – What is the difference between a loan’s interest rate and APR?', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-the-difference-between-a-loan-interest-rate-and-the-apr-en-733/' },
    { label: 'Microsoft – RATE function', url: 'https://support.microsoft.com/en-us/office/rate-function-9f665657-4a7e-4bb7-a030-83fc59e748ce' },
  ],
  related: ['loan-calculator', 'auto-loan-calculator', 'finance-calculator', 'payment-calculator', 'interest-calculator'],
  disclaimer: 'finance',
};
export default calc;
