import { amortize, pmt, sum } from '../lib/math';
import { usd, usd2 } from '../lib/format';
import type { Calculator, Values } from '../lib/types';

function car(v: Values) {
  const price = +v.price,
    taxRate = +v.tax || 0;
  // Most US states tax the price minus trade-in value.
  const taxable = Math.max(0, price - (v.tradeTax === 'yes' ? +v.trade || 0 : 0));
  const salesTax = (taxable * taxRate) / 100;
  const financed = Math.max(0, price + salesTax + (+v.fees || 0) - (+v.down || 0) - (+v.trade || 0) + (+v.owed || 0) - (+v.rebate || 0));
  const n = +v.term;
  const pay = pmt(financed, +v.rate, n);
  const interest = sum(amortize(financed, +v.rate, n).map((r) => r.interest));
  return { salesTax, financed, pay, interest, n };
}

const calc: Calculator = {
  slug: 'auto-loan-calculator',
  name: 'Auto Loan Calculator',
  short: 'Auto Loan',
  category: 'finance',
  keyword: 'auto loan calculator',
  volume: 673000,
  variants: ['car loan calculator', 'vehicle loan calculator', 'car payment calculator', 'financing a car calculator', 'automobile loan calculator'],
  title: 'Auto Loan Calculator – Car Payment with Tax, Trade-In & Fees',
  description:
    'Work out your car payment with sales tax, trade-in, rebates, fees and negative equity. Compare 36- to 84-month terms and see the total cost of each.',
  accent: 'with tax & trade-in',
  icon: '🚗',
  inputs: [
    { id: 'price', label: 'Vehicle price', type: 'number', default: 35000, min: 0, step: 500, prefix: '$' },
    { id: 'down', label: 'Cash down', type: 'number', default: 4000, min: 0, step: 500, prefix: '$' },
    { id: 'trade', label: 'Trade-in value', type: 'number', default: 0, min: 0, step: 500, prefix: '$' },
    { id: 'owed', label: 'Owed on trade-in', type: 'number', default: 0, min: 0, step: 500, prefix: '$', help: 'Negative equity is rolled into the new loan.' },
    { id: 'rate', label: 'APR', type: 'number', default: 7.5, min: 0, step: 0.1, suffix: '%' },
    {
      id: 'term',
      label: 'Term',
      type: 'select',
      default: '60',
      options: ['36', '48', '60', '72', '84'].map((m) => ({ value: m, label: m + ' months' })),
    },
    { id: 'tax', label: 'Sales tax rate', type: 'number', default: 6.5, min: 0, max: 15, step: 0.05, suffix: '%' },
    {
      id: 'tradeTax',
      label: 'Trade-in reduces taxable price?',
      type: 'select',
      default: 'yes',
      options: [
        { value: 'yes', label: 'Yes (most states)' },
        { value: 'no', label: 'No' },
      ],
    },
    { id: 'fees', label: 'Title, registration & dealer fees', type: 'number', default: 900, min: 0, step: 50, prefix: '$' },
    { id: 'rebate', label: 'Cash rebate', type: 'number', default: 0, min: 0, step: 250, prefix: '$' },
  ],
  compute(v) {
    if (!(+v.price > 0)) return { primary: { label: '', value: '' }, error: 'Enter the vehicle price.' };
    const c = car(v);
    const terms = [36, 48, 60, 72, 84];
    return {
      primary: { label: 'Monthly car payment', value: usd2(c.pay) },
      rows: [
        { label: 'Amount financed', value: usd(c.financed) },
        { label: 'Sales tax', value: usd(c.salesTax) },
        { label: 'Total interest', value: usd(c.interest) },
        { label: 'Total cost (all payments + down)', value: usd(c.pay * c.n + (+v.down || 0)) },
      ],
      chart: {
        type: 'bar',
        title: 'Total interest by term at your APR',
        x: terms.map((t) => t + ' mo'),
        series: [{ name: 'Total interest', values: terms.map((t) => pmt(c.financed, +v.rate, t) * t - c.financed) }],
        y: 'usd',
        xTitle: 'Loan term',
        markIndex: terms.indexOf(c.n),
      },
      table: {
        head: ['Term', 'Monthly payment', 'Total interest'],
        rows: terms.map((t) => [t + ' months', usd2(pmt(c.financed, +v.rate, t)), usd(pmt(c.financed, +v.rate, t) * t - c.financed)]),
      },
    };
  },
  answer: {
    text: (r, v) =>
      `A <strong>$${(+v.price).toLocaleString('en-US')}</strong> car with $${(+v.down).toLocaleString('en-US')} down, ${v.tax}% sales tax and $${v.fees} in fees means financing ${r.rows![0].value}. At ${v.rate}% APR over ${v.term} months, the payment is <strong>${r.primary.value}</strong> and interest totals <strong>${r.rows![2].value}</strong>.`,
  },
  intro: [
    'An auto loan calculator estimates your monthly car payment from the vehicle price, down payment, trade-in, sales tax, fees and the loan’s APR and term. Dealers often quote a payment first; working it out yourself shows what is really inside that number.',
    'Ours handles the details that change the amount financed: tax on the price after trade-in (the rule in most states), negative equity rolled over from your old car, rebates and dealer fees. The chart shows how much more interest you pay as the term gets longer.',
  ],
  formula: {
    expr: 'Sales tax = (Price − Trade-in*) × tax rate\nFinanced = Price + Tax + Fees − Down − Trade-in + Owed − Rebate\nPayment = Financed × r / (1 − (1 + r)^−n)',
    vars: [
      ['*', 'trade-in is deducted before tax only where your state allows it'],
      ['r', 'monthly rate = APR ÷ 12'],
      ['n', 'term in months'],
      ['Owed', 'payoff on your trade-in; anything above its value is negative equity'],
    ],
  },
  examples: [
    { title: 'New SUV, 72 months', inputs: { price: 42000, down: 5000, rate: 7, term: '72' }, explain: (r) => `A long term lowers the payment but interest reaches ${r.rows![2].value}.` },
    { title: 'Used sedan, 48 months', inputs: { price: 22000, down: 3000, rate: 9.5, term: '48', fees: 600 }, explain: (r) => `Higher used-car APR, but a shorter term keeps interest at ${r.rows![2].value}.` },
    {
      title: 'Trading in with $3,000 negative equity',
      inputs: { price: 35000, down: 2000, trade: 12000, owed: 15000, rate: 7.5, term: '60' },
      explain: (r) => `The $3,000 you still owe is added to the loan, so you finance ${r.rows![0].value}.`,
    },
  ],
  analysis() {
    const fin = 32000;
    const terms = [36, 48, 60, 72, 84];
    const pays = terms.map((t) => pmt(fin, 7.5, t));
    const ints = terms.map((t, i) => pays[i] * t - fin);
    const balAt36 = terms.map((t) => {
      const s = amortize(fin, 7.5, t);
      return t <= 36 ? 0 : s[35].balance;
    });
    return [
      {
        title: 'Longer terms: lower payment, much more interest',
        insight: `Financing $32,000 at 7.5%, stretching from 48 to 84 months cuts the payment by ${usd(pays[1] - pays[4])} a month but adds <strong>${usd(ints[4] - ints[1])}</strong> in interest. And lenders usually charge higher APRs on longer terms, so the real gap is often wider.`,
        chart: {
          type: 'bar',
          title: 'Total interest on $32k at 7.5% by term',
          x: terms.map((t) => t + ' mo'),
          series: [{ name: 'Total interest', values: ints }],
          y: 'usd',
          xTitle: 'Term',
        },
        table: { head: ['Term', 'Payment', 'Total interest'], rows: terms.map((t, i) => [t + ' months', usd2(pays[i]), usd(ints[i])]) },
      },
      {
        title: 'What you still owe after three years',
        insight: `After 36 payments, an 84-month borrower still owes <strong>${usd(balAt36[4])}</strong> of the original $32,000. Cars typically lose value fastest in the first years, so long loans raise the risk of owing more than the car is worth if you need to sell.`,
        chart: {
          type: 'bar',
          title: 'Balance remaining after 36 months, $32k at 7.5%',
          x: terms.map((t) => t + ' mo'),
          series: [{ name: 'Balance left', values: balAt36 }],
          y: 'usd',
          xTitle: 'Loan term',
        },
      },
    ];
  },
  variantQs: [
    { q: 'Is a car loan calculator the same as an auto loan calculator?', a: 'Yes. Car loan, auto loan, vehicle loan and automobile loan calculators all use the same formula. This one adds tax, trade-in and fees so the result matches a dealer’s quote more closely.' },
    { q: 'How do I use a financing a car calculator for a new vs used car?', a: 'The maths is identical; what changes is the APR (used-car rates are usually higher) and fees. Get a pre-approval from a bank or credit union and enter that APR.' },
    { q: 'Can I calculate a vehicle loan with no down payment?', a: 'Yes — set cash down to $0. You will finance tax and fees too, so watch the amount-financed line and the total interest.' },
  ],
  tips: [
    'Negotiate the <strong>price</strong> first, then financing — not the monthly payment.',
    'Bring a pre-approval: it gives you a rate the dealer has to beat.',
    'The 20/4/10 guideline: 20% down, no more than 4 years, total car costs under 10% of gross income.',
    'Add-ons like extended warranties and GAP insurance are often rolled into the loan — and charged interest.',
  ],
  faqs: [
    { q: 'How much is a $35,000 car payment?', a: `With $4,000 down, 6.5% tax, $900 fees, 7.5% APR and 60 months, the payment is about ${usd2(car({ price: 35000, down: 4000, trade: 0, owed: 0, rate: 7.5, term: 60, tax: 6.5, tradeTax: 'yes', fees: 900, rebate: 0 }).pay)} a month.` },
    { q: 'Is sales tax included in a car loan?', a: 'It can be. If you don’t pay tax upfront, it is added to the amount financed — which this calculator does by default.' },
    { q: 'What is a good APR for a car loan?', a: 'It depends on your credit score, whether the car is new or used, and the term. Compare quotes from a bank, a credit union and the dealer on the same term.' },
    { q: 'Should I take a 72- or 84-month car loan?', a: 'Only if the lower payment is essential. You pay much more interest and are more likely to owe more than the car is worth for longer.' },
    { q: 'Does a trade-in lower my sales tax?', a: 'In most US states, yes — tax is charged on the price minus the trade-in value. A few states tax the full price; use the selector above to match your state.' },
  ],
  sources: [
    { label: 'CFPB – Auto loans key terms', url: 'https://www.consumerfinance.gov/consumer-tools/auto-loans/' },
    { label: 'FTC – Financing or leasing a car', url: 'https://consumer.ftc.gov/articles/financing-or-leasing-car' },
  ],
  related: ['payment-calculator', 'loan-calculator', 'amortization-calculator', 'paycheck-calculator'],
  disclaimer: 'finance',
};
export default calc;
