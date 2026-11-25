import {
  BRACKETS,
  STANDARD_DEDUCTION,
  STATES,
  TAX_YEAR,
  SS_RATE,
  SS_WAGE_BASE,
  MEDICARE_RATE,
  ADDL_MEDICARE_RATE,
  ADDL_MEDICARE_THRESHOLD,
  federalTax,
  marginalRate,
  type Filing,
} from '../lib/data/tax2026';
import { usd, pct } from '../lib/format';
import type { Calculator, Values } from '../lib/types';

/** 2026 Child Tax Credit per qualifying child under 17 (IRS Rev. Proc. 2025-32) and its phase-out. */
export const CTC_PER_CHILD = 2200;
const CTC_PHASEOUT: Record<Filing, number> = { single: 200000, married: 400000, hoh: 200000 };

export function incomeTax(v: Values) {
  const filing = (v.filing || 'single') as Filing;
  const wages = +v.wages || 0,
    other = +v.other || 0,
    pretax = Math.min(+v.pretax || 0, wages);
  const agi = Math.max(0, wages + other - pretax);
  const std = STANDARD_DEDUCTION[filing];
  const itemized = +v.itemized || 0;
  const deduction = v.deduct === 'itemized' ? itemized : std;
  const taxable = Math.max(0, agi - deduction);
  const before = federalTax(taxable, filing);
  const kids = Math.max(0, Math.round(+v.kids || 0));
  const ctcFull = kids * CTC_PER_CHILD;
  const ctc = Math.max(0, ctcFull - Math.ceil(Math.max(0, agi - CTC_PHASEOUT[filing]) / 1000) * 50);
  const otherCredits = +v.credits || 0;
  const fed = Math.max(0, before - ctc - otherCredits);
  const st = STATES.find((s) => s.value === v.state);
  const stateRate = st?.rate ?? (+v.stateRate || 0);
  const state = (agi * stateRate) / 100;
  const ficaWages = Math.max(0, wages - (v.pretaxType === 'k401' ? 0 : pretax));
  const fica = Math.min(ficaWages, SS_WAGE_BASE) * SS_RATE + ficaWages * MEDICARE_RATE + Math.max(0, ficaWages - ADDL_MEDICARE_THRESHOLD[filing]) * ADDL_MEDICARE_RATE;
  const withheld = +v.withheld || 0;
  // Bracket-by-bracket breakdown
  const parts: { rate: number; amount: number; tax: number }[] = [];
  let lower = 0;
  for (const [upper, rate] of BRACKETS[filing]) {
    if (taxable <= lower) break;
    const amt = Math.min(taxable, upper) - lower;
    parts.push({ rate, amount: amt, tax: amt * rate });
    lower = upper;
  }
  return { filing, agi, deduction, std, taxable, before, ctc, otherCredits, fed, state, stateRate, fica, withheld, refund: withheld - fed, parts, gross: wages + other, marginal: marginalRate(taxable, filing) };
}

const calc: Calculator = {
  slug: 'income-tax-calculator',
  name: 'Income Tax Calculator',
  short: 'Income Tax',
  category: 'payroll',
  keyword: 'income tax calculator',
  volume: 246000,
  variants: ['federal income tax calculator', 'tax refund calculator', 'tax bracket calculator', 'effective tax rate calculator', `${TAX_YEAR} tax calculator`],
  title: `Income Tax Calculator ${TAX_YEAR} – Federal Tax, Refund & Brackets`,
  description: `Estimate your ${TAX_YEAR} federal income tax, refund or amount owed, effective and marginal rates, and see exactly how much falls in each tax bracket.`,
  accent: 'bracket by bracket',
  icon: '§',
  inputs: [
    {
      id: 'filing',
      label: 'Filing status',
      type: 'select',
      default: 'single',
      options: [
        { value: 'single', label: 'Single' },
        { value: 'married', label: 'Married filing jointly' },
        { value: 'hoh', label: 'Head of household' },
      ],
    },
    { id: 'wages', label: 'Wages and salary (W-2 box 1 before pre-tax)', type: 'number', default: 85000, min: 0, step: 1000, prefix: '$' },
    { id: 'other', label: 'Other taxable income (interest, side income)', type: 'number', default: 2500, min: 0, step: 100, prefix: '$' },
    { id: 'pretax', label: 'Pre-tax contributions (401k, HSA)', type: 'number', default: 6000, min: 0, step: 500, prefix: '$' },
    {
      id: 'pretaxType',
      label: 'Pre-tax contributions are mainly',
      type: 'select',
      default: 'k401',
      options: [
        { value: 'k401', label: '401(k) / 403(b) – still pay FICA' },
        { value: 'hsa', label: 'HSA / health premiums via payroll – no FICA' },
      ],
    },
    {
      id: 'deduct',
      label: 'Deduction',
      type: 'select',
      default: 'standard',
      options: [
        { value: 'standard', label: 'Standard deduction' },
        { value: 'itemized', label: 'Itemize (enter total)' },
      ],
    },
    { id: 'itemized', label: 'Itemized deductions total', type: 'number', default: 22000, min: 0, step: 500, prefix: '$', showIf: { field: 'deduct', in: ['itemized'] } },
    { id: 'kids', label: 'Children under 17', type: 'number', default: 0, min: 0, max: 15, step: 1, suffix: 'children' },
    { id: 'credits', label: 'Other tax credits', type: 'number', default: 0, min: 0, step: 100, prefix: '$' },
    { id: 'withheld', label: 'Federal tax already withheld this year', type: 'number', default: 9500, min: 0, step: 100, prefix: '$', help: 'Year-to-date figure from your last pay stub, projected to December, plus any estimated payments.' },
    { id: 'state', label: 'State', type: 'select', default: 'none', options: STATES.map((s) => ({ value: s.value, label: s.label })) },
    { id: 'stateRate', label: 'State effective tax rate', type: 'number', default: 4, min: 0, max: 15, step: 0.1, suffix: '%', showIf: { field: 'state', in: ['custom'] } },
  ],
  compute(v) {
    const t = incomeTax(v);
    if (t.gross <= 0) return { primary: { label: '', value: '' }, error: 'Enter your income.' };
    const eff = t.gross > 0 ? (t.fed / t.gross) * 100 : 0;
    const total = t.fed + t.state + t.fica;
    return {
      primary: { label: `${TAX_YEAR} federal income tax`, value: usd(t.fed) },
      rows: [
        { label: t.refund >= 0 ? 'Estimated refund' : 'Estimated amount owed', value: usd(Math.abs(t.refund)) },
        { label: 'Adjusted gross income (AGI)', value: usd(t.agi) },
        { label: t.deduction === t.std ? 'Standard deduction' : 'Itemized deductions', value: usd(t.deduction) },
        { label: 'Taxable income', value: usd(t.taxable) },
        { label: 'Tax before credits', value: usd(t.before) },
        ...(t.ctc + t.otherCredits > 0 ? [{ label: 'Credits applied', value: usd(Math.min(t.before, t.ctc + t.otherCredits)) }] : []),
        { label: 'Marginal tax bracket', value: pct(t.marginal * 100, 0) },
        { label: 'Effective federal rate (of total income)', value: pct(eff, 2) },
        ...(t.state > 0 ? [{ label: `State income tax (${pct(t.stateRate, 2)})`, value: usd(t.state) }] : []),
        { label: 'Social Security + Medicare (FICA)', value: usd(t.fica) },
        { label: 'All income and payroll taxes', value: `${usd(total)} (${pct((total / t.gross) * 100, 1)})` },
      ],
      note: v.deduct === 'itemized' && +v.itemized < t.std ? `Your itemized total is below the ${usd(t.std)} standard deduction, so the standard deduction would save more.` : undefined,
      chart: {
        type: 'bar',
        title: 'Tax owed in each bracket',
        x: t.parts.map((p) => pct(p.rate * 100, 0)),
        series: [{ name: 'Tax', values: t.parts.map((p) => p.tax) }],
        y: 'usd',
        xTitle: 'Bracket',
      },
      table: { head: ['Bracket', 'Income taxed at this rate', 'Tax'], rows: t.parts.map((p) => [pct(p.rate * 100, 0), usd(p.amount), usd(p.tax)]) },
      steps: [
        `AGI = ${usd(t.gross)} income − ${usd(t.gross - t.agi)} pre-tax = ${usd(t.agi)}`,
        `Taxable = ${usd(t.agi)} − ${usd(t.deduction)} deduction = ${usd(t.taxable)}`,
        ...t.parts.map((p) => `${pct(p.rate * 100, 0)} × ${usd(p.amount)} = ${usd(p.tax)}`),
        `Tax ${usd(t.before)} − credits ${usd(Math.min(t.before, t.ctc + t.otherCredits))} = ${usd(t.fed)}`,
        `${t.refund >= 0 ? 'Refund' : 'Owed'} = withheld ${usd(t.withheld)} − tax ${usd(t.fed)} = ${usd(Math.abs(t.refund))}`,
      ],
    };
  },
  answer: {
    text: (r) =>
      `A single filer earning <strong>$85,000</strong> in wages plus $2,500 of other income, with $6,000 in 401(k) contributions, has ${r.rows![3].value} of taxable income in ${TAX_YEAR}. That gives <strong>${r.primary.value}</strong> in federal income tax. With $9,500 withheld, the ${r.rows![0].label.toLowerCase()} is <strong>${r.rows![0].value}</strong>.`,
  },
  intro: [
    `This income tax calculator estimates your ${TAX_YEAR} US federal income tax from your income, filing status, deductions and credits. It also works out the refund or balance due, using what has already been withheld from your pay.`,
    'Many people believe that moving into a higher bracket raises the tax on all their income. It does not: each rate applies only to the slice of income inside that bracket. To show this, the calculator lists the income and tax in every bracket, alongside your effective rate (what you actually pay) and your marginal rate (the rate on your next dollar).',
  ],
  formula: {
    expr: 'AGI = income − pre-tax contributions\nTaxable income = AGI − standard or itemized deduction\nTax = Σ (income inside each bracket × bracket rate) − credits\nRefund = withholding − tax',
    vars: [
      ['Child Tax Credit', `${usd(CTC_PER_CHILD)} per child under 17, reduced by $50 per $1,000 of AGI above $200,000 ($400,000 married)`],
      ['FICA', '6.2% Social Security up to the wage base + 1.45% Medicare (+0.9% above $200k single / $250k joint)'],
    ],
    notes: [
      'This is an estimate for ordinary income. It does not model capital-gains rates, self-employment tax, the alternative minimum tax, the extra deduction for people 65 and over, or refundability limits on the Child Tax Credit.',
    ],
  },
  examples: [
    { title: 'Married couple, two kids', inputs: { filing: 'married', wages: 140000, other: 0, pretax: 12000, kids: 2, withheld: 9000 }, explain: (r) => `Tax ${r.primary.value}; ${r.rows![0].label.toLowerCase()} ${r.rows![0].value}.` },
    { title: 'Head of household, $55k', inputs: { filing: 'hoh', wages: 55000, other: 0, pretax: 2000, kids: 1, withheld: 2500 }, explain: (r) => `Tax ${r.primary.value} — effective rate ${r.rows!.find((x) => x.label.startsWith('Effective'))!.value}.` },
    { title: 'High earner, itemizing in Illinois', inputs: { wages: 260000, other: 15000, pretax: 24500, deduct: 'itemized', itemized: 38000, withheld: 52000, state: 'IL' }, explain: (r) => `Federal ${r.primary.value}, ${r.rows!.find((x) => x.label.startsWith('Marginal'))!.value} bracket.` },
  ],
  analysis() {
    const incomes = [25000, 50000, 75000, 100000, 150000, 200000, 300000, 500000, 1000000];
    const eff = (inc: number, f: Filing) => (federalTax(Math.max(0, inc - STANDARD_DEDUCTION[f]), f) / inc) * 100;
    return [
      {
        title: 'Effective rate vs top bracket: the gap most people miss',
        insight: `A single filer with $100,000 of income is in the 22% bracket, but pays an effective federal rate of only <strong>${pct(eff(100000, 'single'), 1)}</strong>. The standard deduction and the 10% and 12% brackets keep the average far below the top rate. Even at $1 million, the effective rate (${pct(eff(1000000, 'single'), 1)}) stays under the 37% top bracket.`,
        chart: {
          type: 'line',
          title: `Effective federal income-tax rate, ${TAX_YEAR} (standard deduction)`,
          x: incomes.map((i) => (i >= 1e6 ? '$1M' : '$' + i / 1000 + 'k')),
          series: [
            { name: 'Single', values: incomes.map((i) => eff(i, 'single')) },
            { name: 'Married jointly', values: incomes.map((i) => eff(i, 'married')) },
          ],
          y: 'pct',
          xTitle: 'Total income',
        },
      },
      {
        title: 'What a $1,000 raise really costs in tax',
        insight: 'Only the extra $1,000 is taxed at your marginal rate. Moving into a higher bracket never reduces take-home pay. A single filer with $60,000 of taxable income pays $220 on the next $1,000: 22% of the raise, while the rest of their income is taxed exactly as before.',
        table: {
          head: ['Taxable income', 'Marginal rate', 'Tax on next $1,000'],
          rows: [20000, 60000, 110000, 220000, 300000, 700000].map((x) => [usd(x), pct(marginalRate(x, 'single') * 100, 0), usd(federalTax(x + 1000, 'single') - federalTax(x, 'single'))]),
        },
      },
    ];
  },
  variantQs: [
    { q: 'Is this a tax refund calculator?', a: 'Yes. Enter the federal tax withheld (from your last pay stub, projected to year end), and the calculator shows your estimated refund or the amount you will owe.' },
    { q: 'Which tax bracket am I in?', a: `Your bracket is the rate on the top slice of your taxable income. It is shown as “Marginal tax bracket” above, and the full ${TAX_YEAR} table is below.` },
    { q: 'What is my effective tax rate?', a: 'It is your total federal income tax divided by your total income. It is always lower than your bracket, because lower rates apply to the first part of your income.' },
  ],
  tips: [
    'Contributing to a traditional 401(k) or HSA cuts taxable income dollar for dollar, saving tax at your marginal rate.',
    'Itemize only if your mortgage interest, state and local taxes (SALT), and charitable gifts add up to more than the standard deduction.',
    'If you owe a lot, adjust your W-4 now to avoid a large bill and a possible underpayment penalty.',
  ],
  faqs: [
    { q: 'How is federal income tax calculated?', a: 'Take total income, subtract pre-tax contributions to get AGI, then subtract the standard or itemized deduction. Apply each bracket rate to the income inside that bracket, add the results, and subtract credits.' },
    { q: `What is the ${TAX_YEAR} standard deduction?`, a: `${usd(STANDARD_DEDUCTION.single)} for single filers, ${usd(STANDARD_DEDUCTION.married)} for married couples filing jointly and ${usd(STANDARD_DEDUCTION.hoh)} for heads of household.` },
    { q: 'Does a raise put me in a higher bracket and lower my pay?', a: 'No. Only the income above the bracket threshold is taxed at the higher rate, so take-home pay always rises with a raise.' },
    { q: 'What is the difference between a deduction and a credit?', a: 'A deduction lowers taxable income, so it saves tax at your marginal rate. A credit is subtracted from the tax itself, so a $1,000 credit saves $1,000.' },
    { q: 'Does this include state tax?', a: 'You can add a flat state rate. States with graduated rates are approximated by entering your effective state rate.' },
  ],
  sources: [
    { label: 'IRS – Federal income tax rates and brackets', url: 'https://www.irs.gov/filing/federal-income-tax-rates-and-brackets' },
    { label: 'IRS Rev. Proc. 2025-32 – 2026 inflation adjustments', url: 'https://www.irs.gov/pub/irs-drop/rp-25-32.pdf' },
    { label: 'IRS – Child Tax Credit', url: 'https://www.irs.gov/credits-deductions/individuals/child-tax-credit' },
  ],
  related: ['paycheck-calculator', 'salary-calculator', 'payroll-calculator', 'retirement-calculator', 'sales-tax-calculator'],
  disclaimer: 'tax',
  reference: {
    caption: `${TAX_YEAR} Federal Income Tax Brackets`,
    asOf: `tax year ${TAX_YEAR} (returns filed in ${TAX_YEAR + 1})`,
    source: 'IRS Rev. Proc. 2025-32',
    head: ['Rate', 'Single', 'Married filing jointly', 'Head of household'],
    rows: BRACKETS.single.map(([, rate], i) => {
      const r = (f: Filing) => {
        const lo = i === 0 ? 0 : BRACKETS[f][i - 1][0] + 1;
        const hi = BRACKETS[f][i][0];
        return hi === Infinity ? `over ${usd(lo - 1)}` : `${usd(lo)} – ${usd(hi)}`;
      };
      return [pct(rate * 100, 0), r('single'), r('married'), r('hoh')];
    }),
  },
};
export default calc;
