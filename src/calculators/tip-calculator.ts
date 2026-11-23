import { usd2 } from '../lib/format';
import type { Calculator } from '../lib/types';

export function tip(bill: number, pct: number, people: number, tax: number, onPreTax: boolean, round: string) {
  const base = onPreTax ? bill - tax : bill;
  let t = (base * pct) / 100;
  let total = bill + t;
  if (round === 'up') {
    total = Math.ceil(total / people) * people;
    t = total - bill;
  }
  return { tip: t, total, each: total / people, tipEach: t / people };
}

const calc: Calculator = {
  slug: 'tip-calculator',
  name: 'Tip Calculator',
  short: 'Tip',
  category: 'everyday',
  keyword: 'tip calculator',
  volume: 450000,
  variants: ['gratuity calculator', 'split bill calculator', 'tip and split calculator', 'how much to tip'],
  title: 'Tip Calculator – Tip, Split the Bill & Round Up',
  description:
    'Calculate the tip and total, split the bill evenly between any number of people, tip on the pre-tax amount, and round each share up to a whole dollar.',
  accent: 'split it fairly',
  icon: '★',
  inputs: [
    { id: 'bill', label: 'Bill total', type: 'number', default: 86.4, min: 0, step: 0.01, prefix: '$' },
    { id: 'pct', label: 'Tip', type: 'number', default: 18, min: 0, max: 100, step: 1, suffix: '%' },
    { id: 'people', label: 'Split between', type: 'number', default: 3, min: 1, max: 50, step: 1, suffix: 'people' },
    { id: 'tax', label: 'Tax included in bill (optional)', type: 'number', default: 6.4, min: 0, step: 0.01, prefix: '$' },
    {
      id: 'base',
      label: 'Tip on',
      type: 'select',
      default: 'pre',
      options: [
        { value: 'pre', label: 'Pre-tax amount' },
        { value: 'post', label: 'Total including tax' },
      ],
    },
    {
      id: 'round',
      label: 'Rounding',
      type: 'select',
      default: 'none',
      options: [
        { value: 'none', label: 'Exact' },
        { value: 'up', label: 'Round each share up to $1' },
      ],
    },
  ],
  compute(v) {
    const bill = +v.bill,
      n = Math.max(1, Math.round(+v.people || 1));
    if (!(bill > 0)) return { primary: { label: '', value: '' }, error: 'Enter the bill amount.' };
    const t = tip(bill, +v.pct || 0, n, +v.tax || 0, v.base === 'pre', v.round);
    const pcts = [10, 15, 18, 20, 22, 25];
    return {
      primary: { label: n > 1 ? `Each person pays` : 'Total to pay', value: usd2(t.each) },
      rows: [
        { label: 'Tip', value: usd2(t.tip) },
        { label: 'Total with tip', value: usd2(t.total) },
        ...(n > 1 ? [{ label: 'Tip per person', value: usd2(t.tipEach) }] : []),
        { label: 'Effective tip on pre-tax', value: (((t.tip / (bill - (+v.tax || 0))) * 100) || 0).toFixed(1) + '%' },
      ],
      table: { head: ['Tip %', 'Tip', 'Total', 'Per person'], rows: pcts.map((p) => { const x = tip(bill, p, n, +v.tax || 0, v.base === 'pre', 'none'); return [p + '%', usd2(x.tip), usd2(x.total), usd2(x.each)]; }) },
    };
  },
  answer: {
    text: (r) =>
      `An 18% tip on an <strong>$86.40</strong> bill ($80 before $6.40 tax) is <strong>${r.rows![0].value}</strong>, making the total ${r.rows![1].value}. Split three ways, <strong>each person pays ${r.primary.value}</strong>. Quick trick: 10% is the bill with the decimal moved one place; double it for 20%.`,
  },
  intro: [
    'A tip calculator works out the gratuity, the new total and each person’s share in one go. In the US, tipping 15–20% at sit-down restaurants is customary, and service workers often rely on tips for a large part of their income.',
    'Etiquette guides traditionally suggest tipping on the pre-tax amount, so this calculator lets you subtract tax first. You can also round each share up to a whole dollar to make paying in cash or by app easier.',
  ],
  formula: {
    expr: 'Tip = (bill − tax) × tip%\nTotal = bill + tip\nPer person = total ÷ people',
    vars: [['Round up', 'each share rounded up to the next whole dollar; the extra goes to the tip']],
  },
  examples: [
    { title: 'Dinner for 4, 20%', inputs: { bill: 142.5, pct: 20, people: 4, tax: 10.5 }, explain: (r) => `${r.primary.value} each, including ${r.rows![2].value} tip.` },
    { title: 'Solo lunch, 15%', inputs: { bill: 18.75, pct: 15, people: 1, tax: 1.25 }, explain: (r) => `Tip ${r.rows![0].value}; total ${r.rows![1].value}.` },
    { title: 'Round up for 6 people', inputs: { bill: 231.2, pct: 18, people: 6, tax: 17.2, round: 'up' }, explain: (r) => `${r.primary.value} each — a little extra for the server.` },
  ],
  analysis() {
    return [
      {
        title: 'Tipping customs differ by country',
        insight: 'Expectations vary widely. In the US and Canada tips are a major part of service pay; in Japan tipping can be seen as awkward; across much of Europe a service charge is often included or a small round-up is enough. Always check the bill for an included service charge.',
        table: {
          head: ['Country', 'Restaurant norm (general guide)'],
          rows: [
            ['United States', '15–20%+ of pre-tax bill'],
            ['Canada', '15–20%'],
            ['United Kingdom', '10–12.5% if no service charge'],
            ['France / Italy', 'Service usually included; round up'],
            ['Germany', 'Round up or ~5–10%'],
            ['Australia', 'Not expected; 10% for great service'],
            ['Japan', 'Not customary'],
            ['India', '~10% if no service charge'],
          ],
        },
      },
    ];
  },
  variantQs: [
    { q: 'Is this a split bill calculator?', a: 'Yes. Set “Split between” to the number of people and each share — tip included — is the headline number.' },
    { q: 'What is a gratuity calculator?', a: 'Gratuity is another word for tip. Some restaurants add an automatic gratuity for large groups; if so, don’t tip twice.' },
  ],
  tips: [
    'Check for an included service charge before tipping.',
    'For takeout, tipping is optional; 10% is a common gesture.',
    'Tip on the pre-discount price when using coupons or gift cards.',
  ],
  faqs: [
    { q: 'How much should I tip at a restaurant?', a: 'In the US, 15% for adequate service, 18–20% for good service and more for exceptional service.' },
    { q: 'Should I tip on the total with tax?', a: 'Etiquette guides traditionally recommend tipping on the pre-tax amount, though many people tip on the total. The difference is small.' },
    { q: 'How do I calculate a 20% tip quickly?', a: 'Move the decimal point one place left to get 10%, then double it. On $45, 10% is $4.50, so 20% is $9.' },
    { q: 'How do I split a bill with a tip?', a: 'Add the tip to the bill, then divide by the number of people.' },
  ],
  sources: [{ label: 'Emily Post Institute – General tipping guide', url: 'https://emilypost.com/advice/general-tipping-guide' }],
  related: ['percentage-calculator', 'paycheck-calculator', 'average-calculator'],
};
export default calc;
