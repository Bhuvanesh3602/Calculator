import { evaluate, normalize, math } from '../lib/expr';
import { num } from '../lib/format';
import type { Calculator } from '../lib/types';

function fmtResult(r: any): string {
  if (typeof r === 'number') return Math.abs(r) >= 1e15 || (Math.abs(r) < 1e-6 && r !== 0) ? r.toExponential(10).replace(/\.?0+e/, 'e') : num(r, 12);
  return math.format(r, { precision: 12 });
}

const calc: Calculator = {
  slug: 'scientific-calculator',
  name: 'Scientific Calculator',
  short: 'Scientific',
  category: 'math',
  keyword: 'scientific calculator',
  volume: 550000,
  variants: ['sci calculator', 'online scientific calculator', 'trig calculator', 'scientific calculator calculators'],
  title: 'Scientific Calculator Online – Trig, Logs, Powers & Roots',
  description:
    'Scientific calculator with sin, cos, tan, logs, exponents, roots, factorials, constants and degree/radian mode. Type or tap, see the parsed expression.',
  accent: 'type it or tap it',
  icon: 'ƒ',
  keypad: true,
  inputs: [
    { id: 'expr', label: 'Expression', type: 'text', default: 'sqrt(2) * sin(45) + 10^2 / 4', placeholder: 'e.g. 2^10, log(1000), sin(30)', mono: true },
    {
      id: 'angle',
      label: 'Angle mode',
      type: 'select',
      default: 'deg',
      options: [
        { value: 'deg', label: 'Degrees' },
        { value: 'rad', label: 'Radians' },
      ],
    },
  ],
  compute(v) {
    const e = String(v.expr || '').trim();
    if (!e) return { primary: { label: 'Result', value: '0' } };
    try {
      const r = evaluate(e, v.angle);
      return {
        primary: { label: e.length > 40 ? 'Result' : `${e} =`, value: fmtResult(r) },
        rows: typeof r === 'number' ? [{ label: 'Scientific notation', value: r.toExponential(8) }, { label: 'Angle mode', value: v.angle === 'deg' ? 'Degrees' : 'Radians' }] : [],
        steps: [`Parsed as: ${math.parse(normalize(e)).toString()}`],
      };
    } catch (err) {
      return { primary: { label: '', value: '' }, error: 'Could not evaluate: ' + (err as Error).message.replace(/\(char \d+\)/, '').trim() };
    }
  },
  answer: {
    text: (r) =>
      `Type an expression or tap the keys. For example, <strong>√2 × sin(45°) + 10² ÷ 4 = ${r.primary.value}</strong>. In degree mode sin(45) uses degrees; switch to radians for calculus and physics. Logs: <strong>log</strong> is base 10, <strong>ln</strong> is natural.`,
  },
  intro: [
    'A scientific calculator handles everything beyond basic arithmetic: trigonometry, logarithms, exponents, roots, factorials and constants like π and e. This one runs in your browser with a full expression parser, so you can type a whole formula instead of pressing keys one at a time.',
    'It follows standard order of operations, supports parentheses to any depth, and shows how it interpreted your input — a quick way to catch a misplaced bracket.',
  ],
  formula: {
    expr: 'Operators: +  −  ×(*)  ÷(/)  ^  !  ( )\nFunctions: sqrt cbrt abs sin cos tan asin acos atan log(=log10) ln exp floor ceil round\nConstants: pi  e',
    vars: [
      ['Order', 'parentheses → powers → × ÷ → + −'],
      ['n!', 'factorial, e.g. 5! = 120'],
      ['nthRoot(x, n)', 'n-th root, e.g. nthRoot(27, 3) = 3'],
    ],
  },
  examples: [
    { title: 'Compound growth', inputs: { expr: '1000 * (1 + 0.05/12)^(12*10)' }, explain: (r) => `= ${r.primary.value}.` },
    { title: 'Hypotenuse', inputs: { expr: 'sqrt(7^2 + 24^2)' }, explain: (r) => `= ${r.primary.value}.` },
    { title: 'Radians', inputs: { expr: 'cos(pi/3)', angle: 'rad' }, explain: (r) => `= ${r.primary.value}.` },
  ],
  analysis() {
    const ang = [0, 30, 45, 60, 90, 120, 135, 150, 180];
    const r = (d: number) => (d * Math.PI) / 180;
    return [
      {
        title: 'Exact trig values you should know',
        insight: 'Sine and cosine trade places across 0–90°: sin 30° = cos 60° = 0.5, and both equal √2/2 ≈ 0.7071 at 45°. Tan is sin ÷ cos, so it is undefined at 90° where cos is 0.',
        chart: {
          type: 'line',
          title: 'sin and cos from 0° to 180°',
          x: ang.map((a) => a + '°'),
          series: [
            { name: 'sin', values: ang.map((a) => Math.sin(r(a))) },
            { name: 'cos', values: ang.map((a) => Math.cos(r(a))) },
          ],
          y: 'num2',
          xTitle: 'Angle',
        },
        table: { head: ['Angle', 'sin', 'cos', 'tan'], rows: ang.map((a) => [a + '°', num(Math.sin(r(a)), 4), num(Math.cos(r(a)), 4), a === 90 ? 'undefined' : num(Math.tan(r(a)), 4)]) },
      },
    ];
  },
  variantQs: [
    { q: 'What can a sci calculator do that a basic one can’t?', a: 'Scientific (“sci”) calculators add functions like trig, logs, exponents, roots and factorials, plus order of operations for long expressions.' },
    { q: 'Is there a free online scientific calculator with degrees?', a: 'Yes — this one. Choose Degrees or Radians in the angle-mode selector.' },
  ],
  tips: [
    'Check angle mode first — most trig mistakes are degrees vs radians.',
    'Use parentheses generously: 1/(2*3) is not the same as 1/2*3.',
    'For very large or small results, read the scientific notation line.',
  ],
  faqs: [
    { q: 'How do I calculate a square root?', a: 'Type sqrt(number), or tap √ and enter the number followed by a closing parenthesis. For other roots use nthRoot(x, n) or x^(1/n).' },
    { q: 'What is the difference between log and ln?', a: 'log is the base-10 logarithm; ln is the natural logarithm, base e ≈ 2.71828.' },
    { q: 'How do I enter exponents?', a: 'Use ^. For example 2^10 = 1024, and 10^-3 = 0.001.' },
    { q: 'Does this calculator follow order of operations?', a: 'Yes: parentheses, exponents, multiplication and division, then addition and subtraction (PEMDAS).' },
  ],
  sources: [{ label: 'math.js expression syntax documentation', url: 'https://mathjs.org/docs/expressions/syntax.html' }],
  related: ['graphing-calculator', 'algebra-calculator', 'integral-calculator', 'fraction-calculator', 'percentage-calculator'],
};
export default calc;
