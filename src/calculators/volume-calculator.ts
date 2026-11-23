import { num } from '../lib/format';
import type { Calculator, Values } from '../lib/types';

const SHAPES: Record<string, { label: string; f: (v: Values) => number; formula: string; need: string[] }> = {
  box: { label: 'Box / rectangular prism', f: (v) => +v.a * +v.b * +v.c, formula: 'V = length × width × height', need: ['Length', 'Width', 'Height'] },
  cube: { label: 'Cube', f: (v) => (+v.a) ** 3, formula: 'V = side³', need: ['Side'] },
  cyl: { label: 'Cylinder', f: (v) => Math.PI * (+v.a) ** 2 * +v.b, formula: 'V = π r² h', need: ['Radius', 'Height'] },
  sphere: { label: 'Sphere', f: (v) => (4 / 3) * Math.PI * (+v.a) ** 3, formula: 'V = 4/3 π r³', need: ['Radius'] },
  cone: { label: 'Cone', f: (v) => (1 / 3) * Math.PI * (+v.a) ** 2 * +v.b, formula: 'V = 1/3 π r² h', need: ['Radius', 'Height'] },
  pyramid: { label: 'Square pyramid', f: (v) => (1 / 3) * (+v.a) ** 2 * +v.b, formula: 'V = 1/3 × base² × h', need: ['Base side', 'Height'] },
  capsule: { label: 'Capsule', f: (v) => Math.PI * (+v.a) ** 2 * ((4 / 3) * +v.a + +v.b), formula: 'V = π r² (4/3 r + h)', need: ['Radius', 'Cylinder length'] },
};
const UNITS: Record<string, number> = { m: 1, cm: 0.01, mm: 0.001, in: 0.0254, ft: 0.3048, yd: 0.9144 };

const calc: Calculator = {
  slug: 'volume-calculator',
  name: 'Volume Calculator',
  short: 'Volume',
  category: 'construction',
  keyword: 'volume calculator',
  volume: 165000,
  variants: ['cubic feet calculator', 'cylinder volume calculator', 'tank volume calculator', 'gallons calculator'],
  title: 'Volume Calculator – Cylinder, Sphere, Box in Gallons & Liters',
  description:
    'Calculate the volume of boxes, cubes, cylinders, spheres, cones, pyramids and capsules in any unit, converted to cubic feet, cubic metres, liters and US gallons.',
  accent: 'in gallons, litres, cubic feet',
  icon: '◫',
  inputs: [
    { id: 'shape', label: 'Shape', type: 'select', default: 'cyl', options: Object.entries(SHAPES).map(([value, s]) => ({ value, label: s.label })) },
    { id: 'a', label: 'Dimension 1', type: 'number', default: 1.5, min: 0, help: 'Length / side / radius' },
    { id: 'b', label: 'Dimension 2', type: 'number', default: 4, min: 0, help: 'Width / height / length', showIf: { field: 'shape', in: ['box', 'cyl', 'cone', 'pyramid', 'capsule'] } },
    { id: 'c', label: 'Dimension 3', type: 'number', default: 3, min: 0, help: 'Height', showIf: { field: 'shape', in: ['box'] } },
    { id: 'unit', label: 'Unit', type: 'select', default: 'ft', options: Object.keys(UNITS).map((u) => ({ value: u, label: u })) },
  ],
  compute(v) {
    const s = SHAPES[v.shape];
    const V = s.f(v);
    if (!(V > 0)) return { primary: { label: '', value: '' }, error: 'Enter positive dimensions.' };
    const m3 = V * UNITS[v.unit] ** 3;
    return {
      primary: { label: `Volume of ${s.label.toLowerCase()}`, value: `${num(V, 4)} ${v.unit}³` },
      rows: [
        { label: 'US gallons', value: num(m3 * 264.172052, 3) },
        { label: 'Liters', value: num(m3 * 1000, 3) },
        { label: 'Cubic feet', value: num(m3 * 35.3146667, 4) },
        { label: 'Cubic metres', value: num(m3, 5) },
        { label: 'Cubic yards', value: num(m3 * 1.30795062, 4) },
        { label: 'Water weight', value: `${num(m3 * 1000, 1)} kg / ${num(m3 * 1000 * 2.20462, 1)} lb` },
      ],
      steps: [s.formula, `${s.need.map((n, i) => `${n} = ${v[['a', 'b', 'c'][i]]} ${v.unit}`).join(', ')}`, `V = ${num(V, 6)} ${v.unit}³`],
    };
  },
  answer: {
    text: (r) =>
      `A <strong>cylindrical tank with a 1.5 ft radius and 4 ft height</strong> holds <strong>${r.primary.value.replace('ft³', 'cubic feet')}</strong> — about <strong>${r.rows![0].value} US gallons</strong> (${r.rows![1].value} liters). Volume of a cylinder = π × radius² × height.`,
  },
  intro: [
    'Volume is the amount of space a 3D shape occupies, measured in cubic units. It tells you how much a tank, pool, planter, box or room can hold.',
    'Pick a shape, enter its dimensions in any unit, and get the volume converted to US gallons, liters, cubic feet, cubic metres and cubic yards — plus the weight if it were filled with water.',
  ],
  formula: {
    expr: Object.values(SHAPES)
      .map((s) => `${s.label.padEnd(26)} ${s.formula}`)
      .join('\n'),
    vars: [
      ['1 ft³', '7.48 US gallons = 28.32 liters'],
      ['1 m³', '1,000 liters = 264.17 US gallons'],
    ],
  },
  examples: [
    { title: 'Aquarium 48 × 13 × 21 in', inputs: { shape: 'box', a: 48, b: 13, c: 21, unit: 'in' }, explain: (r) => `${r.rows![0].value} gallons (before gravel and decor).` },
    { title: 'Raised bed 8 × 4 × 1 ft', inputs: { shape: 'box', a: 8, b: 4, c: 1, unit: 'ft' }, explain: (r) => `${r.rows![4].value} cubic yards of soil.` },
    { title: 'Ball, radius 11 cm', inputs: { shape: 'sphere', a: 11, unit: 'cm' }, explain: (r) => `${r.rows![1].value} liters.` },
  ],
  analysis() {
    const rs = [0.5, 1, 1.5, 2, 2.5, 3];
    return [
      {
        title: 'Doubling the radius quadruples a cylinder’s volume',
        insight: `A 4 ft tall cylinder with a 1 ft radius holds about ${num(Math.PI * 4 * 7.48052, 0)} gallons; with a 2 ft radius it holds <strong>${num(Math.PI * 4 * 4 * 7.48052, 0)} gallons</strong> — four times as much. Volume grows with the square of the radius but only linearly with height.`,
        chart: { type: 'line', title: 'US gallons in a 4 ft tall cylinder by radius', x: rs.map((r) => r + ' ft'), series: [{ name: 'Gallons', values: rs.map((r) => Math.PI * r * r * 4 * 7.48052) }], y: 'int', xTitle: 'Radius' },
      },
    ];
  },
  variantQs: [
    { q: 'How do I calculate cubic feet?', a: 'For a box, multiply length × width × height in feet. For other units, enter them and read the “Cubic feet” line.' },
    { q: 'How many gallons does my tank hold?', a: 'Choose the tank’s shape, enter inside dimensions, and read “US gallons”. Use inside measurements, not outside.' },
  ],
  tips: [
    'Measure inside dimensions for capacity; wall thickness can matter on small tanks.',
    'Radius is half the diameter.',
    'Usable volume is less than total if you leave headroom or add gravel.',
  ],
  faqs: [
    { q: 'How many gallons are in a cubic foot?', a: 'About 7.48 US gallons.' },
    { q: 'What is the volume of a cylinder?', a: 'π × radius² × height.' },
    { q: 'How many liters are in a cubic metre?', a: '1,000 liters.' },
    { q: 'How do I find the volume of an irregular object?', a: 'Submerge it in water and measure the volume of water displaced, or split it into simple shapes.' },
  ],
  sources: [{ label: 'NIST Handbook 44 – Appendix C, units of volume', url: 'https://www.nist.gov/pml/owm/publications/nist-handbooks/handbook-44' }],
  related: ['area-calculator', 'concrete-calculator', 'square-footage-calculator', 'scientific-calculator'],
};
export default calc;
