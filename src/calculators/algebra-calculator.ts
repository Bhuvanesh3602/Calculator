import Algebrite from 'algebrite';
import { compileFx, roots, sample, clip } from '../lib/expr';
import { toAlg, fromAlg } from './integral-calculator';
import { num } from '../lib/format';
import type { Calculator, Values, Result } from '../lib/types';

const run = (s: string) => {
  try {
    const out = Algebrite.run(s);
    return out && !/Stop|error/i.test(out) ? fromAlg(out) : '';
  } catch {
    return '';
  }
};

function compute(v: Values): Result {
  const input = String(v.eq || '').trim();
  if (!input) return { primary: { label: '', value: '' }, error: 'Enter an equation or expression.' };
  if (v.mode === 'solve') {
    const parts = input.split('=');
    if (parts.length !== 2) return { primary: { label: '', value: '' }, error: 'Write an equation with one “=”, e.g. 3x + 5 = 20 (use 3*x).' };
    const lhs = parts[0].trim(),
      rhs = parts[1].trim();
    const expr = `(${lhs}) - (${rhs})`;
    let f: (x: number) => number;
    try {
      f = compileFx(expr);
    } catch (e) {
      return { primary: { label: '', value: '' }, error: 'Could not read the equation: ' + (e as Error).message };
    }
    const exact = run(`roots(${toAlg(expr)})`);
    const lo = +v.lo,
      hi = +v.hi;
    const num_ = roots(f, lo, hi, 4000);
    const simplified = run(`simplify(${toAlg(expr)})`);
    const s = sample(f, lo, hi, 161);
    const sol = exact ? exact.replace(/^\[|\]$/g, '').split(',').map((t) => 'x = ' + t.trim()).join(',  ') : num_.length ? num_.map((x) => 'x ≈ ' + num(x, 8)).join(',  ') : 'No real solution in the search range';
    return {
      primary: { label: `Solve ${input}`, value: sol },
      rows: [
        { label: 'Rearranged (= 0)', value: simplified ? `${simplified} = 0` : `${expr} = 0` },
        { label: 'Numerical check', value: num_.length ? num_.map((x) => num(x, 8)).join(', ') : `none in [${lo}, ${hi}]` },
      ],
      steps: [`Move everything to one side: ${lhs} − (${rhs}) = 0`, simplified ? `Simplify: ${simplified} = 0` : 'Simplify the left side', exact ? `Solve exactly: ${sol}` : `Solve numerically (bisection) in [${lo}, ${hi}]`, ...num_.slice(0, 3).map((x) => `Check x = ${num(x, 6)}: left side − right side = ${num(f(x), 10)}`)],
      chart: { type: 'line', title: 'Left side minus right side — solutions are where it crosses 0', x: s.xs, series: [{ name: 'LHS − RHS', values: clip([s.ys])[0] }], y: 'num', numericX: true, xTitle: 'x' },
    };
  }
  const op = v.mode as 'simplify' | 'expand' | 'factor';
  const out = run(`${op}(${toAlg(input)})`);
  if (!out) return { primary: { label: '', value: '' }, error: 'Could not process that expression. Use * for multiplication and ^ for powers.' };
  return { primary: { label: `${op[0].toUpperCase() + op.slice(1)} ${input}`, value: out }, steps: [`Input: ${input}`, `${op}: ${out}`] };
}

const calc: Calculator = {
  slug: 'algebra-calculator',
  name: 'Algebra Calculator',
  short: 'Algebra',
  category: 'math',
  keyword: 'algebra calculator',
  volume: 74000,
  variants: ['equation solver', 'solve for x calculator', 'simplify expression calculator', 'expand calculator'],
  title: 'Algebra Calculator – Solve for x, Simplify, Expand & Factor',
  description:
    'Solve equations for x exactly or numerically, and simplify, expand or factor algebraic expressions. Each answer is checked by substitution and graphed.',
  accent: 'solve for x, checked',
  icon: 'x',
  inputs: [
    {
      id: 'mode',
      label: 'Task',
      type: 'select',
      default: 'solve',
      options: [
        { value: 'solve', label: 'Solve an equation for x' },
        { value: 'simplify', label: 'Simplify an expression' },
        { value: 'expand', label: 'Expand an expression' },
        { value: 'factor', label: 'Factor an expression' },
      ],
    },
    { id: 'eq', label: 'Equation or expression', type: 'text', default: '2*x^2 + 3*x = 9', mono: true, help: 'Use * for multiplication and ^ for powers.' },
    { id: 'lo', label: 'Search from x =', type: 'number', default: -20, showIf: { field: 'mode', in: ['solve'] } },
    { id: 'hi', label: 'to x =', type: 'number', default: 20, showIf: { field: 'mode', in: ['solve'] } },
  ],
  compute,
  answer: {
    text: (r) =>
      `To solve <strong>2x² + 3x = 9</strong>, move everything to one side (2x² + 3x − 9 = 0) and factor: (2x − 3)(x + 3) = 0. The solutions are <strong>${r.primary.value}</strong>. Substitute each back in to check — the calculator does this automatically.`,
  },
  intro: [
    'An algebra calculator rearranges and solves equations the way you would on paper — and checks the answer. Enter an equation with an equals sign to solve for x, or an expression to simplify, expand or factor.',
    'Exact answers come from a computer-algebra engine for polynomial equations. For equations it can’t solve exactly (with sin, exp or logs), it finds every real solution numerically in your search range and graphs the equation so you can see them.',
  ],
  formula: {
    expr: 'Linear:    ax + b = c       →  x = (c − b)/a\nQuadratic: ax² + bx + c = 0  →  x = (−b ± √(b² − 4ac)) / 2a\nGeneral:   solve f(x) = 0 by bisection on sign changes',
    vars: [['f(x)', 'left side minus right side']],
  },
  examples: [
    { title: 'Linear equation', inputs: { eq: '3*x + 5 = 20' }, explain: (r) => `${r.primary.value}.` },
    { title: 'Expand (x + 2)³', inputs: { mode: 'expand', eq: '(x+2)^3' }, explain: (r) => `= ${r.primary.value}.` },
    { title: 'Transcendental: cos(x) = x', inputs: { eq: 'cos(x) = x', lo: -5, hi: 5 }, explain: (r) => `Only a numeric answer exists: ${r.rows![1].value}.` },
  ],
  analysis() {
    const bs = [-6, -4, -2, 0, 2, 4, 6];
    const count = bs.map((b) => {
      const D = b * b - 4 * 1 * 4;
      return D > 0 ? 2 : D === 0 ? 1 : 0;
    });
    return [
      {
        title: 'How the discriminant decides the number of solutions',
        insight: 'For x² + bx + 4 = 0, the discriminant b² − 16 is negative when |b| < 4 (no real solutions), zero at b = ±4 (one repeated solution) and positive beyond (two solutions). Graphically, the parabola rises, touches or crosses the x-axis.',
        chart: { type: 'bar', title: 'Number of real solutions of x² + bx + 4 = 0', x: bs.map((b) => 'b = ' + b), series: [{ name: 'Real solutions', values: count }], y: 'int' },
      },
    ];
  },
  variantQs: [
    { q: 'Is this a “solve for x” calculator?', a: 'Yes. Type any equation in x, such as 4*(x - 3) = 2*x + 8, and it returns the value(s) of x with a check.' },
    { q: 'Can it simplify expressions?', a: 'Yes — choose Simplify. For example (x^2 - 1)/(x - 1) simplifies to x + 1.' },
  ],
  tips: [
    'Write 3*x, not 3x, and use parentheses for numerators and denominators.',
    'Widen the search range if you expect large solutions.',
    'Always check solutions in the original equation — especially with square roots or fractions.',
  ],
  faqs: [
    { q: 'How do you solve for x?', a: 'Use inverse operations to isolate x: undo addition with subtraction, multiplication with division, and so on, doing the same to both sides.' },
    { q: 'What if there is no solution?', a: 'Some equations, like x² = −1, have no real solutions. The graph will never cross zero.' },
    { q: 'Can it solve systems of equations?', a: 'Not yet — it solves one equation in one variable.' },
    { q: 'What is the difference between expand and factor?', a: 'Expand multiplies out brackets; factor does the reverse, writing an expression as a product.' },
  ],
  sources: [
    { label: 'Algebrite computer algebra system', url: 'http://algebrite.org/' },
    { label: 'OpenStax College Algebra', url: 'https://openstax.org/details/books/college-algebra-2e' },
  ],
  related: ['factoring-calculator', 'graphing-calculator', 'scientific-calculator', 'integral-calculator', 'slope-calculator'],
};
export default calc;
