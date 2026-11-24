import { num } from '../lib/format';
import type { Calculator, Values } from '../lib/types';

const SHAPES: Record<string, { label: string; fields: string[]; f: (v: Values) => number; formula: string }> = {
  rect: { label: 'Rectangle', fields: ['a', 'b'], f: (v) => +v.a * +v.b, formula: 'A = length × width' },
  square: { label: 'Square', fields: ['a'], f: (v) => +v.a * +v.a, formula: 'A = side²' },
  tri: { label: 'Triangle (base & height)', fields: ['a', 'b'], f: (v) => (+v.a * +v.b) / 2, formula: 'A = ½ × base × height' },
  heron: {
    label: 'Triangle (three sides)',
    fields: ['a', 'b', 'c'],
    f: (v) => {
      const s = (+v.a + +v.b + +v.c) / 2;
      return Math.sqrt(s * (s - +v.a) * (s - +v.b) * (s - +v.c));
    },
    formula: 'A = √(s(s−a)(s−b)(s−c)), s = (a+b+c)/2',
  },
  circle: { label: 'Circle (radius)', fields: ['a'], f: (v) => Math.PI * (+v.a) ** 2, formula: 'A = π r²' },
  trap: { label: 'Trapezoid', fields: ['a', 'b', 'c'], f: (v) => ((+v.a + +v.b) / 2) * +v.c, formula: 'A = ½ (a + b) × h' },
  ellipse: { label: 'Ellipse', fields: ['a', 'b'], f: (v) => Math.PI * +v.a * +v.b, formula: 'A = π × a × b (semi-axes)' },
  para: { label: 'Parallelogram', fields: ['a', 'b'], f: (v) => +v.a * +v.b, formula: 'A = base × height' },
  sector: { label: 'Circle sector', fields: ['a', 'b'], f: (v) => (+v.b / 360) * Math.PI * (+v.a) ** 2, formula: 'A = (θ/360) × π r²' },
};
const LABELS: Record<string, [string, string, string]> = {
  rect: ['Length', 'Width', ''],
  square: ['Side', '', ''],
  tri: ['Base', 'Height', ''],
  heron: ['Side a', 'Side b', 'Side c'],
  circle: ['Radius', '', ''],
  trap: ['Base a', 'Base b', 'Height'],
  ellipse: ['Semi-axis a', 'Semi-axis b', ''],
  para: ['Base', 'Height', ''],
  sector: ['Radius', 'Angle (degrees)', ''],
};
const UNITS: Record<string, number> = { m: 1, cm: 0.01, mm: 0.001, km: 1000, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344 };

const calc: Calculator = {
  slug: 'area-calculator',
  name: 'Area Calculator',
  short: 'Area',
  category: 'construction',
  keyword: 'area calculator',
  volume: 165000,
  variants: ['area of a triangle calculator', 'area of a circle calculator', 'surface area calculator', 'land area calculator'],
  title: 'Area Calculator – 9 Shapes with Formulas & Unit Conversions',
  description:
    'Calculate the area of rectangles, squares, triangles, circles, trapezoids, ellipses and sectors in any unit, converted to sq ft, m², acres and more.',
  accent: 'any shape, any unit',
  icon: '▲',
  inputs: [
    { id: 'shape', label: 'Shape', type: 'select', default: 'tri', options: Object.entries(SHAPES).map(([value, s]) => ({ value, label: s.label })) },
    { id: 'a', label: 'Dimension 1', type: 'number', default: 8, min: 0, help: 'Length / base / radius / side a' },
    { id: 'b', label: 'Dimension 2', type: 'number', default: 5, min: 0, help: 'Width / height / side b / angle', showIf: { field: 'shape', in: ['rect', 'tri', 'heron', 'trap', 'ellipse', 'para', 'sector'] } },
    { id: 'c', label: 'Dimension 3', type: 'number', default: 6, min: 0, help: 'Side c / trapezoid height', showIf: { field: 'shape', in: ['heron', 'trap'] } },
    { id: 'unit', label: 'Unit of measurement', type: 'select', default: 'ft', options: Object.keys(UNITS).map((u) => ({ value: u, label: u })) },
  ],
  compute(v) {
    const s = SHAPES[v.shape];
    const A = s.f(v);
    if (!isFinite(A) || A <= 0) return { primary: { label: '', value: '' }, error: v.shape === 'heron' ? 'Those sides cannot form a triangle.' : 'Enter positive dimensions.' };
    const m2 = A * UNITS[v.unit] ** 2;
    const lab = LABELS[v.shape];
    return {
      primary: { label: `Area of ${s.label.toLowerCase()}`, value: `${num(A, 4)} ${v.unit}²` },
      rows: [
        { label: 'Square feet', value: num(m2 / 0.09290304, 4) },
        { label: 'Square meters', value: num(m2, 4) },
        { label: 'Square inches', value: num(m2 / 0.00064516, 2) },
        { label: 'Acres', value: num(m2 / 4046.8564224, 6) },
        { label: 'Hectares', value: num(m2 / 10000, 6) },
      ],
      steps: [s.formula, `${lab.filter(Boolean).map((l, i) => `${l} = ${v[['a', 'b', 'c'][i]]}`).join(', ')}`, `A = ${num(A, 6)} ${v.unit}²`],
    };
  },
  answer: {
    text: (r) =>
      `The area of a <strong>triangle with base 8 ft and height 5 ft</strong> is <strong>${r.primary.value.replace('ft²', 'sq ft')}</strong>: half of base × height = ½ × 8 × 5. Pick another shape — circle, trapezoid, ellipse and more — and any unit, and the area is converted to square feet, square meters and acres.`,
  },
  intro: [
    'Area is the amount of flat surface inside a shape, measured in square units. Each shape has its own formula, and mixing units (feet with inches) is the most common error.',
    'Choose from nine shapes, enter dimensions in any unit, and get the area with the formula and working shown, converted into square feet, meters, inches, acres and hectares. For whole rooms or floors, use our <a href="/square-footage-calculator/">square footage calculator</a>; for the space inside a 3D shape, use the <a href="/volume-calculator/">volume calculator</a>.',
  ],
  formula: {
    expr: Object.values(SHAPES)
      .map((s) => `${s.label.padEnd(26)} ${s.formula}`)
      .join('\n'),
    vars: [
      ['π', '≈ 3.14159'],
      ['1 acre', '43,560 sq ft = 4,046.86 m²'],
    ],
  },
  examples: [
    { title: 'Circle, radius 3 m', inputs: { shape: 'circle', a: 3, unit: 'm' }, explain: (r) => `${r.primary.value}.` },
    { title: 'Trapezoid garden bed', inputs: { shape: 'trap', a: 10, b: 6, c: 4, unit: 'ft' }, explain: (r) => `${r.primary.value}.` },
    { title: 'Triangle from sides 13, 14, 15', inputs: { shape: 'heron', a: 13, b: 14, c: 15, unit: 'cm' }, explain: (r) => `Heron’s formula: ${r.primary.value}.` },
  ],
  analysis() {
    const P = 40;
    const shapes: [string, number][] = [
      ['Equilateral triangle', (Math.sqrt(3) / 4) * (P / 3) ** 2],
      ['Rectangle 15×5', 15 * 5],
      ['Square', (P / 4) ** 2],
      ['Regular hexagon', ((3 * Math.sqrt(3)) / 2) * (P / 6) ** 2],
      ['Circle', P ** 2 / (4 * Math.PI)],
    ];
    return [
      {
        title: 'Same fence, different area',
        insight: `With 40 ft of fencing, a circle encloses <strong>${num(shapes[4][1], 0)} sq ft</strong> while a square encloses ${num(shapes[2][1], 0)} and a long 15×5 rectangle only ${num(shapes[1][1], 0)}. For a fixed perimeter, rounder shapes hold more area.`,
        chart: { type: 'hbar', title: 'Area enclosed by a 40 ft perimeter', x: shapes.map((s) => s[0]), series: [{ name: 'Sq ft', values: shapes.map((s) => s[1]) }], y: 'int' },
      },
    ];
  },
  variantQs: [
    { q: 'How do I find the area of a triangle?', a: 'Half of base times height. If you only know the three sides, choose “Triangle (three sides)” to use Heron’s formula.' },
    { q: 'How do I calculate land area in acres?', a: 'Measure in feet or meters, calculate the area, and read the acres line. One acre is 43,560 square feet.' },
  ],
  tips: [
    'Convert all measurements to the same unit before calculating.',
    'Split irregular shapes into simple ones and add the areas.',
    'Area units are squared: 1 ft = 12 in, but 1 sq ft = 144 sq in.',
  ],
  faqs: [
    { q: 'What is the area of a circle?', a: 'π times the radius squared. A circle with radius 5 has an area of about 78.54 square units.' },
    { q: 'How many square feet are in an acre?', a: '43,560 square feet.' },
    { q: 'What is the difference between area and perimeter?', a: 'Area measures the surface inside a shape (square units); perimeter measures the distance around it (linear units).' },
    { q: 'How do I find the area of an irregular shape?', a: 'Divide it into rectangles, triangles and circles, find each area, and add them together.' },
  ],
  sources: [{ label: 'NIST – Units of area (SI and US customary)', url: 'https://www.nist.gov/pml/owm/si-units-area' }],
  related: ['square-footage-calculator', 'volume-calculator', 'concrete-calculator', 'distance-calculator', 'slope-calculator'],
};
export default calc;
