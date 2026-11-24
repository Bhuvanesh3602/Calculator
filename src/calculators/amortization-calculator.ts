import { amortize, pmt, sum, yearly, parseDate, fmtDate } from '../lib/math';
import { usd, usd2, pct } from '../lib/format';
import type { Calculator } from '../lib/types';

const calc: Calculator = {
  slug: 'amortization-calculator',
  name: 'Amortization Calculator',
  short: 'Amortization',
  category: 'finance',
  keyword: 'amortization calculator',
  volume: 246000,
  variants: ['amortization schedule calculator', 'mortization calculator', 'loan amortization calculator', 'mortgage amortization schedule'],
  title: 'Amortization Calculator – Full Loan Schedule by Month & Year',
  description:
    'Build a full amortization schedule for any loan. See every payment split into principal and interest, your payoff date, and how extra payments change it.',
  accent: 'every payment, itemised',
  icon: '≡',
  inputs: [
    { id: 'amount', label: 'Loan amount', type: 'number', default: 250000, min: 0, step: 1000, prefix: '$' },
    { id: 'rate', label: 'Interest rate', type: 'number', default: 6.5, min: 0, step: 0.05, suffix: '%' },
    { id: 'years', label: 'Term', type: 'number', default: 30, min: 1, max: 50, step: 1, suffix: 'years' },
    { id: 'start', label: 'First payment date', type: 'date', default: 'today+30' },
    { id: 'extra', label: 'Extra principal per month', type: 'number', default: 0, min: 0, step: 25, prefix: '$' },
    {
      id: 'view',
      label: 'Schedule view',
      type: 'select',
      default: 'yearly',
      options: [
        { value: 'yearly', label: 'Yearly totals' },
        { value: 'monthly', label: 'Every month' },
      ],
    },
  ],
  compute(v) {
    const P = +v.amount,
      n = Math.round(+v.years * 12);
    if (!(P > 0) || !(n > 0)) return { primary: { label: '', value: '' }, error: 'Enter a loan amount and term above zero.' };
    const s = amortize(P, +v.rate, n, +v.extra || 0);
    const base = amortize(P, +v.rate, n);
    const start = parseDate(v.start);
    const payoff = new Date(start);
    payoff.setMonth(payoff.getMonth() + s.length - 1);
    const interest = sum(s.map((r) => r.interest));
    const y = yearly(s);
    let cum = 0;
    const cumInt = y.map((r) => (cum += r.interest));
    const rows = [
      { label: 'Number of payments', value: String(s.length) },
      { label: 'Total interest', value: usd(interest) },
      { label: 'Total paid', value: usd(P + interest) },
      { label: 'Payoff date', value: fmtDate(payoff) },
    ];
    if (+v.extra) rows.push({ label: 'Interest saved', value: usd(sum(base.map((r) => r.interest)) - interest) });
    const monthName = (i: number) => {
      const d = new Date(start);
      d.setMonth(d.getMonth() + i);
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };
    return {
      primary: { label: 'Monthly payment', value: usd2(pmt(P, +v.rate, n) + (+v.extra || 0)) },
      rows,
      chart: {
        type: 'line',
        title: 'Remaining balance and cumulative interest',
        x: y.map((r) => 'Yr ' + r.year),
        series: [
          { name: 'Balance', values: y.map((r) => r.balance) },
          { name: 'Interest paid', values: cumInt },
        ],
        y: 'usd',
        xTitle: 'Year',
      },
      table:
        v.view === 'monthly'
          ? {
              head: ['#', 'Date', 'Payment', 'Principal', 'Interest', 'Balance'],
              rows: s.map((r, i) => [r.month, monthName(i), usd2(r.payment), usd2(r.principal), usd2(r.interest), usd2(r.balance)]),
            }
          : { head: ['Year', 'Principal', 'Interest', 'Balance'], rows: y.map((r) => [r.year, usd(r.principal), usd(r.interest), usd(r.balance)]) },
    };
  },
  answer: {
    text: (r, v) =>
      `A $${(+v.amount).toLocaleString('en-US')} loan at ${v.rate}% over ${v.years} years has a fixed payment of <strong>${r.primary.value}</strong>. The amortization schedule shows that ${pct(
        ((+v.amount * +v.rate) / 100 / 12 / pmt(+v.amount, +v.rate, +v.years * 12)) * 100,
        0,
      )} of the first payment is interest, and you pay <strong>${r.rows![1].value}</strong> in interest over the life of the loan.`,
  },
  intro: [
    'An amortization schedule is the payment-by-payment plan for paying off a fixed-rate loan. Each row shows how much of that month’s payment covers interest, how much reduces principal, and what you still owe afterwards.',
    'This calculator builds the full schedule for mortgages, auto loans, personal loans or any fixed-rate installment debt. Switch between yearly totals and every single month, and add an extra principal amount to see a new payoff date instantly.',
  ],
  formula: {
    expr: 'Payment = P × r / (1 − (1 + r)^−n)\nInterest_k = Balance_(k−1) × r\nPrincipal_k = Payment − Interest_k\nBalance_k = Balance_(k−1) − Principal_k',
    vars: [
      ['P', 'original loan amount'],
      ['r', 'monthly rate (annual rate ÷ 12)'],
      ['n', 'number of monthly payments'],
      ['k', 'payment number, 1 to n'],
    ],
    notes: ['Because interest is always charged on the remaining balance, the interest portion shrinks each month and the principal portion grows, while the total payment stays the same.'],
  },
  examples: [
    {
      title: '$250k mortgage, 30 years',
      inputs: { amount: 250000, rate: 6.5, years: 30 },
      explain: (r) => `Total interest of ${r.rows![1].value} means you repay roughly ${usd(250000 + +r.rows![1].value.replace(/\D/g, ''))} in all.`,
    },
    {
      title: '$30k car loan, 5 years',
      inputs: { amount: 30000, rate: 7.5, years: 5 },
      explain: (r) => `A short term keeps interest to ${r.rows![1].value} — the schedule front-loads far less interest than a mortgage.`,
    },
    {
      title: '$250k with $200 extra',
      inputs: { amount: 250000, rate: 6.5, years: 30, extra: 200 },
      explain: (r) => `Extra principal cuts the loan to ${r.rows![0].value} payments and saves ${r.rows![4].value}.`,
    },
  ],
  analysis() {
    const P = 250000;
    const rates = [4, 5, 6, 7, 8];
    const eq5 = rates.map((r) => {
      const y = yearly(amortize(P, r, 360));
      return ((P - y[4].balance) / P) * 100;
    });
    const m = pmt(P, 6.5, 360);
    const monthly = amortize(P, 6.5, 360);
    const biweekly = amortize(P, 6.5, 360, m / 12);
    const mi = sum(monthly.map((x) => x.interest)),
      bi = sum(biweekly.map((x) => x.interest));
    const milestones = [25, 50, 75].map((p) => monthly.findIndex((x) => x.balance <= P * (1 - p / 100)) + 1);
    return [
      {
        title: 'How much equity you build in the first five years',
        insight: `After five years on a 30-year $250,000 loan you have repaid only <strong>${pct(eq5[2], 1)}</strong> of the principal at 6%, versus ${pct(eq5[0], 1)} at 4%. Higher rates don’t just raise the payment — they slow equity growth, which matters if you plan to sell or refinance early.`,
        chart: {
          type: 'bar',
          title: 'Share of principal repaid after 5 years, by rate',
          x: rates.map((r) => r + '%'),
          series: [{ name: 'Principal repaid', values: eq5 }],
          y: 'pct',
          xTitle: 'Interest rate (30-year loan)',
        },
      },
      {
        title: 'The halfway point comes late',
        insight: `At 6.5%, you owe less than 75% of the original balance only after <strong>${(milestones[0] / 12).toFixed(1)} years</strong>, and you reach the halfway point after ${(milestones[1] / 12).toFixed(1)} years — well past the midpoint of the term. The last 25% of the balance is paid off in about ${((360 - milestones[2]) / 12).toFixed(1)} years.`,
        stats: [
          { label: '25% paid off', value: `${(milestones[0] / 12).toFixed(1)} yrs` },
          { label: '50% paid off', value: `${(milestones[1] / 12).toFixed(1)} yrs` },
          { label: '75% paid off', value: `${(milestones[2] / 12).toFixed(1)} yrs` },
        ],
        chart: {
          type: 'line',
          title: 'Balance remaining on a $250k, 6.5%, 30-year loan',
          x: yearly(monthly).map((y) => 'Yr ' + y.year),
          series: [{ name: 'Balance', values: yearly(monthly).map((y) => y.balance) }],
          y: 'usd',
          xTitle: 'Year',
          markIndex: Math.ceil(milestones[1] / 12) - 1,
        },
      },
      {
        title: 'Biweekly payments, explained with numbers',
        insight: `Paying half your payment every two weeks means 26 half-payments — 13 full payments a year instead of 12. On $250,000 at 6.5% that is the same as adding ${usd(m / 12)} a month, and it saves <strong>${usd(mi - bi)}</strong> in interest while finishing ${((360 - biweekly.length) / 12).toFixed(1)} years early.`,
        chart: {
          type: 'bar',
          title: 'Total interest: monthly vs biweekly payments',
          x: ['Monthly', 'Biweekly'],
          series: [{ name: 'Total interest', values: [mi, bi] }],
          y: 'usd',
        },
      },
    ];
  },
  variantQs: [
    {
      q: 'What is a mortization calculator?',
      a: '“Mortization” is a common misspelling of amortization. Either way, it means a tool that spreads a loan into equal payments and shows the interest and principal in each one — exactly what this page does.',
    },
    {
      q: 'Can I use this as a loan amortization calculator for car or personal loans?',
      a: 'Yes. Any fixed-rate loan with equal monthly payments amortizes the same way. Enter the amount, rate and term from your loan agreement.',
    },
    {
      q: 'How do I read a mortgage amortization schedule?',
      a: 'Read across each row: payment number, the interest charged that month, the principal repaid and the remaining balance. Read down the principal column to see how your equity grows over time.',
    },
  ],
  tips: [
    'Check that your lender applies extra payments to principal, not to next month’s payment.',
    'Compare the schedule with your loan statement — small differences usually come from day-count conventions or the first payment date.',
    'Use the monthly view to find the exact month your balance drops below 80% of your home value (useful for removing PMI).',
    'Adjustable-rate loans re-amortize when the rate resets, so this schedule only holds until the first adjustment.',
  ],
  faqs: [
    {
      q: 'What does amortization mean?',
      a: 'Amortization is paying off a debt through regular, equal payments that cover both interest and principal, so the balance reaches zero by the end of the term.',
    },
    {
      q: 'Why is so much of my early payment interest?',
      a: 'Interest is calculated on the balance you still owe. At the start, the balance is highest, so the interest portion is largest. As principal falls, interest falls and more of each payment goes to principal.',
    },
    {
      q: 'Does paying extra reduce my monthly payment?',
      a: 'No. On a standard loan, extra payments shorten the term and reduce total interest, but the required payment stays the same. Some lenders offer a “recast” that lowers the payment after a large lump-sum payment.',
    },
    {
      q: 'Can I download the amortization schedule?',
      a: 'Use the Print button to save the full schedule as a PDF, or copy the table into a spreadsheet. The URL also stores your inputs, so you can bookmark the exact schedule.',
    },
    {
      q: 'What is negative amortization?',
      a: 'Negative amortization happens when a payment is smaller than the interest due, so unpaid interest is added to the balance and the debt grows. Standard fixed-rate loans like the ones modeled here never negatively amortize.',
    },
  ],
  sources: [
    { label: 'CFPB – What is amortization?', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-amortization-and-how-could-it-affect-my-auto-loan-en-755/' },
    { label: 'CFPB – Negative amortization', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-negative-amortization-en-103/' },
  ],
  related: ['mortgage-calculator', 'loan-calculator', 'auto-loan-calculator', 'payment-calculator', 'compound-interest-calculator'],
  disclaimer: 'finance',
};
export default calc;
