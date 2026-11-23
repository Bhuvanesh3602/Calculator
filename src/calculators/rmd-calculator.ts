import { usd, usd2, pct } from '../lib/format';
import type { Calculator } from '../lib/types';

/** IRS Uniform Lifetime Table (Pub. 590-B, Appendix B, Table III, effective 2022+). */
export const ULT: Record<number, number> = {
  72: 27.4, 73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0, 79: 21.1, 80: 20.2, 81: 19.4, 82: 18.5, 83: 17.7, 84: 16.8, 85: 16.0,
  86: 15.2, 87: 14.4, 88: 13.7, 89: 12.9, 90: 12.2, 91: 11.5, 92: 10.8, 93: 10.1, 94: 9.5, 95: 8.9, 96: 8.4, 97: 7.8, 98: 7.3, 99: 6.8,
  100: 6.4, 101: 6.0, 102: 5.6, 103: 5.2, 104: 4.9, 105: 4.6, 106: 4.3, 107: 4.1, 108: 3.9, 109: 3.7, 110: 3.5, 111: 3.4, 112: 3.3,
  113: 3.1, 114: 3.0, 115: 2.9, 116: 2.8, 117: 2.7, 118: 2.5, 119: 2.3, 120: 2.0,
};
export const rmdStartAge = (birthYear: number) => (birthYear <= 1950 ? 72 : birthYear <= 1959 ? 73 : 75);

export function project(balance: number, age: number, growth: number, startAge: number) {
  const out: { age: number; balance: number; rmd: number }[] = [];
  let b = balance;
  for (let a = age; a <= 100; a++) {
    const rmd = a >= startAge ? b / ULT[Math.min(120, a)] : 0;
    out.push({ age: a, balance: b, rmd });
    b = (b - rmd) * (1 + growth / 100);
  }
  return out;
}

const calc: Calculator = {
  slug: 'rmd-calculator',
  name: 'RMD Calculator',
  short: 'RMD',
  category: 'payroll',
  keyword: 'rmd calculator',
  volume: 110000,
  variants: ['required minimum distribution calculator', 'ira rmd calculator', '401k rmd calculator', 'rmd table'],
  title: 'RMD Calculator – Required Minimum Distribution by Age (2026)',
  description:
    'Calculate your required minimum distribution from an IRA or 401(k) with the IRS Uniform Lifetime Table, your SECURE 2.0 start age and future RMDs.',
  accent: 'with the IRS table',
  icon: 'R',
  inputs: [
    { id: 'balance', label: 'Account balance on Dec 31 last year', type: 'number', default: 500000, min: 0, step: 1000, prefix: '$' },
    { id: 'birth', label: 'Year of birth', type: 'number', default: 1952, min: 1920, max: 1990, step: 1 },
    { id: 'year', label: 'Distribution year', type: 'number', default: 2026, min: 2023, max: 2070, step: 1 },
    { id: 'growth', label: 'Expected annual growth', type: 'number', default: 5, min: -10, max: 15, step: 0.5, suffix: '%' },
  ],
  compute(v) {
    const bal = +v.balance,
      age = +v.year - +v.birth;
    const start = rmdStartAge(+v.birth);
    if (!(bal >= 0)) return { primary: { label: '', value: '' }, error: 'Enter your balance.' };
    const proj = project(bal, Math.max(age, 60), +v.growth, start).filter((p) => p.age <= 100);
    if (age < start) {
      return {
        primary: { label: `No RMD due for ${v.year}`, value: `Starts at ${start}` },
        rows: [
          { label: 'Your age in ' + v.year, value: String(age) },
          { label: 'First RMD year', value: String(+v.birth + start) },
          { label: 'Deadline for first RMD', value: `April 1, ${+v.birth + start + 1}` },
        ],
        chart: rmdChart(proj),
      };
    }
    const div = ULT[Math.min(120, age)];
    const rmd = bal / div;
    return {
      primary: { label: `Your ${v.year} RMD`, value: usd2(rmd) },
      rows: [
        { label: 'Age at end of ' + v.year, value: String(age) },
        { label: 'IRS life-expectancy factor', value: String(div) },
        { label: 'Share of balance', value: pct((1 / div) * 100, 2) },
        { label: 'Monthly equivalent', value: usd2(rmd / 12) },
        { label: 'Deadline', value: age === start ? `April 1, ${+v.year + 1} (first RMD)` : `December 31, ${v.year}` },
      ],
      chart: rmdChart(proj),
    };
  },
  answer: {
    text: (r, v) =>
      `Someone born in ${v.birth} with <strong>$${(+v.balance).toLocaleString('en-US')}</strong> in a traditional IRA turns ${+v.year - +v.birth} in ${v.year}. The IRS factor for that age is ${r.rows![1].value}, so the required minimum distribution is <strong>${r.primary.value}</strong> (balance ÷ factor).`,
  },
  intro: [
    'A required minimum distribution (RMD) is the smallest amount the IRS requires you to withdraw each year from traditional IRAs, 401(k)s, 403(b)s and similar tax-deferred accounts once you reach your RMD age. Missing it triggers an excise tax on the shortfall.',
    'This RMD calculator uses the IRS Uniform Lifetime Table and the SECURE 2.0 start ages: 73 for people born 1951–1959, and 75 for those born in 1960 or later. It also projects how your RMDs and balance could evolve at an assumed growth rate.',
  ],
  formula: {
    expr: 'RMD = Prior Dec 31 balance ÷ Distribution period (Uniform Lifetime Table)',
    vars: [
      ['Distribution period', 'IRS factor for your age at the end of the distribution year'],
      ['Start age', '72 if born ≤1950 · 73 if born 1951–1959 · 75 if born ≥1960'],
    ],
    notes: [
      'If your spouse is the sole beneficiary and more than 10 years younger, the IRS Joint Life table gives a smaller RMD. Inherited IRAs follow different rules. Roth IRAs have no RMDs for the original owner, and since 2024 neither do Roth 401(k)s.',
    ],
  },
  examples: [
    { title: 'Age 75, $750k IRA', inputs: { balance: 750000, birth: 1951, year: 2026 }, explain: (r) => `Factor ${r.rows![1].value} → RMD ${r.primary.value}.` },
    { title: 'Age 85, $300k', inputs: { balance: 300000, birth: 1941, year: 2026 }, explain: (r) => `At 85 the factor is 16.0, so you must take ${r.rows![2].value} of the balance.` },
    { title: 'Born 1962', inputs: { balance: 400000, birth: 1962, year: 2026 }, explain: () => `Born after 1959, RMDs start at 75 — in 2037.` },
  ],
  analysis() {
    const ages = [73, 75, 80, 85, 90, 95, 100];
    const share = ages.map((a) => 100 / ULT[a]);
    const p = project(1000000, 73, 5, 73).filter((x) => x.age <= 95);
    const peak = p.reduce((m, x) => (x.rmd > m.rmd ? x : m), p[0]);
    return [
      {
        title: 'The required withdrawal share rises every year',
        insight: `At 73 you must withdraw <strong>${pct(share[0], 2)}</strong> of your balance; at 85, ${pct(share[3], 2)}; at 95, ${pct(share[5], 2)}. Early RMDs are usually below what a balanced portfolio earns, so many balances keep growing into the 80s.`,
        chart: { type: 'bar', title: 'RMD as % of balance by age', x: ages.map((a) => 'Age ' + a), series: [{ name: 'Required share', values: share }], y: 'pct', xTitle: 'Age' },
      },
      {
        title: '$1 million at 73, growing at 5%',
        insight: `If the account earns 5% a year, the RMD starts at ${usd(p[0].rmd)} and peaks at about <strong>${usd(peak.rmd)} at age ${peak.age}</strong>, because rising percentages meet a balance that is still growing. Plan for taxable income to rise in your 80s.`,
        chart: {
          type: 'line',
          title: 'Projected RMDs, $1M at 73, 5% growth',
          x: p.map((x) => x.age),
          series: [{ name: 'Annual RMD', values: p.map((x) => x.rmd) }],
          y: 'usd',
          xTitle: 'Age',
          markIndex: p.indexOf(peak),
        },
      },
    ];
  },
  variantQs: [
    { q: 'Is there a separate IRA RMD calculator and 401(k) RMD calculator?', a: 'The formula is the same for both. The difference is aggregation: you can total RMDs from several IRAs and take them from any one IRA, but each 401(k) RMD must come from that plan.' },
    { q: 'Where is the RMD table?', a: 'See the reference table below — it is the IRS Uniform Lifetime Table used by most account owners.' },
  ],
  tips: [
    'Delaying the first RMD to April 1 of the next year means taking two RMDs in one tax year.',
    'Qualified charitable distributions (QCDs) from an IRA can satisfy your RMD without adding to taxable income.',
    'Still working? You may be able to delay RMDs from your current employer’s 401(k) if you don’t own 5% or more of the company.',
    'Take RMDs in kind (as shares) if you want to stay invested in a taxable account.',
  ],
  faqs: [
    { q: 'How is an RMD calculated?', a: 'Divide your account balance on December 31 of the prior year by the IRS distribution period for your age. At 75 the factor is 24.6, so a $500,000 balance gives an RMD of about ' + usd2(500000 / 24.6) + '.' },
    { q: 'What age do RMDs start?', a: 'Under SECURE 2.0: age 73 if you were born 1951–1959, and 75 if born in 1960 or later. People born in 1950 or earlier already started at 72 or 70½.' },
    { q: 'What happens if I miss an RMD?', a: 'The excise tax is 25% of the amount not taken, reduced to 10% if you correct it within two years. You can request a waiver for reasonable error with Form 5329.' },
    { q: 'Are RMDs taxed?', a: 'Yes. Distributions from pre-tax accounts are taxed as ordinary income. Qualified Roth distributions are tax-free.' },
    { q: 'Do Roth IRAs have RMDs?', a: 'Not for the original owner. Beneficiaries who inherit a Roth IRA generally do face distribution rules.' },
  ],
  sources: [
    { label: 'IRS – Retirement plan and IRA required minimum distributions FAQs', url: 'https://www.irs.gov/retirement-plans/retirement-plan-and-ira-required-minimum-distributions-faqs' },
    { label: 'IRS Publication 590-B, Appendix B', url: 'https://www.irs.gov/publications/p590b' },
  ],
  related: ['investment-calculator', 'paycheck-calculator', 'compound-interest-calculator', 'inflation-calculator'],
  disclaimer: 'tax',
  reference: {
    caption: 'IRS Uniform Lifetime Table (selected ages)',
    source: 'IRS Publication 590-B, Table III',
    asOf: 'distribution years 2022 onward',
    head: ['Age', 'Distribution period', 'RMD % of balance'],
    rows: [72, 73, 74, 75, 76, 77, 78, 79, 80, 82, 84, 86, 88, 90, 92, 95, 100].map((a) => [a, ULT[a], pct(100 / ULT[a], 2)]),
  },
};

function rmdChart(p: { age: number; rmd: number; balance: number }[]) {
  return {
    type: 'bar' as const,
    title: 'Projected yearly RMD',
    x: p.map((x) => x.age),
    series: [{ name: 'RMD', values: p.map((x) => x.rmd) }],
    y: 'usd' as const,
    xTitle: 'Age',
  };
}
export default calc;
