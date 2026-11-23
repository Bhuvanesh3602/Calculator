import Algebrite from 'algebrite';
import { compileFx, sample, clip, integrate } from '../lib/expr';
import { num } from '../lib/format';
import type { Calculator } from '../lib/types';

/** Algebrite uses log() for ln and ^ for powers — convert user syntax. */
export function toAlg(s: string) {
  return String(s).replace(/\bln\(/g, 'log(').replace(/×/g, '*').replace(/−/g, '-').replace(/\bpi\b/g, 'pi');
}
export function fromAlg(s: string) {
  return s.replace(/\blog\(/g, 'ln(').replace(/arc(sin|cos|tan)/g, 'a$1').replace(/\*/g, '·');
}

const calc: Calculator = {
  slug: 'integral-calculator',
  name: 'Integral Calculator',
  short: 'Integral',
  category: 'math',
  keyword: 'integral calculator',
  volume: 74000,
  variants: ['antiderivative calculator', 'definite integral calculator', 'integration calculator', 'area under curve calculator'],
  title: 'Integral Calculator – Antiderivatives & Definite Integrals',
  description:
    'Find the antiderivative of a function symbolically and evaluate definite integrals with high-precision numerical integration. See the area under the curve plotted.',
  accent: 'symbolic and numeric',
  icon: '∫',
  inputs: [
    { id: 'f', label: 'Integrate f(x) =', type: 'text', default: 'x^2 * sin(x)', mono: true },
    { id: 'a', label: 'Lower limit a', type: 'number', default: 0 },
    { id: 'b', label: 'Upper limit b', type: 'number', default: 3.14159265 },
  ],
  compute(v) {
    const expr = String(v.f || '').trim();
    if (!expr) return { primary: { label: '', value: '' }, error: 'Enter a function of x.' };
    let anti = '';
    try {
      const out = Algebrite.run(`integral(${toAlg(expr)},x)`);
      if (out && !/integral|Stop|error/i.test(out)) anti = fromAlg(out);
    } catch {}
    let f: (x: number) => number;
    try {
      f = compileFx(expr);
    } catch (e) {
      return { primary: { label: '', value: '' }, error: 'Could not read the function: ' + (e as Error).message };
    }
    const a = +v.a,
      b = +v.b;
    const val = isFinite(a) && isFinite(b) ? integrate(f, a, b) : NaN;
    const lo = Math.min(a, b),
      hi = Math.max(a, b);
    const pad = Math.max(0.5, (hi - lo) * 0.25);
    const s = sample(f, lo - pad, hi + pad, 161);
    const [ys] = clip([s.ys]);
    const area = s.xs.map((x, i) => (x >= lo && x <= hi ? ys[i] : NaN));
    return {
      primary: { label: `∫ from ${num(a, 4)} to ${num(b, 4)} of ${expr} dx`, value: isFinite(val) ? num(val, 10) : 'does not converge' },
      rows: [
        { label: 'Antiderivative F(x)', value: anti ? `${anti} + C` : 'no closed form found — numeric value shown' },
        { label: 'Average value on [a, b]', value: isFinite(val) && b !== a ? num(val / (b - a), 8) : '—' },
      ],
      steps: anti ? [`Find F(x) = ${anti}`, `Evaluate F(${num(b, 6)}) − F(${num(a, 6)})`, `Numerical check (adaptive Simpson): ${num(val, 10)}`] : [`Adaptive Simpson’s rule on [${num(a, 4)}, ${num(b, 4)}] → ${num(val, 10)}`],
      chart: {
        type: 'line',
        title: 'f(x) and the integrated region',
        x: s.xs,
        series: [
          { name: 'f(x)', values: ys },
          { name: 'Region [a, b]', values: area },
        ],
        y: 'num',
        numericX: true,
        xTitle: 'x',
      },
    };
  },
  answer: {
    text: (r) =>
      `The antiderivative of <strong>x²·sin(x)</strong> is <strong>${r.rows![0].value}</strong> (by integrating by parts twice). The definite integral from 0 to π is <strong>${r.primary.value}</strong>, which equals π² − 4.`,
  },
  intro: [
    'An integral calculator finds the antiderivative of a function — the F(x) whose derivative is f(x) — and the definite integral, the signed area under the curve between two limits.',
    'This tool uses a computer-algebra engine for exact antiderivatives (polynomials, trig, exponentials, logs and many products) and adaptive Simpson’s rule for the definite integral, accurate to around 10 significant digits. When no closed form exists, such as e^(−x²), you still get the numeric answer.',
  ],
  formula: {
    expr: '∫ₐᵇ f(x) dx = F(b) − F(a),  where F′(x) = f(x)\nSimpson: ∫ ≈ (h/6)[f(a) + 4f(m) + f(b)], refined adaptively',
    vars: [
      ['F(x)', 'antiderivative (plus constant C)'],
      ['a, b', 'limits of integration'],
    ],
    notes: ['Syntax: x^n, sqrt(x), exp(x), ln(x) for natural log, sin(x) in radians. Regions below the x-axis count as negative area.'],
  },
  examples: [
    { title: '∫ 3x² dx from 0 to 2', inputs: { f: '3*x^2', a: 0, b: 2 }, explain: (r) => `= ${r.primary.value}; F(x) = ${r.rows![0].value}.` },
    { title: 'Bell curve (no closed form)', inputs: { f: 'exp(-x^2)', a: -3, b: 3 }, explain: (r) => `≈ ${r.primary.value}, close to √π.` },
    { title: '∫ 1/x dx from 1 to e', inputs: { f: '1/x', a: 1, b: 2.718281828 }, explain: (r) => `= ${r.primary.value}: ln(e) − ln(1).` },
  ],
  analysis() {
    const f = (x: number) => x * x;
    const ns = [2, 4, 8, 16, 32, 64];
    const exact = 9;
    const left = ns.map((n) => {
      let s = 0;
      for (let i = 0; i < n; i++) s += f((3 * i) / n) * (3 / n);
      return Math.abs(exact - s);
    });
    const trap = ns.map((n) => {
      let s = 0;
      for (let i = 0; i < n; i++) s += ((f((3 * i) / n) + f((3 * (i + 1)) / n)) / 2) * (3 / n);
      return Math.abs(exact - s);
    });
    return [
      {
        title: 'How fast numerical methods converge',
        insight: `For ∫₀³ x² dx = 9, a left Riemann sum with 64 rectangles is still off by <strong>${num(left[5], 4)}</strong>. The trapezoid rule is off by ${num(trap[5], 5)}, and Simpson’s rule is exact for polynomials up to degree 3. Smarter rules beat brute force.`,
        chart: {
          type: 'line',
          title: 'Absolute error by number of slices, ∫₀³ x² dx',
          x: ns.map((n) => n + ' slices'),
          series: [
            { name: 'Left Riemann', values: left },
            { name: 'Trapezoid', values: trap },
          ],
          y: 'num2',
          xTitle: 'Number of slices',
        },
      },
    ];
  },
  variantQs: [
    { q: 'Is this an antiderivative calculator?', a: 'Yes. The “Antiderivative F(x)” line gives the indefinite integral; add any constant C.' },
    { q: 'How do I find the area under a curve?', a: 'Enter the function and the x-limits. The definite integral is the signed area; for total area where the curve dips below the axis, split the interval at the roots and add absolute values.' },
  ],
  tips: [
    'Write multiplication explicitly: 2*x, x*sin(x).',
    'Check an antiderivative by differentiating it.',
    'Improper integrals (infinite limits or singularities) need care — use large finite limits to approximate.',
  ],
  faqs: [
    { q: 'What is the integral of x²?', a: 'x³/3 + C. Over [0, 3] the definite integral is 9.' },
    { q: 'What is the difference between definite and indefinite integrals?', a: 'An indefinite integral is a family of functions F(x) + C. A definite integral is a number: F(b) − F(a).' },
    { q: 'Why can’t some functions be integrated?', a: 'Every continuous function has an antiderivative, but some, like e^(−x²), can’t be written with elementary functions. They are still computed numerically.' },
    { q: 'How accurate is the numeric result?', a: 'Adaptive Simpson’s rule typically gives 10+ correct digits for smooth functions on finite intervals.' },
  ],
  sources: [
    { label: 'Algebrite computer algebra system', url: 'http://algebrite.org/' },
    { label: 'OpenStax Calculus Vol. 1 – Integration', url: 'https://openstax.org/details/books/calculus-volume-1' },
  ],
  related: ['graphing-calculator', 'algebra-calculator', 'scientific-calculator', 'slope-calculator'],
};
export default calc;
