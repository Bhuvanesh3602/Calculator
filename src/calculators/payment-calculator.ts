import { amortize, pmt, sum } from '../lib/math';
import { usd, usd2 } from '../lib/format';
import type { Calculator } from '../lib/types';

/** Months to repay a balance with a fixed payment (Infinity if payment <= interest). */
export function monthsToPay(balance: number, ratePct: number, payment: number) {
  const r = ratePct / 100 / 12;
  if (payment <= balance * r) return Infinity;
  if (r === 0) return balance / payment;
  return -Math.log(1 - (balance * r) / payment) / Math.log(1 + r);
}

const calc: Calculator = {
  slug: 'payment-calculator',
  name: 'Payment Calculator',
  short: 'Payment',
  category: 'finance',
  keyword: 'payment calculator',
  volume: 673000,
  variants: ['monthly payment calculator', 'payment calculator automotive', 'how long to pay off', 'payoff calculator'],
  title: 'Payment Calculator – Monthly Payment or Time to Pay Off',
  description:
    'Find the monthly payment for any balance, or enter a fixed payment to see exactly how many months it takes to pay off and how much interest you will pay.',
  accent: 'two ways round',
  icon: '↻',
  inputs: [
    {
      id: 'mode',
      label: 'Calculate',
      type: 'select',
      default: 'payment',
      options: [
        { value: 'payment', label: 'Monthly payment (fixed term)' },
        { value: 'time', label: 'Time to pay off (fixed payment)' },
      ],
    },
    { id: 'balance', label: 'Balance or loan amount', type: 'number', default: 12000, min: 0, step: 100, prefix: '$' },
    { id: 'rate', label: 'Interest rate (APR)', type: 'number', default: 8, min: 0, step: 0.1, suffix: '%' },
    { id: 'months', label: 'Term', type: 'number', default: 36, min: 1, step: 1, suffix: 'months', showIf: { field: 'mode', in: ['payment'] } },
    { id: 'payment', label: 'Monthly payment', type: 'number', default: 400, min: 0, step: 10, prefix: '$', showIf: { field: 'mode', in: ['time'] } },
  ],
  compute(v) {
    const B = +v.balance,
      rate = +v.rate;
    if (!(B > 0)) return { primary: { label: '', value: '' }, error: 'Enter a balance above $0.' };
    let pay: number, n: number;
    if (v.mode === 'time') {
      pay = +v.payment;
      n = monthsToPay(B, rate, pay);
      if (!isFinite(n))
        return {
          primary: { label: '', value: '' },
          error: `A payment of ${usd2(pay)} does not cover the monthly interest of ${usd2((B * rate) / 1200)}. The balance would never fall — raise the payment.`,
        };
      n = Math.ceil(n - 1e-9);
    } else {
      n = Math.round(+v.months);
      pay = pmt(B, rate, n);
    }
    const s = amortize(B, rate, n, v.mode === 'time' ? Math.max(0, pay - pmt(B, rate, n)) : 0);
    const interest = sum(s.map((r) => r.interest));
    return {
      primary: v.mode === 'time' ? { label: 'Paid off in', value: `${s.length} months` } : { label: 'Monthly payment', value: usd2(pay) },
      rows: [
        v.mode === 'time' ? { label: 'That is', value: `${Math.floor(s.length / 12)} yrs ${s.length % 12} mo` } : { label: 'Number of payments', value: String(n) },
        { label: 'Total interest', value: usd(interest) },
        { label: 'Total paid', value: usd(B + interest) },
        { label: 'Interest as % of balance', value: ((interest / B) * 100).toFixed(1) + '%' },
      ],
      chart: {
        type: 'area',
        title: 'Balance paid down over time',
        x: s.map((r) => 'Mo ' + r.month),
        series: [{ name: 'Remaining balance', values: s.map((r) => r.balance) }],
        y: 'usd',
        xTitle: 'Month',
      },
    };
  },
  answer: {
    text: (r, v) =>
      `To repay <strong>$${(+v.balance).toLocaleString('en-US')}</strong> at ${v.rate}% in ${v.months} months you need to pay <strong>${r.primary.value} a month</strong>. You would pay ${r.rows![1].value} in interest. Flip the mode to enter a payment instead and see how many months it takes.`,
  },
  intro: [
    'This payment calculator answers the two questions people ask about any balance: “what will my monthly payment be?” and “if I pay this much, when will I be done?”. It works for car loans, personal loans, credit card balances and money owed to family.',
    'In “time to pay off” mode it also warns you when a payment is too small to beat the interest — the trap behind minimum credit-card payments.',
  ],
  formula: {
    expr: 'Payment = B × r / (1 − (1 + r)^−n)\nMonths  n = −ln(1 − B·r / Payment) / ln(1 + r)',
    vars: [
      ['B', 'starting balance'],
      ['r', 'monthly rate = APR ÷ 12'],
      ['n', 'number of months'],
    ],
    notes: ['If Payment ≤ B × r, the log has no solution: interest grows as fast as you pay, so the balance never reaches zero.'],
  },
  examples: [
    { title: 'Credit card at 24%', inputs: { mode: 'time', balance: 5000, rate: 24, payment: 150 }, explain: (r) => `At $150 a month the card takes ${r.rows![0].value} and costs ${r.rows![1].value} in interest.` },
    { title: 'Same card, $300 a month', inputs: { mode: 'time', balance: 5000, rate: 24, payment: 300 }, explain: (r) => `Doubling the payment more than halves the time and cuts interest to ${r.rows![1].value}.` },
    { title: 'Used car, 48 months', inputs: { mode: 'payment', balance: 18000, rate: 8.5, months: 48 }, explain: (r) => `Total interest over four years: ${r.rows![1].value}.` },
  ],
  analysis() {
    const pays = [110, 125, 150, 200, 250, 300, 400, 500];
    const months = pays.map((p) => Math.ceil(monthsToPay(5000, 22, p)));
    const ints = pays.map((p, i) => p * months[i] - 5000);
    const rates = [0, 5, 10, 15, 20, 25];
    const pay36 = rates.map((r) => pmt(10000, r, 36));
    return [
      {
        title: 'The minimum-payment trap on a $5,000 card balance',
        insight: `At 22% APR, paying $110 a month takes <strong>${months[0]} months</strong> (${(months[0] / 12).toFixed(1)} years) and costs about ${usd(ints[0])} in interest. Paying $300 clears it in ${months[5]} months for roughly ${usd(ints[5])}. Small increases near the minimum save the most.`,
        chart: {
          type: 'bar',
          title: 'Months to pay off $5,000 at 22% by monthly payment',
          x: pays.map((p) => '$' + p),
          series: [{ name: 'Months to pay off', values: months }],
          y: 'int',
          xTitle: 'Monthly payment',
        },
        table: { head: ['Payment', 'Months', 'Approx. interest'], rows: pays.map((p, i) => ['$' + p, months[i], usd(ints[i])]) },
      },
      {
        title: 'How APR moves a 36-month payment',
        insight: `On $10,000 over 36 months, each 5 points of APR adds about ${usd((pay36[5] - pay36[0]) / 5)} to the payment. At 0% you pay ${usd2(pay36[0])}; at 25% you pay ${usd2(pay36[5])}.`,
        chart: { type: 'line', title: 'Monthly payment on $10k over 36 months by APR', x: rates.map((r) => r + '%'), series: [{ name: 'Payment', values: pay36 }], y: 'usd', xTitle: 'APR' },
      },
    ];
  },
  variantQs: [
    { q: 'Can I use this as an automotive payment calculator?', a: 'Yes. Enter the amount you will finance after down payment and trade-in. For sales tax, fees and trade-in handling, use our dedicated auto loan calculator.' },
    { q: 'How do I calculate how long it will take to pay off a balance?', a: 'Choose “Time to pay off”, enter the balance, APR and the amount you can pay monthly. The calculator solves the number of months with the logarithm formula above.' },
  ],
  tips: [
    'Round your payment up to the next $25 or $50 — the extra goes straight to principal.',
    'Pay high-APR balances first (the “avalanche” method) to minimize total interest.',
    'If a payment barely beats the interest, consider a 0% balance transfer or a lower-rate consolidation loan.',
  ],
  faqs: [
    { q: 'How do I calculate a monthly payment?', a: 'Multiply the balance by the monthly rate, then divide by 1 − (1 + monthly rate)^−months. For $12,000 at 8% over 36 months that gives about ' + usd2(pmt(12000, 8, 36)) + '.' },
    { q: 'Why does my balance barely move?', a: 'When most of your payment covers interest, little is left for principal. This is common with high-APR credit cards and minimum payments.' },
    { q: 'Does paying twice a month help?', a: 'Yes, slightly: paying earlier reduces the average balance that interest is charged on, and making 26 half-payments a year adds one extra full payment.' },
    { q: 'What APR should I enter for a credit card?', a: 'Use the purchase APR printed on your statement. If you have a promotional rate, use the rate that applies after the promotion ends.' },
  ],
  sources: [{ label: 'CFPB – Credit card minimum payment warning', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-a-minimum-payment-on-a-credit-card-en-41/' }],
  related: ['loan-calculator', 'auto-loan-calculator', 'amortization-calculator', 'mortgage-calculator'],
  disclaimer: 'finance',
};
export default calc;
