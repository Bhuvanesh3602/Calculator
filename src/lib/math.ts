/** Shared, pure, tested maths helpers. */

/** Monthly payment for an amortising loan. rate = annual % (e.g. 6.5). */
export function pmt(principal: number, annualRatePct: number, months: number): number {
  if (months <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}

export interface AmortRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

/** Amortisation schedule with optional extra monthly principal. */
export function amortize(principal: number, annualRatePct: number, months: number, extra = 0): AmortRow[] {
  const r = annualRatePct / 100 / 12;
  const base = pmt(principal, annualRatePct, months);
  const rows: AmortRow[] = [];
  let bal = principal;
  for (let m = 1; m <= months && bal > 0.005; m++) {
    const interest = bal * r;
    let princ = base - interest + extra;
    if (princ > bal) princ = bal;
    bal -= princ;
    rows.push({ month: m, payment: princ + interest, principal: princ, interest, balance: Math.max(0, bal) });
  }
  return rows;
}

export function sum(a: number[]) {
  return a.reduce((x, y) => x + y, 0);
}

/** Yearly roll-up of an amortisation schedule. */
export function yearly(rows: AmortRow[]) {
  const out: { year: number; principal: number; interest: number; balance: number }[] = [];
  rows.forEach((r) => {
    const y = Math.ceil(r.month / 12);
    if (!out[y - 1]) out[y - 1] = { year: y, principal: 0, interest: 0, balance: 0 };
    out[y - 1].principal += r.principal;
    out[y - 1].interest += r.interest;
    out[y - 1].balance = r.balance;
  });
  return out;
}

/**
 * Future value with periodic contributions.
 * n = compounds per year, contribution made monthly (converted to effective).
 * Returns per-year snapshots.
 */
export function growth(opts: {
  principal: number;
  ratePct: number;
  years: number;
  compoundsPerYear?: number;
  monthly?: number;
  timing?: 'end' | 'start';
}) {
  const { principal, ratePct, years, compoundsPerYear = 12, monthly = 0, timing = 'end' } = opts;
  // effective monthly rate equivalent to the nominal compounding chosen
  const eff = Math.pow(1 + ratePct / 100 / compoundsPerYear, compoundsPerYear / 12) - 1;
  let bal = principal;
  let contributed = principal;
  const snaps = [{ year: 0, balance: bal, contributed, interest: 0 }];
  for (let m = 1; m <= Math.round(years * 12); m++) {
    if (timing === 'start') bal += monthly;
    bal *= 1 + eff;
    if (timing === 'end') bal += monthly;
    contributed += monthly;
    if (m % 12 === 0 || m === Math.round(years * 12)) {
      snaps.push({ year: +(m / 12).toFixed(2), balance: bal, contributed, interest: bal - contributed });
    }
  }
  return snaps;
}

export function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) [a, b] = [b, a % b];
  return a;
}
export function lcm(a: number, b: number) {
  return a && b ? Math.abs(a * b) / gcd(a, b) : 0;
}

export function primeFactors(n: number): number[] {
  n = Math.abs(Math.round(n));
  const out: number[] = [];
  if (n < 2) return out;
  while (n % 2 === 0) {
    out.push(2);
    n /= 2;
  }
  for (let p = 3; p * p <= n; p += 2) {
    while (n % p === 0) {
      out.push(p);
      n /= p;
    }
  }
  if (n > 1) out.push(n);
  return out;
}

export function divisors(n: number): number[] {
  n = Math.abs(Math.round(n));
  const small: number[] = [],
    big: number[] = [];
  for (let i = 1; i * i <= n; i++) {
    if (n % i === 0) {
      small.push(i);
      if (i * i !== n) big.unshift(n / i);
    }
  }
  return [...small, ...big];
}

/* ---------- dates ---------- */

export function parseDate(v: string): Date {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  if (!v || v === 'today') return today;
  const m = /^today([+-]\d+)$/.exec(v);
  if (m) return addDays(today, +m[1]);
  const [y, mo, d] = v.split('-').map(Number);
  return new Date(y, mo - 1, d, 12);
}
export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
/** Add calendar months, clamping the day to the target month's length (Jan 31 + 1 → Feb 28/29). */
export function addMonths(d: Date, n: number) {
  const y = d.getFullYear(),
    m = d.getMonth() + n;
  const dim = new Date(y, m + 1, 0).getDate();
  return new Date(y, m, Math.min(d.getDate(), dim), 12);
}
export function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function daysBetween(a: Date, b: Date) {
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((ub - ua) / 86400000);
}
export function fmtDate(d: Date) {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}
/** Exact difference in years, months, days (a <= b). */
export function ymd(a: Date, b: Date) {
  let sign = 1;
  if (b < a) {
    [a, b] = [b, a];
    sign = -1;
  }
  // Largest whole number of months k with addMonths(a, k) <= b (day clamped to month end).
  let k = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  while (k > 0 && addMonths(a, k) > b) k--;
  const d = daysBetween(addMonths(a, k), b);
  return { years: Math.floor(k / 12) * sign, months: (k % 12) * sign, days: d * sign };
}
export function businessDays(a: Date, b: Date) {
  let count = 0;
  const step = a <= b ? 1 : -1;
  let d = new Date(a);
  while (daysBetween(d, b) !== 0) {
    d = addDays(d, step);
    const wd = d.getDay();
    if (wd !== 0 && wd !== 6) count++;
  }
  return count * step;
}

/* ---------- time ---------- */
export function parseHM(s: string): number {
  // "09:30" -> minutes
  if (!s) return NaN;
  const [h, m = '0'] = s.split(':');
  return +h * 60 + +m;
}
export function hm(mins: number) {
  const sign = mins < 0 ? '-' : '';
  mins = Math.abs(Math.round(mins));
  return `${sign}${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`;
}

export const range = (a: number, b: number, step = 1) => {
  const out: number[] = [];
  for (let v = a; step > 0 ? v <= b + 1e-9 : v >= b - 1e-9; v += step) out.push(+v.toFixed(10));
  return out;
};
