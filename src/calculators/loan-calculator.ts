import { amortize, pmt, sum } from '../lib/math';
import { usd, usd2, pct } from '../lib/format';
import type { Calculator } from '../lib/types';

/** APR including upfront fees: solve rate where pmt(amount - fees) == actual payment. */
export function aprWithFees(amount: number, ratePct: number, months: number, fees: number) {
  const pay = pmt(amount, ratePct, months);
  const net = amount - fees;
  if (fees <= 0) return ratePct;
  let lo = 0,
    hi = 200;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (pmt(net, mid, months) < pay) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
/** Max principal a payment supports. */
export function principalFor(payment: number, ratePct: number, months: number) {
  const r = ratePct / 100 / 12;
  if (r === 0) return payment * months;
  return (payment * (1 - Math.pow(1 + r, -months))) / r;
}

const calc: Calculator = {
  slug: 'loan-calculator',
  name: 'Loan Calculator',
  short: 'Loan',
  category: 'finance',
  keyword: 'loan calculator',
  volume: 673000,
  variants: ['lending calculator', 'lender loan calculator', 'loan and calculator', 'personal loan calculator', 'how much can I borrow'],
  title: 'Loan Calculator – Monthly Payment, True APR & Borrowing Power',
  description:
    'Calculate any loan’s monthly payment and total interest, see the true APR once fees are included, or work backwards to find how much you can afford to borrow.',
  accent: 'with the true APR',
  icon: '$',
  inputs: [
    {
      id: 'mode',
      label: 'I want to find',
      type: 'select',
      default: 'payment',
      options: [
        { value: 'payment', label: 'My monthly payment' },
        { value: 'borrow', label: 'How much I can borrow' },
      ],
    },
    { id: 'amount', label: 'Loan amount', type: 'number', default: 20000, min: 0, step: 500, prefix: '$', showIf: { field: 'mode', in: ['payment'] } },
    { id: 'budget', label: 'Monthly payment I can afford', type: 'number', default: 450, min: 0, step: 10, prefix: '$', showIf: { field: 'mode', in: ['borrow'] } },
    { id: 'rate', label: 'Interest rate', type: 'number', default: 9.5, min: 0, step: 0.1, suffix: '%' },
    { id: 'months', label: 'Term', type: 'number', default: 60, min: 1, max: 480, step: 1, suffix: 'months' },
    { id: 'fee', label: 'Origination fee', type: 'number', default: 3, min: 0, max: 15, step: 0.25, suffix: '% of loan', help: 'Deducted from the money you receive.' },
  ],
  compute(v) {
    const rate = +v.rate,
      n = Math.round(+v.months);
    if (!(n > 0)) return { primary: { label: '', value: '' }, error: 'Enter a term of at least 1 month.' };
    const amount = v.mode === 'borrow' ? principalFor(+v.budget, rate, n) : +v.amount;
    if (!(amount > 0)) return { primary: { label: '', value: '' }, error: 'Enter an amount above $0.' };
    const pay = pmt(amount, rate, n);
    const fees = (amount * (+v.fee || 0)) / 100;
    const s = amortize(amount, rate, n);
    const interest = sum(s.map((r) => r.interest));
    const apr = aprWithFees(amount, rate, n, fees);
    const rows = [
      { label: 'Monthly payment', value: usd2(pay) },
      { label: 'Total interest', value: usd(interest) },
      { label: 'Origination fee', value: usd(fees) },
      { label: 'Cash you receive', value: usd(amount - fees) },
      { label: 'Total cost of borrowing', value: usd(interest + fees) },
      { label: 'APR including fees', value: pct(apr, 2) },
    ];
    return {
      primary: v.mode === 'borrow' ? { label: 'You can borrow about', value: usd(amount) } : { label: 'Monthly payment', value: usd2(pay) },
      rows: v.mode === 'borrow' ? rows : rows.slice(1),
      chart: {
        type: 'donut',
        title: 'Where your money goes',
        x: ['Principal', 'Interest', 'Fees'],
        series: [{ name: 'Amount', values: [amount, interest, fees] }],
        y: 'usd',
      },
    };
  },
  answer: {
    text: (r, v) =>
      `Borrowing <strong>$${(+v.amount).toLocaleString('en-US')}</strong> at ${v.rate}% for ${v.months} months costs <strong>${r.primary.value} a month</strong> and ${r.rows![0].value} in interest. With a ${v.fee}% origination fee, the true cost is an <strong>APR of ${r.rows![4].value}</strong> — that is the number to compare between lenders.`,
  },
  intro: [
    'A loan calculator shows what a fixed-rate installment loan will cost you each month and in total. It works for personal loans, debt consolidation loans, student loans and small business term loans — any loan with equal monthly payments.',
    'Most calculators stop at the payment. This one also folds in origination fees to show the true APR, and it runs in reverse: enter the monthly payment you can afford and it tells you the largest loan that payment supports.',
  ],
  formula: {
    expr: 'Payment = P × r / (1 − (1 + r)^−n)\nMax loan = Payment × (1 − (1 + r)^−n) / r\nAPR: solve for r* where Payment(P − fees, r*) = Payment(P, r)',
    vars: [
      ['P', 'loan amount'],
      ['r', 'monthly interest rate (annual ÷ 12)'],
      ['n', 'number of monthly payments'],
      ['fees', 'upfront fees deducted from the loan'],
    ],
    notes: ['The APR is found numerically (bisection to 0.0001%), the same way regulators define it: the rate at which the cash you actually receive is repaid by your scheduled payments.'],
  },
  examples: [
    { title: 'Debt consolidation', inputs: { amount: 15000, rate: 12, months: 48, fee: 5 }, explain: (r) => `A 5% fee lifts the effective cost to an APR of ${r.rows![4].value}.` },
    { title: 'Fee-free credit union loan', inputs: { amount: 15000, rate: 10.5, months: 48, fee: 0 }, explain: (r) => `With no fee, APR equals the rate. Total interest: ${r.rows![0].value}.` },
    {
      title: 'What can $400 a month borrow?',
      inputs: { mode: 'borrow', budget: 400, rate: 9.5, months: 60, fee: 0 },
      explain: () => `Longer terms raise the borrowing limit, but every extra month adds interest.`,
    },
  ],
  analysis() {
    const amts = [5000, 10000, 25000, 50000];
    const terms = [24, 36, 48, 60, 72];
    const grid = amts.map((a) => terms.map((t) => pmt(a, 10, t)));
    const fees = [0, 1, 3, 5, 8];
    const aprs36 = fees.map((f) => aprWithFees(10000, 10, 36, (10000 * f) / 100));
    const aprs60 = fees.map((f) => aprWithFees(10000, 10, 60, (10000 * f) / 100));
    return [
      {
        title: 'Monthly payment grid at 10% APR',
        insight: `Doubling the term does not halve the payment. A $25,000 loan at 10% costs ${usd(grid[2][0])}/month over 24 months and ${usd(grid[2][4])} over 72 — only ${pct((1 - grid[2][4] / grid[2][0]) * 100, 0)} less per month for three times as many payments.`,
        chart: {
          type: 'line',
          title: 'Monthly payment by loan amount and term at 10%',
          x: terms.map((t) => t + ' mo'),
          series: amts.map((a, i) => ({ name: usd(a), values: grid[i] })),
          y: 'usd',
          xTitle: 'Term',
        },
        table: { head: ['Amount', ...terms.map((t) => t + ' mo')], rows: amts.map((a, i) => [usd(a), ...grid[i].map((p) => usd2(p))]) },
      },
      {
        title: 'Fees hurt short loans the most',
        insight: `A 5% origination fee on a 10% loan raises the APR to <strong>${pct(aprs36[3], 2)}</strong> over 36 months but ${pct(aprs60[3], 2)} over 60, because the fee is spread over fewer payments. On short loans, a lower-fee offer often beats a lower headline rate.`,
        chart: {
          type: 'bar',
          title: 'APR by origination fee, $10k at 10%',
          x: fees.map((f) => f + '% fee'),
          series: [
            { name: '36 months', values: aprs36 },
            { name: '60 months', values: aprs60 },
          ],
          y: 'pct',
          xTitle: 'Origination fee',
        },
      },
    ];
  },
  variantQs: [
    { q: 'Is a lending calculator different from a loan calculator?', a: 'No — “lending calculator”, “lender loan calculator” and “loan calculator” all describe the same maths. Lenders use the amortization formula shown above to set your payment.' },
    { q: 'How much can I borrow with a loan calculator?', a: 'Switch the mode to “How much I can borrow”, enter a monthly payment you are comfortable with, and the calculator solves for the largest principal at your rate and term.' },
    { q: 'Does this work as a personal loan calculator?', a: 'Yes. Personal loans are fixed-rate installment loans, often with an origination fee — which is why the APR line is included.' },
  ],
  tips: [
    'Compare offers by <strong>APR</strong>, not interest rate — APR includes fees.',
    'Check whether the fee is deducted from the loan (you receive less) or added to it (you owe more).',
    'Ask about prepayment penalties before choosing a longer term “just in case”.',
    'A prequalification uses a soft credit check and won’t affect your score; a full application usually will.',
  ],
  faqs: [
    { q: 'How is a loan payment calculated?', a: 'Lenders use P × r / (1 − (1 + r)^−n), where P is the amount, r the monthly rate and n the number of months. The result is a fixed payment that clears the loan exactly on time.' },
    { q: 'What is the difference between interest rate and APR?', a: 'The interest rate is the cost of borrowing the principal. APR adds required fees, such as origination fees, and expresses the total as a yearly rate, so it is the better comparison number.' },
    { q: 'Is a longer loan term better?', a: 'A longer term lowers the monthly payment but increases total interest, and longer-term loans often carry higher rates. Choose the shortest term whose payment fits comfortably.' },
    { q: 'What is a good interest rate on a personal loan?', a: 'It depends heavily on your credit score and income. Get quotes from at least three lenders, including a credit union, and compare APRs on the same term.' },
    { q: 'Can I pay off a loan early?', a: 'Usually yes. Most personal loans have no prepayment penalty, and paying early saves the interest you would have paid on the remaining balance. Confirm in your loan agreement.' },
  ],
  sources: [
    { label: 'CFPB – What is the difference between a loan interest rate and the APR?', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-the-difference-between-a-loan-interest-rate-and-the-apr-en-733/' },
    { label: 'Regulation Z (Truth in Lending), Appendix J – APR computation', url: 'https://www.consumerfinance.gov/rules-policy/regulations/1026/j/' },
  ],
  related: ['payment-calculator', 'amortization-calculator', 'auto-loan-calculator', 'mortgage-calculator', 'compound-interest-calculator'],
  disclaimer: 'finance',
};
export default calc;
