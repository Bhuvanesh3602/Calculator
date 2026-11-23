import { num } from '../lib/format';
import type { Calculator } from '../lib/types';

const calc: Calculator = {
  slug: 'slope-calculator',
  name: 'Slope Calculator',
  short: 'Slope',
  category: 'math',
  keyword: 'slope calculator',
  volume: 165000,
  variants: ['slope intercept form calculator', 'point slope form calculator', 'rise over run calculator', 'gradient calculator'],
  title: 'Slope Calculator – Slope, Line Equation & Angle from 2 Points',
  description:
    'Find the slope between two points, the line’s equation in slope-intercept and point-slope form, its angle, distance and midpoint — graphed, with steps.',
  accent: 'from two points',
  icon: '/',
  inputs: [
    { id: 'x1', label: 'x₁', type: 'number', default: 1 },
    { id: 'y1', label: 'y₁', type: 'number', default: 2 },
    { id: 'x2', label: 'x₂', type: 'number', default: 5 },
    { id: 'y2', label: 'y₂', type: 'number', default: 10 },
  ],
  compute(v) {
    const x1 = +v.x1,
      y1 = +v.y1,
      x2 = +v.x2,
      y2 = +v.y2;
    if ([x1, y1, x2, y2].some((n) => !isFinite(n))) return { primary: { label: '', value: '' }, error: 'Enter both points.' };
    if (x1 === x2 && y1 === y2) return { primary: { label: '', value: '' }, error: 'The two points are identical.' };
    const dx = x2 - x1,
      dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    const lo = Math.min(x1, x2) - Math.max(2, Math.abs(dx) * 0.5),
      hi = Math.max(x1, x2) + Math.max(2, Math.abs(dx) * 0.5);
    if (dx === 0)
      return {
        primary: { label: 'Slope', value: 'Undefined (vertical line)' },
        rows: [
          { label: 'Equation', value: `x = ${num(x1, 4)}` },
          { label: 'Distance', value: num(dist, 6) },
        ],
      };
    const m = dy / dx;
    const b = y1 - m * x1;
    const xs = Array.from({ length: 41 }, (_, i) => +(lo + ((hi - lo) * i) / 40).toFixed(4));
    return {
      primary: { label: 'Slope m', value: num(m, 6) },
      rows: [
        { label: 'Slope-intercept', value: `y = ${num(m, 4)}x ${b >= 0 ? '+' : '−'} ${num(Math.abs(b), 4)}` },
        { label: 'Point-slope', value: `y − ${num(y1, 4)} = ${num(m, 4)}(x − ${num(x1, 4)})` },
        { label: 'Angle with x-axis', value: num((Math.atan(m) * 180) / Math.PI, 3) + '°' },
        { label: 'Grade', value: num(m * 100, 2) + '%' },
        { label: 'Distance between points', value: num(dist, 6) },
        { label: 'Midpoint', value: `(${num((x1 + x2) / 2, 4)}, ${num((y1 + y2) / 2, 4)})` },
        { label: 'x-intercept', value: m !== 0 ? num(-b / m, 4) : 'none' },
      ],
      steps: [`Rise: y₂ − y₁ = ${y2} − ${y1} = ${dy}`, `Run: x₂ − x₁ = ${x2} − ${x1} = ${dx}`, `m = rise ÷ run = ${dy} ÷ ${dx} = ${num(m, 6)}`, `b = y₁ − m·x₁ = ${y1} − ${num(m, 4)} × ${x1} = ${num(b, 4)}`],
      chart: { type: 'line', title: 'The line through both points', x: xs, series: [{ name: 'y', values: xs.map((x) => m * x + b) }], y: 'num', numericX: true, xTitle: 'x' },
    };
  },
  answer: {
    text: (r) =>
      `The slope between <strong>(1, 2) and (5, 10)</strong> is <strong>${r.primary.value}</strong>: rise ÷ run = (10 − 2) ÷ (5 − 1) = 8 ÷ 4. The line’s equation is <strong>${r.rows![0].value}</strong>, and it rises at ${r.rows![2].value} to the horizontal.`,
  },
  intro: [
    'Slope measures how steep a line is: how much y changes for each one-unit change in x. Positive slopes rise left to right, negative slopes fall, zero is flat, and vertical lines have undefined slope.',
    'Enter any two points to get the slope, the equation in slope-intercept and point-slope form, the angle in degrees, the percent grade used for roads and ramps, plus distance and midpoint — with a graph of the line.',
  ],
  formula: {
    expr: 'm = (y₂ − y₁) / (x₂ − x₁)\ny = mx + b,  b = y₁ − m·x₁\nAngle θ = arctan(m)\nDistance = √((x₂ − x₁)² + (y₂ − y₁)²)',
    vars: [
      ['m', 'slope (rise over run)'],
      ['b', 'y-intercept'],
    ],
  },
  examples: [
    { title: 'Falling line', inputs: { x1: -2, y1: 4, x2: 3, y2: -1 }, explain: (r) => `m = ${r.primary.value}; ${r.rows![0].value}.` },
    { title: 'Wheelchair ramp: 1 ft rise over 12 ft', inputs: { x1: 0, y1: 0, x2: 12, y2: 1 }, explain: (r) => `Grade ${r.rows![3].value}, angle ${r.rows![2].value} — the ADA maximum.` },
    { title: 'Horizontal line', inputs: { x1: 0, y1: 3, x2: 7, y2: 3 }, explain: () => `Slope 0: y never changes.` },
  ],
  analysis() {
    const grades = [1, 5, 8.33, 10, 15, 25, 50, 100];
    return [
      {
        title: 'Percent grade vs angle',
        insight: 'A 100% grade is 45°, not 90°. Grades grow much faster than angles: an 8.33% ramp (1:12) is only <strong>4.76°</strong>, while a 50% slope is 26.6°. Road signs use percent; geometry uses degrees.',
        chart: { type: 'bar', title: 'Angle in degrees for each percent grade', x: grades.map((g) => g + '%'), series: [{ name: 'Angle (°)', values: grades.map((g) => (Math.atan(g / 100) * 180) / Math.PI) }], y: 'num', xTitle: 'Grade' },
        table: { head: ['Grade', 'Slope', 'Angle', 'Example'], rows: grades.map((g, i) => [g + '%', num(g / 100, 4), num((Math.atan(g / 100) * 180) / Math.PI, 2) + '°', ['Drainage', 'Accessible path', 'ADA ramp max (1:12)', 'Steep road', 'Very steep street', 'Stairs-like', 'Ski slope (expert)', '45° line'][i]]) },
      },
    ];
  },
  variantQs: [
    { q: 'How do I get slope-intercept form?', a: 'Compute m from the two points, then b = y₁ − m·x₁. The equation is y = mx + b, shown in the result.' },
    { q: 'What is rise over run?', a: 'Another name for slope: rise is the vertical change (Δy), run is the horizontal change (Δx).' },
  ],
  tips: [
    'Subtract in the same order on top and bottom (y₂ − y₁ over x₂ − x₁).',
    'Parallel lines have equal slopes; perpendicular slopes multiply to −1.',
    'For ramps and roofs, the grade (slope × 100) is usually what codes specify.',
  ],
  faqs: [
    { q: 'How do you find the slope between two points?', a: 'Divide the difference in y by the difference in x: m = (y₂ − y₁)/(x₂ − x₁).' },
    { q: 'What does a negative slope mean?', a: 'The line goes down from left to right: y decreases as x increases.' },
    { q: 'What is the slope of a vertical line?', a: 'Undefined, because the run is zero and you cannot divide by zero.' },
    { q: 'How do you convert slope to an angle?', a: 'Take the arctangent: θ = tan⁻¹(m). A slope of 1 is 45°.' },
  ],
  sources: [
    { label: 'Khan Academy – Slope', url: 'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:linear-equations-graphs' },
    { label: 'ADA Standards §405.2 – Ramp slope', url: 'https://www.access-board.gov/ada/#ada-405' },
  ],
  related: ['graphing-calculator', 'algebra-calculator', 'distance-calculator', 'ratio-calculator', 'factoring-calculator'],
};
export default calc;
