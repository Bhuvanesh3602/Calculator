import { usd2, pct, num } from '../lib/format';
import type { Calculator } from '../lib/types';

/**
 * Statewide base sales-tax rates (%), before local add-ons.
 * Source: state revenue departments, compiled by the Tax Foundation, rates in effect 2025.
 * Utah and Virginia include their mandatory statewide local portion. VERIFY each January.
 */
export const STATE_SALES_TAX: [string, string, number][] = [
  ['AL', 'Alabama', 4], ['AK', 'Alaska', 0], ['AZ', 'Arizona', 5.6], ['AR', 'Arkansas', 6.5], ['CA', 'California', 7.25],
  ['CO', 'Colorado', 2.9], ['CT', 'Connecticut', 6.35], ['DE', 'Delaware', 0], ['DC', 'District of Columbia', 6], ['FL', 'Florida', 6],
  ['GA', 'Georgia', 4], ['HI', 'Hawaii', 4], ['ID', 'Idaho', 6], ['IL', 'Illinois', 6.25], ['IN', 'Indiana', 7],
  ['IA', 'Iowa', 6], ['KS', 'Kansas', 6.5], ['KY', 'Kentucky', 6], ['LA', 'Louisiana', 5], ['ME', 'Maine', 5.5],
  ['MD', 'Maryland', 6], ['MA', 'Massachusetts', 6.25], ['MI', 'Michigan', 6], ['MN', 'Minnesota', 6.875], ['MS', 'Mississippi', 7],
  ['MO', 'Missouri', 4.225], ['MT', 'Montana', 0], ['NE', 'Nebraska', 5.5], ['NV', 'Nevada', 6.85], ['NH', 'New Hampshire', 0],
  ['NJ', 'New Jersey', 6.625], ['NM', 'New Mexico', 4.875], ['NY', 'New York', 4], ['NC', 'North Carolina', 4.75], ['ND', 'North Dakota', 5],
  ['OH', 'Ohio', 5.75], ['OK', 'Oklahoma', 4.5], ['OR', 'Oregon', 0], ['PA', 'Pennsylvania', 6], ['RI', 'Rhode Island', 7],
  ['SC', 'South Carolina', 6], ['SD', 'South Dakota', 4.2], ['TN', 'Tennessee', 7], ['TX', 'Texas', 6.25], ['UT', 'Utah', 6.1],
  ['VT', 'Vermont', 6], ['VA', 'Virginia', 5.3], ['WA', 'Washington', 6.5], ['WV', 'West Virginia', 6], ['WI', 'Wisconsin', 5], ['WY', 'Wyoming', 4],
];
const stateRate = (code: string) => STATE_SALES_TAX.find((s) => s[0] === code)?.[2];

export function salesTax(mode: string, amount: number, ratePct: number, total = 0) {
  const r = ratePct / 100;
  if (mode === 'reverse') {
    const pre = amount / (1 + r);
    return { pre, tax: amount - pre, total: amount, rate: ratePct };
  }
  if (mode === 'rate') {
    return { pre: amount, tax: total - amount, total, rate: amount > 0 ? ((total - amount) / amount) * 100 : NaN };
  }
  return { pre: amount, tax: amount * r, total: amount * (1 + r), rate: ratePct };
}

const calc: Calculator = {
  slug: 'sales-tax-calculator',
  name: 'Sales Tax Calculator',
  short: 'Sales Tax',
  category: 'everyday',
  keyword: 'sales tax calculator',
  volume: 201000,
  variants: ['reverse sales tax calculator', 'tax calculator for purchases', 'price before tax calculator', 'sales tax rate by state', 'add tax to price'],
  title: 'Sales Tax Calculator – Add, Remove or Find the Tax Rate',
  description:
    'Add sales tax to a price, remove it from a total (reverse sales tax), or find the rate on a receipt. Includes every US state’s base rate plus your local rate.',
  accent: 'add it, remove it',
  icon: '+%',
  inputs: [
    {
      id: 'mode',
      label: 'What do you want to do?',
      type: 'select',
      default: 'add',
      options: [
        { value: 'add', label: 'Add tax to a price' },
        { value: 'reverse', label: 'Remove tax from a total (reverse)' },
        { value: 'rate', label: 'Find the tax rate from a receipt' },
      ],
    },
    { id: 'amount', label: 'Price before tax', type: 'number', default: 249.99, min: 0, step: 0.01, prefix: '$', showIf: { field: 'mode', in: ['add', 'rate'] } },
    { id: 'gross', label: 'Total paid, including tax', type: 'number', default: 268.74, min: 0, step: 0.01, prefix: '$', showIf: { field: 'mode', in: ['reverse', 'rate'] } },
    {
      id: 'state',
      label: 'State',
      type: 'select',
      default: 'CA',
      options: [{ value: 'custom', label: 'Enter my own total rate' }, ...STATE_SALES_TAX.map(([c, n, r]) => ({ value: c, label: `${n} (${num(r, 3)}%)` }))],
      showIf: { field: 'mode', in: ['add', 'reverse'] },
    },
    { id: 'local', label: 'Local (city/county) rate', type: 'number', default: 1.5, min: 0, max: 8, step: 0.025, suffix: '%', help: 'Look up your exact local rate on your state revenue department’s website.', showIf: [{ field: 'mode', in: ['add', 'reverse'] }, { field: 'state', in: STATE_SALES_TAX.map((s) => s[0]) }] },
    { id: 'rate', label: 'Total sales tax rate', type: 'number', default: 8.25, min: 0, max: 30, step: 0.025, suffix: '%', showIf: [{ field: 'mode', in: ['add', 'reverse'] }, { field: 'state', in: ['custom'] }] },
    { id: 'qty', label: 'Quantity', type: 'number', default: 1, min: 1, max: 10000, step: 1, suffix: 'items', showIf: { field: 'mode', in: ['add'] } },
  ],
  compute(v) {
    const mode = v.mode;
    const sr = stateRate(v.state);
    const rate = sr === undefined ? +v.rate || 0 : sr + (+v.local || 0);
    if (mode === 'rate') {
      const pre = +v.amount,
        tot = +v.gross;
      if (!(pre > 0 && tot >= pre)) return { primary: { label: '', value: '' }, error: 'Enter a pre-tax price and a total that is at least as large.' };
      const t = salesTax('rate', pre, 0, tot);
      return {
        primary: { label: 'Sales tax rate on the receipt', value: pct(t.rate, 3) },
        rows: [
          { label: 'Tax paid', value: usd2(t.tax) },
          { label: 'Closest state base rates', value: [...STATE_SALES_TAX].filter((s) => s[2] > 0).sort((a, b) => Math.abs(a[2] - t.rate) - Math.abs(b[2] - t.rate)).slice(0, 3).map((s) => `${s[0]} ${num(s[2], 3)}%`).join(', ') },
        ],
        steps: [`Tax = ${usd2(tot)} − ${usd2(pre)} = ${usd2(t.tax)}`, `Rate = ${usd2(t.tax)} ÷ ${usd2(pre)} × 100 = ${pct(t.rate, 3)}`],
      };
    }
    if (mode === 'reverse') {
      const tot = +v.gross;
      if (!(tot > 0)) return { primary: { label: '', value: '' }, error: 'Enter the total paid.' };
      const t = salesTax('reverse', tot, rate);
      return {
        primary: { label: 'Price before tax', value: usd2(t.pre) },
        rows: [
          { label: `Sales tax at ${pct(rate, 3)}`, value: usd2(t.tax) },
          { label: 'Total paid', value: usd2(tot) },
          { label: 'Tax as a share of the total', value: pct((t.tax / tot) * 100, 3) },
        ],
        steps: [`Pre-tax = total ÷ (1 + rate)`, `= ${usd2(tot)} ÷ ${num(1 + rate / 100, 5)} = ${usd2(t.pre)}`, `Common mistake: ${usd2(tot)} × (1 − ${pct(rate, 3)}) = ${usd2(tot * (1 - rate / 100))}, which is ${usd2(t.pre - tot * (1 - rate / 100))} too low`],
      };
    }
    const qty = Math.max(1, Math.round(+v.qty || 1));
    const price = +v.amount * qty;
    if (!(price > 0)) return { primary: { label: '', value: '' }, error: 'Enter a price.' };
    const t = salesTax('add', price, rate);
    const stateOnly = sr !== undefined ? price * (sr / 100) : t.tax;
    return {
      primary: { label: 'Total with tax', value: usd2(t.total) },
      rows: [
        { label: `Sales tax (${pct(rate, 3)})`, value: usd2(t.tax) },
        ...(sr !== undefined ? [{ label: `State portion (${pct(sr, 3)})`, value: usd2(stateOnly) }, { label: `Local portion (${pct(+v.local || 0, 3)})`, value: usd2(t.tax - stateOnly) }] : []),
        ...(qty > 1 ? [{ label: 'Per item with tax', value: usd2(t.total / qty) }] : []),
        { label: 'Price before tax', value: usd2(price) },
      ],
      chart: {
        type: 'hbar',
        title: 'The same purchase in the five largest states (base rate only)',
        x: ['CA', 'TX', 'FL', 'NY', 'PA'].map((c) => STATE_SALES_TAX.find((s) => s[0] === c)![1]),
        series: [{ name: 'Tax', values: ['CA', 'TX', 'FL', 'NY', 'PA'].map((c) => (price * stateRate(c)!) / 100) }],
        y: 'usd2',
      },
      steps: [`Rate = ${sr !== undefined ? `${num(sr, 3)}% state + ${num(+v.local || 0, 3)}% local = ` : ''}${pct(rate, 3)}`, `Tax = ${usd2(price)} × ${num(rate / 100, 5)} = ${usd2(t.tax)}`, `Total = ${usd2(price)} + ${usd2(t.tax)} = ${usd2(t.total)}`],
    };
  },
  answer: {
    text: (r) =>
      `A <strong>$249.99</strong> purchase in California at the 7.25% state rate plus 1.5% local tax (8.75% total) has <strong>${r.rows![0].value}</strong> in sales tax, for a total of <strong>${r.primary.value}</strong>. To remove tax from a total, divide by 1 plus the rate. Subtracting the rate from the total gives the wrong answer.`,
  },
  intro: [
    'A sales tax calculator adds tax to a price, removes it from a total, or works out the rate from a receipt. In the US, sales tax is set by states and local governments, so the rate depends on where you buy. Five states (Alaska, Delaware, Montana, New Hampshire and Oregon) have no statewide sales tax.',
    'This calculator includes every state’s base rate, so you only need to add your city or county rate. It also has a reverse mode for receipts and expense reports, and shows the common mistake people make when removing tax, so you can see why dividing is correct.',
  ],
  formula: {
    expr: 'Add tax:     total = price × (1 + rate)\nRemove tax:  price = total ÷ (1 + rate)\nFind rate:   rate = (total − price) ÷ price',
    vars: [
      ['rate', 'state + county + city + special-district rate, as a decimal'],
    ],
    notes: ['Many states exempt or reduce tax on groceries, prescription drugs and clothing. Check whether your item is taxable before relying on the result.'],
  },
  examples: [
    { title: 'Laptop in Texas, $1,299', inputs: { mode: 'add', amount: 1299, state: 'TX', local: 2 }, explain: (r) => `Tax ${r.rows![0].value}; total ${r.primary.value}.` },
    { title: 'Reverse a $54.00 receipt at 8.875% (NYC)', inputs: { mode: 'reverse', gross: 54, state: 'NY', local: 4.875 }, explain: (r) => `Pre-tax price ${r.primary.value}; tax ${r.rows![0].value}.` },
    { title: 'Rate on a $80 → $86.60 receipt', inputs: { mode: 'rate', amount: 80, gross: 86.6 }, explain: (r) => `The receipt used ${r.primary.value}.` },
    { title: '12 items at $4.99 in Oregon', inputs: { mode: 'add', amount: 4.99, qty: 12, state: 'OR', local: 0 }, explain: (r) => `No sales tax: total ${r.primary.value}.` },
  ],
  analysis() {
    const top = [...STATE_SALES_TAX].sort((a, b) => b[2] - a[2]).slice(0, 10);
    return [
      {
        title: 'The ten highest statewide base rates',
        insight: `California has the highest statewide base rate at <strong>7.25%</strong>. Combined with local taxes, though, Louisiana, Tennessee, Arkansas, Washington and Alabama often top the rankings, with average combined rates above 9%. The base rate alone can understate what shoppers actually pay.`,
        chart: { type: 'hbar', title: 'Statewide base sales-tax rate (%)', x: top.map((s) => s[1]), series: [{ name: 'Rate', values: top.map((s) => s[2]) }], y: 'num2' },
      },
      {
        title: 'Why “total × (1 − rate)” is wrong',
        insight: 'Tax is a percentage of the pre-tax price, not of the total. Subtracting the rate from the total always takes off too much, and the error grows as the rate rises.',
        table: {
          head: ['Rate', 'Total paid', 'Correct pre-tax (÷)', 'Wrong (× 1 − rate)', 'Error'],
          rows: [5, 7.25, 9, 10.25].map((r) => [pct(r, 2), usd2(100), usd2(100 / (1 + r / 100)), usd2(100 * (1 - r / 100)), usd2(100 / (1 + r / 100) - 100 * (1 - r / 100))]),
        },
      },
    ];
  },
  variantQs: [
    { q: 'How do I calculate reverse sales tax?', a: 'Divide the total by 1 plus the tax rate. For a $108.25 total at 8.25%, $108.25 ÷ 1.0825 = $100.00 before tax.' },
    { q: 'How do I add sales tax to a price?', a: 'Multiply the price by 1 plus the rate. $50 at 7% is $50 × 1.07 = $53.50.' },
    { q: 'Which states have no sales tax?', a: 'Alaska, Delaware, Montana, New Hampshire and Oregon have no statewide sales tax. Some Alaska towns still charge a local sales tax.' },
  ],
  tips: [
    'Online retailers generally charge your local destination rate, since the 2018 South Dakota v. Wayfair Supreme Court ruling.',
    'Look for your state’s sales-tax holiday for back-to-school or energy-efficient purchases.',
    'Keep receipts if you itemize: you can deduct state and local sales tax instead of state income tax.',
  ],
  faqs: [
    { q: 'How is sales tax calculated?', a: 'Multiply the taxable price by the combined state and local rate. $200 at 8% has $16 of tax, for a total of $216.' },
    { q: 'What is my local sales tax rate?', a: 'It is the sum of your state, county, city and any special-district rates. Your state department of revenue publishes a lookup by address or ZIP code.' },
    { q: 'Is sales tax charged on shipping?', a: 'It depends on the state. Some tax shipping charges, others do not if shipping is listed separately on the invoice.' },
    { q: 'Can I deduct sales tax on my federal return?', a: 'Yes, if you itemize. You can deduct state and local sales tax instead of state income tax, within the SALT cap. This helps most in states with no income tax.' },
  ],
  sources: [
    { label: 'Tax Foundation – State and local sales tax rates', url: 'https://taxfoundation.org/data/all/state/sales-tax-rates/' },
    { label: 'Streamlined Sales Tax Governing Board – rate and boundary files', url: 'https://www.streamlinedsalestax.org/' },
  ],
  related: ['percentage-calculator', 'tip-calculator', 'income-tax-calculator', 'percent-change-calculator', 'auto-loan-calculator'],
  disclaimer: 'tax',
  reference: {
    caption: 'Statewide Base Sales Tax Rates',
    asOf: '2025, before local taxes',
    source: 'Tax Foundation compilation of state revenue department rates',
    head: ['State', 'Base rate', 'Tax on $100'],
    rows: STATE_SALES_TAX.map(([, n, r]) => [n, pct(r, 3), usd2(r)]),
  },
};
export default calc;
