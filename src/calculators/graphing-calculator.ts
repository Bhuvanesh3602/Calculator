import { compileFx, sample, clip, roots } from '../lib/expr';
import { num } from '../lib/format';
import type { Calculator } from '../lib/types';

const calc: Calculator = {
  slug: 'graphing-calculator',
  name: 'Graphing Calculator',
  short: 'Graphing',
  category: 'math',
  keyword: 'graphing calculator',
  volume: 450000,
  variants: ['graph calculator', 'calculator that graphs', 'graphs and functions calculator', 'solve by graphing calculator', 'online graphing calculator'],
  title: 'Graphing Calculator – Plot Functions, Roots & Intersections',
  description:
    'Plot up to three functions of x in your own window and find roots, y-intercepts and intersections. A free online graphing calculator with a table of values.',
  accent: 'plot, zoom, solve',
  icon: '∿',
  inputs: [
    { id: 'f', label: 'f(x) =', type: 'text', default: 'x^2 - 4', mono: true },
    { id: 'g', label: 'g(x) = (optional)', type: 'text', default: '2*sin(x) + 1', mono: true },
    { id: 'h', label: 'h(x) = (optional)', type: 'text', default: '', mono: true },
    { id: 'xmin', label: 'x min', type: 'number', default: -5 },
    { id: 'xmax', label: 'x max', type: 'number', default: 5 },
  ],
  compute(v) {
    const a = +v.xmin,
      b = +v.xmax;
    if (!(b > a)) return { primary: { label: '', value: '' }, error: 'x max must be greater than x min.' };
    const exprs = [v.f, v.g, v.h].map((s: string) => String(s || '').trim()).filter(Boolean);
    if (!exprs.length) return { primary: { label: '', value: '' }, error: 'Enter at least one function.' };
    let fs;
    try {
      fs = exprs.map(compileFx);
    } catch (e) {
      return { primary: { label: '', value: '' }, error: 'Could not read a function: ' + (e as Error).message };
    }
    const samples = fs.map((f) => sample(f, a, b));
    const ys = clip(samples.map((s) => s.ys));
    const names = ['f', 'g', 'h'];
    const rows: { label: string; value: string }[] = [];
    fs.forEach((f, i) => {
      const r = roots(f, a, b);
      rows.push({ label: `${names[i]}(x) = 0 at`, value: r.length ? r.map((x) => num(x, 5)).join(', ') : 'no roots in window' });
      const y0 = f(0);
      if (a <= 0 && b >= 0 && isFinite(y0)) rows.push({ label: `${names[i]}(0)`, value: num(y0, 6) });
    });
    if (fs.length >= 2) {
      const d = (x: number) => fs[0](x) - fs[1](x);
      const ix = roots(d, a, b);
      rows.push({ label: 'f and g intersect at', value: ix.length ? ix.map((x) => `(${num(x, 4)}, ${num(fs[0](x), 4)})`).join(', ') : 'none in window' });
    }
    const tx = Array.from({ length: 11 }, (_, i) => a + ((b - a) * i) / 10);
    return {
      primary: { label: 'Plotted', value: exprs.map((e, i) => `${names[i]}(x) = ${e}`).join('  ·  ') },
      rows,
      chart: { type: 'line', title: 'Graph', x: samples[0].xs, series: exprs.map((e, i) => ({ name: `${names[i]}(x)`, values: ys[i] })), y: 'num', numericX: true, xTitle: 'x' },
      table: { head: ['x', ...exprs.map((_, i) => names[i] + '(x)')], rows: tx.map((x) => [num(x, 4), ...fs.map((f) => (isFinite(f(x)) ? num(f(x), 5) : 'undef'))]) },
    };
  },
  answer: {
    text: (r) =>
      `Enter functions of x like <strong>x^2 − 4</strong> and <strong>2·sin(x) + 1</strong> to plot them together. The calculator finds that x² − 4 crosses zero at <strong>x = −2 and x = 2</strong>, and lists where the curves intersect: ${r.rows!.find((x) => x.label.includes('intersect'))!.value}.`,
  },
  intro: [
    'A graphing calculator turns equations into pictures, so you can see roots, turning points, asymptotes and where two curves meet. This free online graphing calculator plots up to three functions of x at once, in any window you choose.',
    'Beyond the graph, it solves numerically: it reports every root in the window, each function’s y-intercept, and the intersection points of f and g — the “solve by graphing” method from algebra class, done precisely. A table of values is included for homework. For the slope of a line through two points, use the <a href="/slope-calculator/">slope calculator</a>.',
  ],
  formula: {
    expr: 'Roots: sign changes of f(x) on a fine grid, refined by bisection to 1e-12\nIntersections: roots of f(x) − g(x)\nSyntax: x^2, sqrt(x), sin(x) [radians], ln(x), log(x) [base 10], abs(x), exp(x)',
    vars: [
      ['x', 'the variable to plot'],
      ['window', 'x min to x max (y-range is chosen automatically)'],
    ],
    notes: ['Trig functions on this page use radians, the convention for graphs. Roots where a curve touches but doesn’t cross zero (like x² at 0) may not be reported; zoom in to check.'],
  },
  examples: [
    { title: 'Line vs parabola', inputs: { f: 'x^2', g: '2*x + 3', h: '', xmin: -4, xmax: 5 }, explain: (r) => `They meet at ${r.rows!.at(-1)!.value}.` },
    { title: 'Cubic with three roots', inputs: { f: 'x^3 - 3*x', g: '', h: '', xmin: -3, xmax: 3 }, explain: (r) => `Roots at ${r.rows![0].value}.` },
    { title: 'Exponential growth vs decay', inputs: { f: 'exp(0.5*x)', g: 'exp(-0.5*x)', h: '', xmin: -4, xmax: 4 }, explain: (r) => `Mirror images, crossing at ${r.rows!.at(-1)!.value}.` },
  ],
  analysis() {
    const xs = Array.from({ length: 81 }, (_, i) => -2 + (4 * i) / 80);
    return [
      {
        title: 'Function families at a glance',
        insight: 'Linear functions grow at a constant rate, quadratics curve with a single turning point, and cubics can turn twice. Recognizing the family from a graph tells you how many roots to look for.',
        chart: {
          type: 'line',
          title: 'Linear, quadratic and cubic on [−2, 2]',
          x: xs,
          series: [
            { name: 'y = x', values: xs.map((x) => x) },
            { name: 'y = x²', values: xs.map((x) => x * x) },
            { name: 'y = x³ − x', values: xs.map((x) => x ** 3 - x) },
          ],
          y: 'num',
          numericX: true,
          xTitle: 'x',
        },
      },
    ];
  },
  variantQs: [
    { q: 'Can I solve equations by graphing?', a: 'Yes. Put each side of the equation in f and g; the x-values where they intersect are the solutions. The calculator lists them.' },
    { q: 'Is there a free graphing calculator like the ones used in class?', a: 'This tool covers the core graphing features — plotting, roots, intersections and tables — in any browser, without installs or sign-up.' },
  ],
  tips: [
    'Use * for multiplication: write 2*x, not 2x.',
    'Narrow the window to see detail near a root or turning point.',
    'For 1/x and tan(x), steep spikes near asymptotes are hidden so the graph stays readable.',
  ],
  faqs: [
    { q: 'How do I graph a function?', a: 'Type it in the f(x) box using x as the variable, such as 3*x^2 - 2*x + 1, and set the x-range. The graph updates instantly.' },
    { q: 'How do I find where two graphs intersect?', a: 'Enter one in f(x) and the other in g(x). Intersection points appear in the results.' },
    { q: 'Does it use degrees or radians?', a: 'Radians, which is standard for graphing trig functions. Convert degrees with x*pi/180.' },
    { q: 'Can it graph inequalities or parametric equations?', a: 'Not yet — it graphs functions y = f(x).' },
  ],
  sources: [{ label: 'math.js expression syntax', url: 'https://mathjs.org/docs/expressions/syntax.html' }],
  related: ['scientific-calculator', 'algebra-calculator', 'slope-calculator', 'integral-calculator', 'factoring-calculator'],
};
export default calc;
