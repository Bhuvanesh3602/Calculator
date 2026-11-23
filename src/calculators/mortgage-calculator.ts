import { amortize, pmt, sum, yearly } from '../lib/math';
import { usd, usd2, pct } from '../lib/format';
import type { Calculator, Values } from '../lib/types';

function mortgage(v: Values) {
  const price = +v.price,
    downPct = +v.down,
    rate = +v.rate,
    years = +v.term;
  const loan = price * (1 - downPct / 100);
  const months = years * 12;
  const pi = pmt(loan, rate, months);
  const sched = amortize(loan, rate, months, +v.extra || 0);
  const base = +v.extra ? amortize(loan, rate, months) : sched;
  const tax = (price * (+v.tax || 0)) / 100 / 12;
  const ins = (+v.insurance || 0) / 12;
  const hoa = +v.hoa || 0;
  // PMI until balance reaches 78% of original value (automatic termination rule)
  const pmiOn = downPct < 20;
  const pmiMonthly = pmiOn ? (loan * (+v.pmi || 0)) / 100 / 12 : 0;
  const pmiMonths = pmiOn ? sched.findIndex((r) => r.balance <= price * 0.78) + 1 : 0;
  const interest = sum(sched.map((r) => r.interest));
  const baseInterest = sum(base.map((r) => r.interest));
  return { loan, pi, sched, tax, ins, hoa, pmiMonthly, pmiMonths, interest, baseInterest, months, total: pi + tax + ins + hoa + pmiMonthly };
}

const calc: Calculator = {
  slug: 'mortgage-calculator',
  name: 'Mortgage Calculator',
  short: 'Mortgage',
  category: 'finance',
  keyword: 'mortgage calculator',
  volume: 2240000,
  variants: ['mortgage payment calculator', 'home loan calculator', 'house payment calculator', 'mortgage calculator with taxes and insurance'],
  title: 'Mortgage Calculator (2026) – Monthly Payment with PMI & Tax',
  description:
    'Free mortgage calculator: see your monthly payment with property tax, insurance, PMI and HOA, plus how extra payments cut years and interest off your loan.',
  accent: 'with real payoff math',
  icon: '⌂',
  inputs: [
    { id: 'price', label: 'Home price', type: 'number', default: 400000, min: 0, step: 1000, prefix: '$' },
    { id: 'down', label: 'Down payment', type: 'number', default: 20, min: 0, max: 100, step: 0.5, suffix: '%' },
    { id: 'rate', label: 'Interest rate', type: 'number', default: 6.5, min: 0, max: 25, step: 0.05, suffix: '%' },
    {
      id: 'term',
      label: 'Loan term',
      type: 'select',
      default: '30',
      options: [
        { value: '30', label: '30 years' },
        { value: '20', label: '20 years' },
        { value: '15', label: '15 years' },
        { value: '10', label: '10 years' },
      ],
    },
    { id: 'tax', label: 'Property tax (per year)', type: 'number', default: 1.1, min: 0, step: 0.05, suffix: '% of price' },
    { id: 'insurance', label: 'Home insurance (per year)', type: 'number', default: 1800, min: 0, step: 50, prefix: '$' },
    { id: 'hoa', label: 'HOA fees (per month)', type: 'number', default: 0, min: 0, step: 10, prefix: '$' },
    { id: 'pmi', label: 'PMI rate (if under 20% down)', type: 'number', default: 0.5, min: 0, step: 0.05, suffix: '%/yr' },
    { id: 'extra', label: 'Extra principal (per month)', type: 'number', default: 0, min: 0, step: 25, prefix: '$' },
  ],
  compute(v) {
    if (!(+v.price > 0)) return { primary: { label: '', value: '' }, error: 'Enter a home price above $0.' };
    const m = mortgage(v);
    const yrs = yearly(m.sched);
    const payoffMonths = m.sched.length;
    const rows = [
      { label: 'Principal & interest', value: usd2(m.pi) },
      { label: 'Property tax', value: usd2(m.tax) },
      { label: 'Home insurance', value: usd2(m.ins) },
    ];
    if (m.hoa) rows.push({ label: 'HOA', value: usd2(m.hoa) });
    if (m.pmiMonthly) rows.push({ label: `PMI (about ${Math.ceil(m.pmiMonths / 12)} yrs)`, value: usd2(m.pmiMonthly) });
    rows.push(
      { label: 'Loan amount', value: usd(m.loan) },
      { label: 'Total interest', value: usd(m.interest) },
      { label: 'Paid off in', value: `${Math.floor(payoffMonths / 12)} yrs ${payoffMonths % 12} mo` },
    );
    if (+v.extra) rows.push({ label: 'Interest saved by extra', value: usd(m.baseInterest - m.interest) });
    return {
      primary: { label: 'Monthly payment', value: usd2(m.total) },
      rows,
      chart: {
        type: 'stacked',
        title: 'Principal vs interest paid each year',
        x: yrs.map((y) => 'Yr ' + y.year),
        series: [
          { name: 'Interest', values: yrs.map((y) => y.interest) },
          { name: 'Principal', values: yrs.map((y) => y.principal) },
        ],
        y: 'usd',
        xTitle: 'Year of loan',
      },
      table: {
        head: ['Year', 'Principal', 'Interest', 'Ending balance'],
        rows: yrs.map((y) => [y.year, usd(y.principal), usd(y.interest), usd(y.balance)]),
      },
    };
  },
  answer: {
    text: (r, v) => {
      const m = mortgage(v);
      return `A <strong>$${(+v.price).toLocaleString("en-US")}</strong> home with ${v.down}% down at ${v.rate}% for ${v.term} years costs about <strong>${usd(m.total)} a month</strong> including tax and insurance — ${usd(m.pi)} of that is principal and interest. Over the full term you would pay roughly <strong>${usd(m.interest)} in interest</strong>.`;
    },
  },
  intro: [
    'A mortgage calculator turns four facts — the price, your down payment, the interest rate and the loan term — into the number that matters most: what leaves your bank account every month. Ours adds the costs lenders bundle into escrow (property tax and homeowners insurance), private mortgage insurance when you put down less than 20%, and HOA dues.',
    'It also builds the full amortization schedule, so you can see how slowly principal falls in the early years, and test what an extra payment does to your payoff date. Change any input and the payment, chart and schedule update instantly; the URL updates too, so you can share the exact scenario.',
  ],
  formula: {
    expr: 'M = P × r(1 + r)^n / ((1 + r)^n − 1)\nTotal monthly = M + tax/12 + insurance/12 + PMI + HOA',
    vars: [
      ['M', 'monthly principal and interest payment'],
      ['P', 'loan amount (price minus down payment)'],
      ['r', 'monthly interest rate = annual rate ÷ 12'],
      ['n', 'number of monthly payments = years × 12'],
    ],
    notes: [
      'Each month, interest is charged on the remaining balance (balance × r) and the rest of M reduces principal. PMI is estimated as an annual percentage of the loan and is dropped once the balance reaches 78% of the original home value — the automatic termination point under the US Homeowners Protection Act.',
    ],
  },
  examples: [
    {
      title: 'First home, 10% down',
      inputs: { price: 350000, down: 10, rate: 6.75, term: '30', tax: 1.0, insurance: 1500, pmi: 0.6 },
      explain: (r) => {
        const p = r.rows!.find((x) => x.label.startsWith('PMI'))!;
        return `With less than 20% down, PMI adds ${p.value} a month (${p.label.replace('PMI (', '').replace(')', '')}) until the balance falls to 78% of the price.`;
      },
    },
    {
      title: '15-year loan to save interest',
      inputs: { price: 400000, down: 20, rate: 5.9, term: '15' },
      explain: (r) => `The payment is higher, but total interest is just ${r.rows!.find((x) => x.label === 'Total interest')!.value} — a fraction of a 30-year loan.`,
    },
    {
      title: 'Paying $300 extra each month',
      inputs: { price: 400000, down: 20, rate: 6.5, term: '30', extra: 300 },
      explain: (r) => `An extra $300 toward principal pays the loan off in ${r.rows!.find((x) => x.label === 'Paid off in')!.value} and saves ${r.rows!.find((x) => x.label.startsWith('Interest saved'))!.value}.`,
    },
  ],
  analysis() {
    const loan = 320000;
    const rates = [4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8];
    const pays = rates.map((r) => pmt(loan, r, 360));
    const per05 = pays[5] - pays[4];
    const terms = [10, 15, 20, 30];
    const ti = terms.map((t) => pmt(loan, 6.5, t * 12) * t * 12 - loan);
    const extras = [0, 100, 250, 500, 1000];
    const ex = extras.map((e) => {
      const s = amortize(loan, 6.5, 360, e);
      return { e, months: s.length, interest: sum(s.map((r) => r.interest)) };
    });
    const sched = yearly(amortize(loan, 6.5, 360));
    const share = sched.map((y) => (y.interest / (y.interest + y.principal)) * 100);
    const crossYear = share.findIndex((s) => s < 50) + 1;
    return [
      {
        title: 'What a half-point rate change really costs',
        insight: `On a $320,000, 30-year loan, every 0.5 percentage point adds roughly <strong>${usd(per05)}</strong> to the monthly payment. Going from 6% to 7% costs ${usd((pays[6] - pays[4]) * 360)} more over the life of the loan — which is why shopping three or more lenders is worth an afternoon.`,
        chart: {
          type: 'line',
          title: 'Monthly principal & interest by rate, $320k 30-year loan',
          x: rates.map((r) => r + '%'),
          series: [{ name: 'Monthly payment', values: pays }],
          y: 'usd',
          xTitle: 'Interest rate',
        },
        stats: [
          { label: 'Payment at 4%', value: usd(pays[0]) },
          { label: 'Payment at 8%', value: usd(pays[8]) },
        ],
      },
      {
        title: 'Term length changes total interest more than anything else',
        insight: `At 6.5%, a 30-year term costs <strong>${usd(ti[3])}</strong> in interest on $320,000; a 15-year term costs ${usd(ti[1])}. The shorter loan needs ${usd(pmt(loan, 6.5, 180) - pmt(loan, 6.5, 360))} more per month, but saves ${usd(ti[3] - ti[1])}. (Real 15-year rates are usually lower still, widening the gap.)`,
        chart: {
          type: 'bar',
          title: 'Total interest by loan term at 6.5%',
          x: terms.map((t) => t + ' yr'),
          series: [{ name: 'Total interest', values: ti }],
          y: 'usd',
          xTitle: 'Loan term',
        },
      },
      {
        title: 'Small extra payments, big time savings',
        insight: `Adding $250 a month to a $320,000 loan at 6.5% pays it off <strong>${((360 - ex[2].months) / 12).toFixed(1)} years early</strong> and cuts interest by ${usd(ex[0].interest - ex[2].interest)}. Every extra dollar goes straight to principal, so it stops future interest from ever being charged.`,
        chart: {
          type: 'bar',
          title: 'Total interest by extra monthly payment',
          x: extras.map((e) => (e ? '+$' + e : 'None')),
          series: [{ name: 'Total interest', values: ex.map((x) => x.interest) }],
          y: 'usd',
          xTitle: 'Extra principal per month',
        },
        table: {
          head: ['Extra per month', 'Payoff time', 'Total interest', 'Interest saved'],
          rows: ex.map((x) => [x.e ? '$' + x.e : 'None', `${(x.months / 12).toFixed(1)} yrs`, usd(x.interest), usd(ex[0].interest - x.interest)]),
        },
      },
      {
        title: 'Why early payments are mostly interest',
        insight: `In year one of a 6.5% 30-year loan, <strong>${pct(share[0], 0)}</strong> of what you pay is interest. Principal doesn't overtake interest until <strong>year ${crossYear}</strong>. Refinancing or selling early means you have built less equity than the payment size suggests.`,
        chart: {
          type: 'line',
          title: 'Share of each year’s payments that is interest',
          x: sched.map((y) => 'Yr ' + y.year),
          series: [{ name: 'Interest share', values: share }],
          y: 'pct',
          xTitle: 'Year of loan',
          markIndex: crossYear - 1,
        },
      },
    ];
  },
  variantQs: [
    {
      q: 'Does a mortgage payment calculator include taxes and insurance?',
      a: 'This one does. Many lenders quote only principal and interest, but your real monthly bill usually includes property tax and homeowners insurance paid through escrow. Enter your local tax rate and insurance premium to see the full figure.',
    },
    {
      q: 'Is a home loan calculator the same as a mortgage calculator?',
      a: 'Yes. "Home loan" and "mortgage" describe the same product in the US, and the payment maths is identical. The terms differ only by region and lender marketing.',
    },
    {
      q: 'How do I use a house payment calculator to set a budget?',
      a: 'Work backwards: try prices until the total monthly payment is no more than about 28% of your gross monthly income, a common lender guideline for housing costs. Then check that all debts together stay under roughly 36%.',
    },
  ],
  tips: [
    'Use the <strong>total</strong> monthly payment, not just principal and interest, when comparing homes — taxes vary a lot between counties.',
    'Get your actual property tax rate from the county assessor; online listings often show the previous owner’s (possibly exempted) bill.',
    'Under 20% down? Ask your lender how PMI is priced and when it can be removed early with a new appraisal.',
    'Ask for extra payments to be applied to <strong>principal</strong> — otherwise some servicers hold them as prepaid future payments.',
    'Remember closing costs (often 2–5% of the price) are separate from the down payment.',
  ],
  faqs: [
    {
      q: 'How much is a $400,000 mortgage per month?',
      a: `At 6.5% for 30 years, principal and interest on a $400,000 loan is about ${usd(pmt(400000, 6.5, 360))} a month. Property tax, insurance and any PMI come on top, so the real bill is often $400–$900 higher depending on where you live.`,
    },
    {
      q: 'How is a mortgage payment calculated?',
      a: 'Lenders use the amortization formula M = P × r(1+r)^n / ((1+r)^n − 1), where P is the loan amount, r the monthly rate and n the number of payments. The payment stays fixed, but the split between interest and principal shifts every month.',
    },
    {
      q: 'When does PMI go away?',
      a: 'On conventional loans, you can request cancellation when the balance reaches 80% of the original home value, and it ends automatically at 78%. FHA mortgage insurance follows different rules and often lasts for the life of the loan.',
    },
    {
      q: 'Is it better to choose a 15-year or 30-year mortgage?',
      a: 'A 15-year loan saves a large amount of interest and usually carries a lower rate, but the monthly payment is much higher. A 30-year loan gives flexibility; you can still pay it down faster with extra payments when cash allows.',
    },
    {
      q: 'Do extra payments really shorten my mortgage?',
      a: 'Yes. Any amount above the scheduled payment reduces principal immediately, so less interest accrues every month after. Even $100 a month on a typical loan removes years from the term — try it in the extra payment box.',
    },
    {
      q: 'What interest rate should I enter?',
      a: 'Use a current quote from a lender for your credit score and down payment, not a headline average. Rates change daily, so compare the APR in each lender’s Loan Estimate as well.',
    },
  ],
  sources: [
    { label: 'Consumer Financial Protection Bureau – Explore interest rates', url: 'https://www.consumerfinance.gov/owning-a-home/explore-rates/' },
    { label: 'CFPB – When can I remove PMI?', url: 'https://www.consumerfinance.gov/ask-cfpb/when-can-i-remove-private-mortgage-insurance-pmi-from-my-loan-en-202/' },
    { label: 'Freddie Mac – Primary Mortgage Market Survey', url: 'https://www.freddiemac.com/pmms' },
  ],
  related: ['amortization-calculator', 'loan-calculator', 'payment-calculator', 'compound-interest-calculator', 'inflation-calculator', 'square-footage-calculator'],
  disclaimer: 'finance',
};
export default calc;
