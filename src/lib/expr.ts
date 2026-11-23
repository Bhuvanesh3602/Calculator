/** Safe expression evaluation with mathjs (no access to globals; mathjs has its own parser). */
import { create, all } from 'mathjs';

export const math = create(all, { number: 'number', precision: 14 });

/** Normalise user-friendly syntax to mathjs syntax. */
export function normalize(s: string) {
  return String(s)
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/π/g, 'pi')
    .replace(/√\(/g, 'sqrt(')
    .replace(/\bln\(/g, '__LN__(')
    .replace(/\blog\(/g, 'log10(')
    .replace(/__LN__\(/g, 'log(');
}

const DEG = Math.PI / 180;
export function evaluate(expr: string, angle: 'deg' | 'rad' = 'rad', scope: Record<string, number> = {}) {
  const s = normalize(expr);
  const sc: Record<string, any> = { ...scope };
  if (angle === 'deg') {
    sc.sin = (x: number) => Math.sin(x * DEG);
    sc.cos = (x: number) => Math.cos(x * DEG);
    sc.tan = (x: number) => Math.tan(x * DEG);
    sc.asin = (x: number) => Math.asin(x) / DEG;
    sc.acos = (x: number) => Math.acos(x) / DEG;
    sc.atan = (x: number) => Math.atan(x) / DEG;
  }
  return math.evaluate(s, sc);
}

/** Compile f(x) once, evaluate many times. Returns NaN on error/complex. */
export function compileFx(expr: string) {
  const code = math.compile(normalize(expr));
  return (x: number) => {
    try {
      const y = code.evaluate({ x });
      return typeof y === 'number' ? y : NaN;
    } catch {
      return NaN;
    }
  };
}

/** Sample f on [a,b] and blank out asymptote spikes so charts stay readable. */
export function sample(f: (x: number) => number, a: number, b: number, n = 241) {
  const xs = Array.from({ length: n }, (_, i) => +(a + ((b - a) * i) / (n - 1)).toFixed(6));
  const ys = xs.map(f);
  return { xs, ys };
}
export function clip(series: number[][]) {
  const all = series.flat().filter((y) => isFinite(y)).sort((p, q) => p - q);
  if (!all.length) return series;
  const lo = all[Math.floor(all.length * 0.03)],
    hi = all[Math.floor(all.length * 0.97)];
  const pad = Math.max(1, (hi - lo) * 0.6);
  return series.map((ys) => ys.map((y) => (y < lo - pad || y > hi + pad ? NaN : y)));
}

/** Real roots by sign change + bisection. */
export function roots(f: (x: number) => number, a: number, b: number, n = 2000) {
  const out: number[] = [];
  let px = a,
    py = f(a);
  for (let i = 1; i <= n; i++) {
    const x = a + ((b - a) * i) / n;
    const y = f(x);
    if (isFinite(py) && isFinite(y)) {
      if (py === 0) out.push(px);
      else if (py * y < 0 && Math.abs(py - y) < 1e6) {
        let lo = px,
          hi = x;
        for (let k = 0; k < 60; k++) {
          const m = (lo + hi) / 2;
          if (f(lo) * f(m) <= 0) hi = m;
          else lo = m;
        }
        out.push((lo + hi) / 2);
      }
    }
    px = x;
    py = y;
  }
  return out.filter((r, i) => i === 0 || Math.abs(r - out[i - 1]) > 1e-7).slice(0, 12);
}

/** Adaptive Simpson integration. */
export function integrate(f: (x: number) => number, a: number, b: number, eps = 1e-10) {
  const simpson = (a: number, b: number, fa: number, fm: number, fb: number) => ((b - a) / 6) * (fa + 4 * fm + fb);
  const rec = (a: number, b: number, fa: number, fm: number, fb: number, whole: number, eps: number, depth: number): number => {
    const m = (a + b) / 2,
      lm = (a + m) / 2,
      rm = (m + b) / 2;
    const flm = f(lm),
      frm = f(rm);
    const left = simpson(a, m, fa, flm, fm),
      right = simpson(m, b, fm, frm, fb);
    if (depth <= 0 || Math.abs(left + right - whole) <= 15 * eps) return left + right + (left + right - whole) / 15;
    return rec(a, m, fa, flm, fm, left, eps / 2, depth - 1) + rec(m, b, fm, frm, fb, right, eps / 2, depth - 1);
  };
  const fa = f(a),
    fb = f(b),
    fm = f((a + b) / 2);
  return rec(a, b, fa, fm, fb, simpson(a, b, fa, fm, fb), eps, 40);
}
