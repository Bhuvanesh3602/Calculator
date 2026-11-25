import { usd2, num, pct } from '../lib/format';
import type { Calculator, Values } from '../lib/types';

export type TvmKey = 'n' | 'rate' | 'pv' | 'pmt' | 'fv';
export interface Tvm {
  n: number;
  /** annual nominal rate, % */
  rate: number;
  pv: number;
  pmt: number;
  fv: number;
  /** periods per year */
  ppy: number;
  begin: boolean;
}

/** Residual of the time-value-of-money equation; zero when the five values agree. Cash paid out is negative. */
export function tvmResidual(t: Tvm) {
  const i = t.rate / 100 / t.ppy;
  const k = t.begin ? 1 + i : 1;
  if (Math.abs(i) < 1e-12) return t.pv + t.pmt * t.n + t.fv;
  const g = Math.pow(1 + i, t.n);
  return t.pv * g + t.pmt * k * ((g - 1) / i) + t.fv;
}

/** Solve for any one TVM variable, like the TVM keys of a financial calculator. Returns NaN if no solution. */
export function solveTvm(t: Tvm, key: TvmKey): number {
  const i = t.rate / 100 / t.ppy;
  const k = t.begin ? 1 + i : 1;
  const zero = Math.abs(i) < 1e-12;
  const g = Math.pow(1 + i, t.n);
  const ann = zero ? t.n : (k * (g - 1)) / i; // value of a 1-per-period annuity at period n
  switch (key) {
    case 'fv':
      return -(t.pv * g + t.pmt * ann);
    case 'pv':
      return -(t.fv + t.pmt * ann) / g;
    case 'pmt':
      return ann === 0 ? NaN : -(t.fv + t.pv * g) / ann;
    case 'n': {
      if (zero) return t.pmt === 0 ? NaN : -(t.pv + t.fv) / t.pmt;
      const a = (t.pmt * k) / i;
      const ratio = (a - t.fv) / (a + t.pv);
      return ratio > 0 ? Math.log(ratio) / Math.log(1 + i) : NaN;
    }
    case 'rate': {
      // Scan for a sign change in the residual, then bisect. Rates from −99% to +500% a year.
      const f = (r: number) => tvmResidual({ ...t, rate: r });
      let prev = f(-99);
      for (let r = -98.75; r <= 500; r += 0.25) {
        const cur = f(r);
        if (Math.sign(cur) !== Math.sign(prev)) {
          let a = r - 0.25,
            b = r;
          for (let it = 0; it < 200; it++) {
            const m = (a + b) / 2;
            if (Math.sign(f(m)) === Math.sign(f(a))) a = m;
            else b = m;
          }
          return (a + b) / 2;
        }
        prev = cur;
      }
      return NaN;
    }
  }
}

const LABEL: Record<TvmKey, string> = { n: 'Number of periods (N)', rate: 'Annual interest rate (I/Y)', pv: 'Present value (PV)', pmt: 'Payment per period (PMT)', fv: 'Future value (FV)' };

function read(v: Values): Tvm {
  return { n: +v.n, rate: +v.rate, pv: +v.pv || 0, pmt: +v.pmt || 0, fv: +v.fv || 0, ppy: +v.ppy || 12, begin: v.timing === 'begin' };
}

const notSolved = (key: TvmKey) => ({ field: 'solve', in: (['n', 'rate', 'pv', 'pmt', 'fv'] as TvmKey[]).filter((x) => x !== key) });

const calc: Calculator = {
  slug: 'finance-calculator',
  name: 'Finance Calculator',
  short: 'Finance (TVM)',
  category: 'finance',
  keyword: 'finance calculator',
  volume: 49500,
  variants: ['time value of money calculator', 'tvm calculator', 'financial calculator', 'future value calculator', 'present value calculator', 'ba ii plus online'],
  title: 'Finance Calculator – Solve N, I/Y, PV, PMT or FV (TVM)',
  description:
    'Online time-value-of-money calculator. Enter any four of N, I/Y, PV, PMT and FV to solve the fifth, with payments at the start or end, plus a full schedule.',
  accent: 'solve for any one',
  icon: 'Σ',
  inputs: [
    {
      id: 'solve',
      label: 'Solve for',
      type: 'select',
      default: 'fv',
      options: [
        { value: 'fv', label: 'Future value (FV)' },
        { value: 'pv', label: 'Present value (PV)' },
        { value: 'pmt', label: 'Payment (PMT)' },
        { value: 'n', label: 'Number of periods (N)' },
        { value: 'rate', label: 'Interest rate (I/Y)' },
      ],
    },
    { id: 'n', label: 'N – number of periods', type: 'number', default: 120, min: 0, max: 1200, step: 1, suffix: 'periods', showIf: notSolved('n') },
    { id: 'rate', label: 'I/Y – annual interest rate', type: 'number', default: 6, min: -50, max: 100, step: 0.01, suffix: '%', showIf: notSolved('rate') },
    { id: 'pv', label: 'PV – present value', type: 'number', default: -10000, step: 100, prefix: '$', help: 'Money you pay out is negative; money you receive is positive.', showIf: notSolved('pv') },
    { id: 'pmt', label: 'PMT – payment each period', type: 'number', default: -200, step: 10, prefix: '$', showIf: notSolved('pmt') },
    { id: 'fv', label: 'FV – future value', type: 'number', default: 0, step: 100, prefix: '$', showIf: notSolved('fv') },
    {
      id: 'ppy',
      label: 'Periods per year (P/Y)',
      type: 'select',
      default: '12',
      options: [
        { value: '12', label: 'Monthly (12)' },
        { value: '4', label: 'Quarterly (4)' },
        { value: '2', label: 'Semi-annually (2)' },
        { value: '1', label: 'Annually (1)' },
        { value: '26', label: 'Bi-weekly (26)' },
        { value: '52', label: 'Weekly (52)' },
      ],
    },
    {
      id: 'timing',
      label: 'Payments made',
      type: 'select',
      default: 'end',
      options: [
        { value: 'end', label: 'End of each period (ordinary annuity)' },
        { value: 'begin', label: 'Start of each period (annuity due)' },
      ],
    },
  ],
  compute(v) {
    const key = v.solve as TvmKey;
    const t = read(v);
    if (key !== 'n' && !(t.n > 0)) return { primary: { label: '', value: '' }, error: 'N must be greater than zero.' };
    const ans = solveTvm(t, key);
    if (!isFinite(ans)) return { primary: { label: '', value: '' }, error: 'No solution for these values. Check the signs: at least one cash flow must be negative (paid out) and one positive (received).' };
    const s: Tvm = { ...t, [key]: ans };
    const i = s.rate / 100 / s.ppy;
    const show = (k: TvmKey, x: number) => (k === 'n' ? `${num(x, 2)} (${num(x / s.ppy, 2)} years)` : k === 'rate' ? pct(x, 4) : usd2(x));
    // Schedule
    const nInt = Math.max(0, Math.min(1200, Math.ceil(s.n - 1e-9)));
    let bal = s.pv;
    const rows: (string | number)[][] = [];
    const balances = [bal];
    let totalInt = 0;
    for (let p = 1; p <= nInt; p++) {
      if (s.begin) bal += s.pmt;
      const interest = bal * i;
      bal += interest;
      if (!s.begin) bal += s.pmt;
      totalInt += interest;
      balances.push(bal);
      if (p % s.ppy === 0 || p === nInt || nInt <= 36) rows.push([p, usd2(s.pmt), usd2(interest), usd2(bal)]);
    }
    const step = Math.max(1, Math.ceil(balances.length / 60));
    const idx = balances.map((_, j) => j).filter((j) => j % step === 0 || j === balances.length - 1);
    const effective = s.ppy > 0 ? (Math.pow(1 + i, s.ppy) - 1) * 100 : 0;
    return {
      primary: { label: LABEL[key], value: show(key, ans) },
      rows: [
        ...(['n', 'rate', 'pv', 'pmt', 'fv'] as TvmKey[]).filter((k) => k !== key).map((k) => ({ label: LABEL[k], value: show(k, s[k]) })),
        { label: 'Rate per period', value: pct(i * 100, 4) },
        { label: 'Effective annual rate', value: pct(effective, 3) },
        { label: 'Sum of all payments', value: usd2(s.pmt * s.n) },
        { label: 'Total interest', value: usd2(totalInt) },
      ],
      chart: { type: 'line', title: 'Balance (cash-flow sign) by period', x: idx, series: [{ name: 'Balance', values: idx.map((j) => balances[j]) }], y: 'usd', xTitle: 'Period' },
      table: { head: ['Period', 'Payment', 'Interest', 'Balance'], rows },
      steps: [
        `i = ${num(s.rate, 4)}% ÷ ${s.ppy} = ${pct(i * 100, 5)} per period`,
        `TVM equation: PV(1+i)^N + PMT${s.begin ? '(1+i)' : ''}[((1+i)^N − 1) ÷ i] + FV = 0`,
        `Solved ${key.toUpperCase()} = ${show(key, ans)}`,
        `Check: residual = ${num(tvmResidual(s), 6)}`,
      ],
    };
  },
  answer: {
    text: (r) =>
      `Investing <strong>$10,000</strong> now (PV = −10,000) and <strong>$200 a month</strong> (PMT = −200) for 120 months at 6% a year grows to a future value of <strong>${r.primary.value}</strong>. Enter any four of N, I/Y, PV, PMT and FV, and the calculator solves the fifth, just like the TVM keys on a BA II Plus or HP 12C.`,
  },
  intro: [
    'A finance calculator, also called a TVM (time value of money) calculator, links five numbers: the number of periods (N), the interest rate (I/Y), the present value (PV), the payment (PMT) and the future value (FV). If you know any four, the fifth is fixed.',
    'It works like the financial calculators used in finance classes and the CFA exam. It uses the same cash-flow sign convention, so money you pay out is negative. It also shows a period-by-period schedule and a check that the solved equation balances to zero, which handheld calculators do not.',
  ],
  formula: {
    expr: 'PV·(1+i)^N + PMT·(1+i·t)·[((1+i)^N − 1) ÷ i] + FV = 0\ni = (I/Y ÷ 100) ÷ P/Y',
    vars: [
      ['N', 'total number of periods'],
      ['i', 'interest rate per period'],
      ['t', '1 for payments at the start of each period, 0 for the end'],
      ['PV, PMT, FV', 'cash flows: negative when paid out, positive when received'],
    ],
    notes: ['N, PV, PMT and FV have closed-form solutions. The interest rate does not, so it is found numerically by bisection to better than 0.0001%.'],
  },
  examples: [
    { title: 'Mortgage payment', inputs: { solve: 'pmt', n: 360, rate: 6.5, pv: 300000, fv: 0 }, explain: (r) => `PMT = ${r.primary.value}: you receive $300,000 and pay back each month.` },
    { title: 'How long to reach $1 million?', inputs: { solve: 'n', rate: 7, pv: -50000, pmt: -1000, fv: 1000000 }, explain: (r) => `N = ${r.primary.value}.` },
    { title: 'Return on a bond bought at a discount', inputs: { solve: 'rate', n: 20, ppy: '2', pv: -920, pmt: 25, fv: 1000 }, explain: (r) => `Yield to maturity ${r.primary.value} a year (paid twice a year).` },
    { title: 'Lump sum needed today', inputs: { solve: 'pv', n: 18, ppy: '1', rate: 5, pmt: 0, fv: 150000 }, explain: (r) => `PV = ${r.primary.value} invested today grows to $150,000 in 18 years.` },
  ],
  analysis() {
    const base: Tvm = { n: 360, rate: 6, pv: 0, pmt: -500, fv: 0, ppy: 12, begin: false };
    const end = solveTvm(base, 'fv');
    const beg = solveTvm({ ...base, begin: true }, 'fv');
    const rates = [2, 4, 6, 8, 10];
    return [
      {
        title: 'Start-of-period payments: one month makes a real difference',
        insight: `Saving $500 a month for 30 years at 6% gives <strong>${usd2(end)}</strong> if you pay at the end of each month and <strong>${usd2(beg)}</strong> if you pay at the start. That is ${usd2(beg - end)} more, exactly ${pct(0.5, 1)} (one month’s interest) on top, because every payment gets one extra month to grow.`,
      },
      {
        title: 'Same payment, different rates: how FV reacts',
        insight: 'Future value is much more sensitive to the rate than it looks. Over 30 years, raising the rate from 6% to 8% increases the result by roughly half, even though the deposits are the same.',
        chart: { type: 'bar', title: 'FV of $500 a month for 30 years', x: rates.map((r) => r + '%'), series: [{ name: 'Future value', values: rates.map((r) => solveTvm({ ...base, rate: r }, 'fv')) }], y: 'usd' },
      },
      {
        title: 'The sign convention at a glance',
        insight: 'Errors on financial calculators usually come from mixing up signs. Picture the cash flows from your own point of view.',
        table: {
          head: ['Situation', 'PV', 'PMT', 'FV'],
          rows: [
            ['Saving for a goal', '− (you deposit)', '− (you deposit)', '+ (you withdraw)'],
            ['Taking a loan', '+ (you receive)', '− (you repay)', '0'],
            ['Buying a bond', '− (price paid)', '+ (coupons)', '+ (face value)'],
            ['Buying an annuity', '− (premium)', '+ (income)', '0'],
          ],
        },
      },
    ];
  },
  variantQs: [
    { q: 'Is this a time value of money (TVM) calculator?', a: 'Yes. It solves the standard TVM equation for N, I/Y, PV, PMT or FV, with payments at the start or end of each period.' },
    { q: 'How do I calculate future value?', a: 'Choose “Solve for FV”, enter the starting amount as a negative PV, any regular deposits as a negative PMT, the rate and the number of periods.' },
    { q: 'How do I calculate present value?', a: 'Choose “Solve for PV”, enter the future amount as FV, the rate and the number of periods. The answer is negative: it is what you would invest today.' },
  ],
  tips: [
    'Make N match P/Y: 30 years of monthly payments is N = 360 with P/Y = 12.',
    'If you get “no solution” when solving for the rate or N, one of the cash flows probably has the wrong sign.',
    'Bond coupons are usually paid twice a year, so use P/Y = 2 and half the annual coupon as PMT.',
  ],
  faqs: [
    { q: 'What do N, I/Y, PV, PMT and FV mean?', a: 'N is the number of periods, I/Y the annual interest rate, PV the value today, PMT the regular payment and FV the value at the end. The same five keys appear on the BA II Plus and HP 12C.' },
    { q: 'Why is my present value negative?', a: 'Finance calculators use a cash-flow sign convention. Money leaving your pocket is negative and money arriving is positive, so an investment made today shows as a negative PV.' },
    { q: 'What is the difference between an ordinary annuity and an annuity due?', a: 'In an ordinary annuity, payments come at the end of each period, like loan payments. In an annuity due, they come at the start, like rent. An annuity due is worth one period’s interest more.' },
    { q: 'How is the interest rate solved?', a: 'There is no algebraic formula for the rate, so the calculator searches numerically. It brackets a sign change in the TVM equation and bisects it until the error is negligible.' },
  ],
  sources: [
    { label: 'Wikipedia – Time value of money (formulas and derivations)', url: 'https://en.wikipedia.org/wiki/Time_value_of_money' },
    { label: 'Investor.gov – Compound interest and future value', url: 'https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator' },
  ],
  related: ['interest-rate-calculator', 'compound-interest-calculator', 'loan-calculator', 'investment-calculator', 'amortization-calculator'],
  disclaimer: 'finance',
};
export default calc;
