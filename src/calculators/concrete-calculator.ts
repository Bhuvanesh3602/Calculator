import { num, usd } from '../lib/format';
import type { Calculator, Values } from '../lib/types';

/** Approximate yield of pre-mixed concrete bags (cu ft per bag), per common manufacturer data. */
export const BAG_YIELD: [string, number][] = [
  ['40 lb', 0.3],
  ['60 lb', 0.45],
  ['80 lb', 0.6],
];
export function concreteCuFt(v: Values) {
  const q = +v.qty || 1;
  if (v.shape === 'column') {
    const r = +v.diameter / 12 / 2;
    return Math.PI * r * r * +v.height * q;
  }
  if (v.shape === 'stairs') {
    // steps: run (in), rise (in), width (ft), count — solid stair volume
    const run = +v.run / 12,
      rise = +v.rise / 12,
      w = +v.width,
      n = Math.round(+v.steps) || 1;
    let s = 0;
    for (let i = 1; i <= n; i++) s += run * rise * i * w;
    return s * q;
  }
  return +v.length * +v.width * (+v.thick / 12) * q;
}

const calc: Calculator = {
  slug: 'concrete-calculator',
  name: 'Concrete Calculator',
  short: 'Concrete',
  category: 'construction',
  keyword: 'concrete calculator',
  volume: 450000,
  variants: ['concrete figuring calculator', 'concrete measurement calculator', 'concrete bag calculator', 'cubic yards of concrete calculator'],
  title: 'Concrete Calculator – Cubic Yards, Bags & Cost for Slabs, Columns',
  description:
    'Work out how much concrete you need for a slab, footing, column or steps, in cubic yards and 40/60/80 lb bags, with a waste allowance and cost estimate.',
  accent: 'yards, bags and cost',
  icon: '▥',
  inputs: [
    {
      id: 'shape',
      label: 'Project',
      type: 'select',
      default: 'slab',
      options: [
        { value: 'slab', label: 'Slab, patio, footing or wall' },
        { value: 'column', label: 'Round column or post hole' },
        { value: 'stairs', label: 'Steps' },
      ],
    },
    { id: 'length', label: 'Length', type: 'number', default: 12, min: 0, step: 0.5, suffix: 'ft', showIf: { field: 'shape', in: ['slab'] } },
    { id: 'width', label: 'Width', type: 'number', default: 10, min: 0, step: 0.5, suffix: 'ft', showIf: { field: 'shape', in: ['slab', 'stairs'] } },
    { id: 'thick', label: 'Thickness', type: 'number', default: 4, min: 1, step: 0.5, suffix: 'in', showIf: { field: 'shape', in: ['slab'] } },
    { id: 'diameter', label: 'Diameter', type: 'number', default: 12, min: 1, step: 1, suffix: 'in', showIf: { field: 'shape', in: ['column'] } },
    { id: 'height', label: 'Depth / height', type: 'number', default: 3, min: 0, step: 0.5, suffix: 'ft', showIf: { field: 'shape', in: ['column'] } },
    { id: 'steps', label: 'Number of steps', type: 'number', default: 3, min: 1, max: 20, step: 1, showIf: { field: 'shape', in: ['stairs'] } },
    { id: 'rise', label: 'Rise per step', type: 'number', default: 7, min: 4, max: 10, step: 0.5, suffix: 'in', showIf: { field: 'shape', in: ['stairs'] } },
    { id: 'run', label: 'Run (tread depth)', type: 'number', default: 11, min: 8, max: 20, step: 0.5, suffix: 'in', showIf: { field: 'shape', in: ['stairs'] } },
    { id: 'qty', label: 'Quantity', type: 'number', default: 1, min: 1, step: 1 },
    { id: 'waste', label: 'Extra for waste/spillage', type: 'number', default: 10, min: 0, max: 30, step: 1, suffix: '%' },
    { id: 'price', label: 'Ready-mix price', type: 'number', default: 165, min: 0, step: 5, prefix: '$', suffix: '/yd³' },
  ],
  compute(v) {
    const base = concreteCuFt(v);
    if (!(base > 0)) return { primary: { label: '', value: '' }, error: 'Enter dimensions above zero.' };
    const cuft = base * (1 + (+v.waste || 0) / 100);
    const yd = cuft / 27;
    return {
      primary: { label: 'Concrete needed', value: `${num(yd, 2)} cubic yards` },
      rows: [
        { label: 'Cubic feet', value: num(cuft, 1) },
        { label: 'Cubic metres', value: num(cuft * 0.0283168, 2) },
        ...BAG_YIELD.map(([s, y]) => ({ label: `${s} bags`, value: String(Math.ceil(cuft / y)) })),
        { label: 'Ready-mix cost (estimate)', value: usd(yd * (+v.price || 0)) },
      ],
      note: yd < 1 ? 'Under 1 yd³, bags are often cheaper than a truck, which usually has a minimum load charge.' : undefined,
    };
  },
  answer: {
    text: (r) =>
      `A <strong>12 × 10 ft patio, 4 inches thick</strong>, needs about <strong>${r.primary.value}</strong> of concrete including 10% extra — that is ${r.rows![0].value} cubic feet, or <strong>${r.rows![4].value} 80-lb bags</strong>. Multiply length × width × thickness (in feet) and divide by 27 to convert to cubic yards.`,
  },
  intro: [
    'A concrete calculator tells you how much concrete to order for a project. Ready-mix is sold by the cubic yard; bagged mix by weight. Under-ordering is expensive — a second delivery or a cold joint — so we add a waste allowance by default.',
    'Choose a slab (also patios, driveways, footings and walls), round columns and post holes, or steps. You get cubic yards, cubic feet, cubic metres, the number of 40, 60 and 80 lb bags, and a cost estimate at your local ready-mix price.',
  ],
  formula: {
    expr: 'Slab:    L(ft) × W(ft) × T(in)/12\nColumn:  π × (D(in)/24)² × H(ft)\nSteps:   Σ run × (rise × i) × width,  i = 1…n\nCubic yards = cubic feet ÷ 27\nBags = cubic feet ÷ yield (0.30 / 0.45 / 0.60 ft³)',
    vars: [
      ['27', 'cubic feet per cubic yard'],
      ['yield', 'approximate volume of mixed concrete per bag size'],
    ],
  },
  examples: [
    { title: '24 × 24 ft garage slab, 6″', inputs: { length: 24, width: 24, thick: 6 }, explain: (r) => `${r.primary.value} — order by truck.` },
    { title: '8 fence-post holes, 10″ × 3 ft', inputs: { shape: 'column', diameter: 10, height: 3, qty: 8 }, explain: (r) => `${r.rows![3].value} bags of 60 lb.` },
    { title: '4 steps, 4 ft wide', inputs: { shape: 'stairs', steps: 4, width: 4, rise: 7, run: 11 }, explain: (r) => `${r.primary.value}.` },
  ],
  analysis() {
    const th = [3, 4, 5, 6, 8];
    const cov = th.map((t) => 27 / (t / 12));
    const area = [100, 200, 400, 600, 800];
    const bags = area.map((a) => Math.ceil((a * (4 / 12) * 1.1) / 0.6));
    return [
      {
        title: 'How far one cubic yard goes',
        insight: `One cubic yard covers about <strong>${num(cov[1], 0)} sq ft at 4 inches</strong> thick but only ${num(cov[3], 0)} sq ft at 6 inches. Driveways (often 5–6″) need noticeably more than patios.`,
        chart: { type: 'bar', title: 'Square feet covered by 1 yd³ by slab thickness', x: th.map((t) => t + '″'), series: [{ name: 'Sq ft per yd³', values: cov }], y: 'int', xTitle: 'Thickness' },
      },
      {
        title: 'Bags vs truck: when to switch',
        insight: `A 200 sq ft, 4″ slab needs about <strong>${bags[1]} bags</strong> of 80 lb concrete (with 10% extra). That is a lot of mixing. Beyond roughly 1 yd³, ready-mix is usually easier and often cheaper.`,
        table: { head: ['Slab area (4″)', 'Cubic yards (+10%)', '80 lb bags'], rows: area.map((a, i) => [a + ' sq ft', num((a * (4 / 12) * 1.1) / 27, 2), bags[i]]) },
      },
    ];
  },
  variantQs: [
    { q: 'How do I figure concrete for a slab?', a: 'Multiply length × width in feet by thickness in inches ÷ 12 to get cubic feet, then divide by 27 for cubic yards. Add 5–10% for waste.' },
    { q: 'How do I measure for concrete?', a: 'Measure the form’s inside length and width, and the actual depth at several points — subgrades are rarely perfectly flat. Use the deepest typical measurement.' },
  ],
  tips: [
    'Add 5–10% for spillage and uneven subgrade; more for irregular shapes.',
    'Order to the nearest quarter yard; trucks charge short-load fees on small orders.',
    'Typical thickness: 4″ for patios and walks, 5–6″ for driveways.',
    'Check that your subgrade is compacted and forms are level before the truck arrives.',
  ],
  faqs: [
    { q: 'How many bags of concrete do I need?', a: 'Divide the cubic feet needed by the bag yield: about 0.60 ft³ for an 80 lb bag, 0.45 for 60 lb and 0.30 for 40 lb.' },
    { q: 'How much concrete do I need for a 10×10 slab?', a: `At 4 inches thick, about ${num((10 * 10 * (4 / 12)) / 27, 2)} cubic yards before waste, or ${num((10 * 10 * (4 / 12) * 1.1) / 27, 2)} with 10% extra.` },
    { q: 'How much does a yard of concrete cost?', a: 'Ready-mix prices vary widely by region and order size. Get a local quote and enter it above.' },
    { q: 'How thick should a concrete slab be?', a: 'Four inches is standard for patios and sidewalks; driveways and garage floors are often 5–6 inches.' },
  ],
  sources: [
    { label: 'Portland Cement Association – Concrete basics', url: 'https://www.cement.org/' },
    { label: 'American Concrete Institute – Resources', url: 'https://www.concrete.org/' },
  ],
  related: ['square-footage-calculator', 'volume-calculator', 'area-calculator', 'ratio-calculator'],
};
export default calc;
