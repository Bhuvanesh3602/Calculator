import { num, usd } from '../lib/format';
import type { Calculator, Values } from '../lib/types';

export function sqft(rows: Values[]): (Values & { area: number })[] {
  return rows.map((r) => {
    const l = +r.length || 0,
      w = +r.width || 0;
    let a = l * w;
    if (r.shape === 'tri') a = (l * w) / 2;
    if (r.shape === 'circle') a = Math.PI * (l / 2) ** 2;
    return { ...r, area: a };
  });
}
const room = (name: string, length: number, width: number, shape = 'rect') => ({ name, shape, length, width });

const calc: Calculator = {
  slug: 'square-footage-calculator',
  name: 'Square Footage Calculator',
  short: 'Square Footage',
  category: 'construction',
  keyword: 'square footage calculator',
  volume: 201000,
  variants: ['find square footage calculator', 'sq ft calculator', 'room square footage calculator', 'flooring calculator'],
  title: 'Square Footage Calculator – Rooms, Flooring & Cost per Sq Ft',
  description:
    'Add up the square footage of several rooms or shapes, include a waste factor for flooring, tile or paint, and estimate material cost at your price per square foot.',
  accent: 'room by room',
  icon: '⬚',
  inputs: [
    {
      id: 'rooms',
      label: 'Rooms or areas',
      type: 'rows',
      addLabel: 'Add area',
      maxRows: 20,
      columns: [
        { id: 'name', label: 'Name', type: 'text', default: 'Room' },
        {
          id: 'shape',
          label: 'Shape',
          type: 'select',
          default: 'rect',
          options: [
            { value: 'rect', label: 'Rectangle' },
            { value: 'tri', label: 'Triangle' },
            { value: 'circle', label: 'Circle (L = diameter)' },
          ],
        },
        { id: 'length', label: 'Length (ft)', type: 'number', default: 12, min: 0, step: 0.25 },
        { id: 'width', label: 'Width (ft)', type: 'number', default: 10, min: 0, step: 0.25 },
      ],
      default: [room('Living room', 18, 14), room('Bedroom', 12, 11), room('Hallway', 10, 3.5), room('Kitchen', 12, 10)],
    },
    { id: 'waste', label: 'Waste allowance', type: 'number', default: 10, min: 0, max: 30, step: 1, suffix: '%', help: '5–10% for plank flooring, 10–15% for tile or diagonal layouts.' },
    { id: 'price', label: 'Material price', type: 'number', default: 4.5, min: 0, step: 0.05, prefix: '$', suffix: '/sq ft' },
    { id: 'box', label: 'Coverage per box (optional)', type: 'number', default: 20, min: 0, step: 0.5, suffix: 'sq ft' },
  ],
  compute(v) {
    const rows = sqft(v.rooms || []);
    const total = rows.reduce((a, r) => a + r.area, 0);
    if (!(total > 0)) return { primary: { label: '', value: '' }, error: 'Enter at least one length and width.' };
    const withWaste = total * (1 + (+v.waste || 0) / 100);
    return {
      primary: { label: 'Total area', value: `${num(total, 1)} sq ft` },
      rows: [
        { label: `With ${v.waste}% waste`, value: `${num(withWaste, 1)} sq ft` },
        { label: 'Square metres', value: num(total * 0.092903, 2) + ' m²' },
        { label: 'Square yards (carpet)', value: num(total / 9, 2) + ' yd²' },
        { label: 'Boxes needed', value: +v.box > 0 ? String(Math.ceil(withWaste / +v.box)) : '—' },
        { label: 'Material cost', value: usd(withWaste * (+v.price || 0)) },
      ],
      chart: { type: 'hbar', title: 'Square feet by area', x: rows.map((r) => String(r.name || '')), series: [{ name: 'Sq ft', values: rows.map((r) => r.area) }], y: 'num' },
    };
  },
  answer: {
    text: (r) =>
      `A living room (18 × 14 ft), bedroom (12 × 11), hallway (10 × 3.5) and kitchen (12 × 10) total <strong>${r.primary.value}</strong>. With 10% extra for cuts you should buy <strong>${r.rows![0].value}</strong> of flooring — about ${r.rows![4].value} at $4.50 per sq ft.`,
  },
  intro: [
    'Square footage is the area of a floor, measured in square feet: length × width for a rectangle. It is how flooring, tile, carpet, paint coverage, rent and home size are priced.',
    'Real homes are rarely one rectangle, so this calculator lets you add as many rooms or sections as you need — split L-shaped rooms into rectangles — then adds a waste allowance and converts the total into boxes and cost.',
  ],
  formula: {
    expr: 'Rectangle: L × W\nTriangle:  L × W ÷ 2\nCircle:    π × (D/2)²\nTo buy:    total × (1 + waste%)',
    vars: [
      ['1 sq yd', '9 sq ft'],
      ['1 m²', '10.764 sq ft'],
    ],
  },
  examples: [
    { title: 'L-shaped room as two rectangles', inputs: { rooms: [room('Part A', 14, 12), room('Part B', 8, 6)] }, explain: (r) => `${r.primary.value} total.` },
    { title: 'Bathroom tile at $7/sq ft', inputs: { rooms: [room('Bath', 8, 6)], waste: 15, price: 7, box: 10 }, explain: (r) => `${r.rows![3].value} boxes, ${r.rows![4].value}.` },
    { title: 'Round patio, 12 ft across', inputs: { rooms: [room('Patio', 12, 0, 'circle')], waste: 5 }, explain: (r) => `${r.primary.value}.` },
  ],
  analysis() {
    const sizes = [100, 150, 200, 300, 500];
    const w = [0, 5, 10, 15];
    return [
      {
        title: 'What waste percentage means in boxes',
        insight: 'On a 300 sq ft floor, going from 5% to 15% waste adds 30 sq ft — one or two extra boxes. Leftover boxes are handy for future repairs, and matching dye lots later is hard.',
        chart: {
          type: 'bar',
          title: 'Square feet to buy by area and waste %',
          x: sizes.map((s) => s + ' sq ft'),
          series: w.slice(1).map((p) => ({ name: `+${p}%`, values: sizes.map((s) => s * (1 + p / 100)) })),
          y: 'int',
          xTitle: 'Measured area',
        },
      },
    ];
  },
  variantQs: [
    { q: 'How do I find square footage of a room?', a: 'Measure the length and width in feet and multiply. For irregular rooms, split them into rectangles and add each part.' },
    { q: 'Can I use this as a flooring calculator?', a: 'Yes. Enter each room, a waste percentage and the coverage per box to get how many boxes to buy.' },
  ],
  tips: [
    'Measure wall to wall at floor level, and round up to the nearest inch.',
    'Convert inches to feet by dividing by 12 (10 ft 6 in = 10.5 ft).',
    'Closets count if you are flooring them.',
    'Buy all boxes from the same lot to avoid colour differences.',
  ],
  faqs: [
    { q: 'How do you calculate square feet?', a: 'Multiply length by width, both in feet. A 12 × 15 ft room is 180 sq ft.' },
    { q: 'How many square feet is a 10×12 room?', a: '120 square feet.' },
    { q: 'How do I convert square feet to square meters?', a: 'Multiply by 0.0929. 200 sq ft ≈ 18.6 m².' },
    { q: 'How much extra flooring should I buy?', a: 'Typically 5–10% for straight plank layouts and 10–15% for tile, diagonal or herringbone patterns.' },
  ],
  sources: [{ label: 'ANSI Z765 – Square footage method for calculating (home measurement standard)', url: 'https://www.homeinnovation.com/' }],
  related: ['area-calculator', 'concrete-calculator', 'volume-calculator', 'mortgage-calculator'],
};
export default calc;
