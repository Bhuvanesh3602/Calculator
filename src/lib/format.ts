export type Fmt = 'usd' | 'usd2' | 'pct' | 'pct2' | 'num' | 'num2' | 'int' | 'raw';

const cache: Record<string, Intl.NumberFormat> = {};

/** Values that round to zero at the shown precision print as 0, never "-0". */
function noNegZero(n: number, digits: number): number {
  return Math.abs(n) < 0.5 * 10 ** -digits ? 0 : n;
}
function nf(key: string, opts: Intl.NumberFormatOptions) {
  return (cache[key] ??= new Intl.NumberFormat('en-US', opts));
}

export function usd(n: number, digits = 0): string {
  if (!isFinite(n)) return '—';
  n = noNegZero(n, digits);
  return nf('usd' + digits, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}
export const usd2 = (n: number) => usd(n, 2);

export function num(n: number, digits = 2): string {
  if (!isFinite(n)) return '—';
  n = noNegZero(n, digits);
  return nf('num' + digits, { maximumFractionDigits: digits }).format(n);
}
export function pct(n: number, digits = 1): string {
  if (!isFinite(n)) return '—';
  return num(n, digits) + '%';
}

export function fmt(n: number, kind: Fmt = 'num'): string {
  switch (kind) {
    case 'usd':
      return usd(n);
    case 'usd2':
      return usd2(n);
    case 'pct':
      return pct(n);
    case 'pct2':
      return pct(n, 2);
    case 'int':
      return num(n, 0);
    case 'num2':
      return num(n, 2);
    case 'raw':
      return String(n);
    default:
      return num(n, 1);
  }
}

/** Compact axis labels: $1.2M, 45k */
export function compact(n: number, kind: Fmt = 'num'): string {
  if (Math.abs(n) < 1e-9) n = 0;
  const a = Math.abs(n);
  const money = kind === 'usd' || kind === 'usd2';
  const p = money ? (n < 0 ? '-$' : '$') : n < 0 ? '-' : '';
  let s: string;
  if (a >= 1e9) s = trim(a / 1e9) + 'B';
  else if (a >= 1e6) s = trim(a / 1e6) + 'M';
  else if (a >= 1e4) s = trim(a / 1e3) + 'k';
  else s = num(a, a < 10 && a % 1 ? 2 : 0);
  if (kind === 'pct' || kind === 'pct2') return p + s + '%';
  return p + s;
}
function trim(n: number) {
  return n.toFixed(n < 10 ? 1 : 0).replace(/\.0$/, '');
}

export function round(n: number, d = 2) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

export function esc(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
