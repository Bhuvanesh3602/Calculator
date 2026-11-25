import { num } from '../lib/format';
import type { Calculator, Field, Values } from '../lib/types';

/** Units as [id, label, factor to the category's base unit]. Exact definitions (NIST SP 811) where they exist. */
export const UNITS: Record<string, { name: string; base: string; units: [string, string, number][] }> = {
  length: {
    name: 'Length',
    base: 'm',
    units: [['mm', 'Millimetres (mm)', 0.001], ['cm', 'Centimetres (cm)', 0.01], ['m', 'Metres (m)', 1], ['km', 'Kilometres (km)', 1000], ['in', 'Inches (in)', 0.0254], ['ft', 'Feet (ft)', 0.3048], ['yd', 'Yards (yd)', 0.9144], ['mi', 'Miles (mi)', 1609.344], ['nmi', 'Nautical miles', 1852]],
  },
  weight: {
    name: 'Weight / mass',
    base: 'kg',
    units: [['mg', 'Milligrams (mg)', 1e-6], ['g', 'Grams (g)', 0.001], ['kg', 'Kilograms (kg)', 1], ['t', 'Metric tonnes (t)', 1000], ['oz', 'Ounces (oz)', 0.028349523125], ['lb', 'Pounds (lb)', 0.45359237], ['st', 'Stone (st)', 6.35029318], ['ton', 'US short tons', 907.18474]],
  },
  volume: {
    name: 'Volume',
    base: 'L',
    units: [['ml', 'Millilitres (mL)', 0.001], ['l', 'Litres (L)', 1], ['m3', 'Cubic metres (m³)', 1000], ['tsp', 'US teaspoons', 0.00492892159375], ['tbsp', 'US tablespoons', 0.0147867647825], ['floz', 'US fluid ounces', 0.0295735295625], ['cup', 'US cups', 0.2365882365], ['pt', 'US pints', 0.473176473], ['qt', 'US quarts', 0.946352946], ['gal', 'US gallons', 3.785411784], ['ukgal', 'UK (imperial) gallons', 4.54609], ['ft3', 'Cubic feet (ft³)', 28.316846592]],
  },
  temperature: { name: 'Temperature', base: 'K', units: [['c', 'Celsius (°C)', 0], ['f', 'Fahrenheit (°F)', 0], ['k', 'Kelvin (K)', 0]] },
  area: {
    name: 'Area',
    base: 'm²',
    units: [['cm2', 'Square centimetres', 1e-4], ['m2', 'Square metres (m²)', 1], ['ha', 'Hectares', 1e4], ['km2', 'Square kilometres', 1e6], ['in2', 'Square inches', 0.00064516], ['ft2', 'Square feet (ft²)', 0.09290304], ['yd2', 'Square yards', 0.83612736], ['ac', 'Acres', 4046.8564224], ['mi2', 'Square miles', 2589988.110336]],
  },
  speed: {
    name: 'Speed',
    base: 'm/s',
    units: [['ms', 'Metres per second', 1], ['kmh', 'Kilometres per hour', 1 / 3.6], ['mph', 'Miles per hour', 0.44704], ['kn', 'Knots', 1852 / 3600], ['fts', 'Feet per second', 0.3048]],
  },
  time: {
    name: 'Time',
    base: 's',
    units: [['ms', 'Milliseconds', 0.001], ['s', 'Seconds', 1], ['min', 'Minutes', 60], ['h', 'Hours', 3600], ['d', 'Days', 86400], ['wk', 'Weeks', 604800], ['mo', 'Average months', 2629746], ['yr', 'Years (yr)', 31556952]],
  },
  data: {
    name: 'Digital storage',
    base: 'B',
    units: [['bit', 'Bits', 0.125], ['B', 'Bytes', 1], ['KB', 'Kilobytes (KB, 1000)', 1e3], ['MB', 'Megabytes (MB)', 1e6], ['GB', 'Gigabytes (GB)', 1e9], ['TB', 'Terabytes (TB)', 1e12], ['KiB', 'Kibibytes (KiB, 1024)', 1024], ['MiB', 'Mebibytes (MiB)', 1024 ** 2], ['GiB', 'Gibibytes (GiB)', 1024 ** 3], ['TiB', 'Tebibytes (TiB)', 1024 ** 4]],
  },
  energy: {
    name: 'Energy',
    base: 'J',
    units: [['j', 'Joules (J)', 1], ['kj', 'Kilojoules (kJ)', 1000], ['cal', 'Calories (cal)', 4.184], ['kcal', 'Kilocalories / food Calories (kcal)', 4184], ['wh', 'Watt-hours (Wh)', 3600], ['kwh', 'Kilowatt-hours (kWh)', 3.6e6], ['btu', 'British thermal units (BTU)', 1055.05585262]],
  },
  pressure: {
    name: 'Pressure',
    base: 'Pa',
    units: [['pa', 'Pascals (Pa)', 1], ['kpa', 'Kilopascals (kPa)', 1000], ['bar', 'Bar', 1e5], ['psi', 'Pounds per square inch (psi)', 6894.757293168], ['atm', 'Atmospheres (atm)', 101325], ['mmhg', 'mmHg (torr)', 133.322387415]],
  },
};

const toK = (x: number, u: string) => (u === 'c' ? x + 273.15 : u === 'f' ? ((x - 32) * 5) / 9 + 273.15 : x);
const fromK = (k: number, u: string) => (u === 'c' ? k - 273.15 : u === 'f' ? ((k - 273.15) * 9) / 5 + 32 : k);

export function convert(cat: string, value: number, from: string, to: string): number {
  if (cat === 'temperature') return fromK(toK(value, from), to);
  const u = UNITS[cat].units;
  const f = u.find((x) => x[0] === from)?.[2];
  const t = u.find((x) => x[0] === to)?.[2];
  if (f === undefined || t === undefined) return NaN;
  return (value * f) / t;
}

/** About 7 significant figures, without exponent noise for everyday sizes. */
export function sig(x: number): string {
  if (!isFinite(x)) return '—';
  if (x === 0) return '0';
  const a = Math.abs(x);
  if (a >= 1e15 || a < 1e-6) return x.toExponential(6).replace(/\.?0+e/, 'e');
  const d = Math.max(0, Math.min(10, 6 - Math.floor(Math.log10(a))));
  return num(+x.toPrecision(7), d);
}

const DEFAULT_PAIR: Record<string, [string, string]> = {
  length: ['ft', 'm'], weight: ['lb', 'kg'], volume: ['gal', 'l'], temperature: ['f', 'c'], area: ['ft2', 'm2'],
  speed: ['mph', 'kmh'], time: ['h', 'min'], data: ['GB', 'GiB'], energy: ['kcal', 'kj'], pressure: ['psi', 'bar'],
};
const unitFields: Field[] = Object.entries(UNITS).flatMap(([cat, c]) => [
  { id: `from_${cat}`, label: 'From', type: 'select' as const, default: DEFAULT_PAIR[cat][0], options: c.units.map(([value, label]) => ({ value, label })), showIf: { field: 'cat', in: [cat] } },
  { id: `to_${cat}`, label: 'To', type: 'select' as const, default: DEFAULT_PAIR[cat][1], options: c.units.map(([value, label]) => ({ value, label })), showIf: { field: 'cat', in: [cat] } },
]);

const labelOf = (cat: string, u: string) => UNITS[cat].units.find((x) => x[0] === u)?.[1] ?? u;
const short = (cat: string, u: string) => {
  const l = labelOf(cat, u);
  const m = /\(([^)]+)\)/.exec(l);
  return m && !/^\d/.test(m[1]) && m[1].length < 12 ? m[1].replace(/, 10\d+/, '') : l.toLowerCase();
};

const calc: Calculator = {
  slug: 'conversion-calculator',
  name: 'Conversion Calculator',
  short: 'Unit Conversion',
  category: 'everyday',
  keyword: 'conversion calculator',
  volume: 90500,
  variants: ['unit converter', 'metric conversion calculator', 'unit conversion calculator', 'feet to meters', 'lbs to kg', 'fahrenheit to celsius'],
  title: 'Conversion Calculator – Length, Weight, Volume, Temp & More',
  description:
    'Convert between metric and US units for length, weight, volume, temperature, area, speed, time, data, energy and pressure, using exact NIST conversion factors.',
  accent: 'exact factors, all units',
  icon: '↔',
  inputs: [
    {
      id: 'cat',
      label: 'Measure',
      type: 'select',
      default: 'length',
      options: Object.entries(UNITS).map(([value, c]) => ({ value, label: c.name })),
    },
    { id: 'value', label: 'Value', type: 'number', default: 6 },
    ...unitFields,
  ],
  compute(v: Values) {
    const cat = v.cat in UNITS ? v.cat : 'length';
    const x = +v.value;
    if (!isFinite(x)) return { primary: { label: '', value: '' }, error: 'Enter a number to convert.' };
    const from = v[`from_${cat}`],
      to = v[`to_${cat}`];
    const y = convert(cat, x, from, to);
    if (cat === 'temperature' && toK(x, from) < 0) return { primary: { label: '', value: '' }, error: 'That is below absolute zero (−273.15 °C / −459.67 °F).' };
    const one = convert(cat, 1, from, to);
    const others = UNITS[cat].units.filter(([u]) => u !== from);
    return {
      primary: { label: `${sig(x)} ${short(cat, from)} =`, value: `${sig(y)} ${short(cat, to)}` },
      rows: [
        ...(cat === 'temperature' ? [] : [{ label: `1 ${short(cat, from)}`, value: `${sig(one)} ${short(cat, to)}` }, { label: `1 ${short(cat, to)}`, value: `${sig(1 / one)} ${short(cat, from)}` }]),
        { label: 'Reverse', value: `${sig(y)} ${short(cat, to)} = ${sig(x)} ${short(cat, from)}` },
      ],
      table: { caption: `${sig(x)} ${labelOf(cat, from).toLowerCase()} in every ${UNITS[cat].name.toLowerCase()} unit`, head: ['Unit', 'Value'], rows: others.map(([u, l]) => [l, sig(convert(cat, x, from, u))]) },
      steps:
        cat === 'temperature'
          ? [from === 'f' && to === 'c' ? `°C = (°F − 32) × 5 ÷ 9 = (${sig(x)} − 32) × 5 ÷ 9 = ${sig(y)}` : from === 'c' && to === 'f' ? `°F = °C × 9 ÷ 5 + 32 = ${sig(x)} × 1.8 + 32 = ${sig(y)}` : `Convert to kelvin (${sig(toK(x, from))} K), then to the target scale: ${sig(y)}`]
          : [`1 ${short(cat, from)} = ${sig(UNITS[cat].units.find((u) => u[0] === from)![2])} ${UNITS[cat].base}`, `1 ${short(cat, to)} = ${sig(UNITS[cat].units.find((u) => u[0] === to)![2])} ${UNITS[cat].base}`, `${sig(x)} × ${sig(one)} = ${sig(y)}`],
    };
  },
  answer: {
    text: (r) =>
      `<strong>6 feet</strong> is <strong>${r.primary.value.replace(' m', ' metres')}</strong>, because one foot is defined as exactly 0.3048 metres. Pick a measure, enter a value and choose the units. The table converts your value into every other unit of that measure at once, so you never need to convert twice.`,
  },
  intro: [
    'A conversion calculator changes a measurement from one unit to another, such as feet to metres, pounds to kilograms or Fahrenheit to Celsius. This one covers ten measures: length, weight, volume, temperature, area, speed, time, digital storage, energy and pressure.',
    'Every factor is the exact legal definition where one exists. Since 1959, for example, the inch has been exactly 2.54 cm and the pound exactly 0.45359237 kg. The calculator shows the factor it used and converts your value into every unit of the same measure at once. It also separates units that are often confused: US and UK gallons, food Calories and calories, and gigabytes (GB) and gibibytes (GiB).',
  ],
  formula: {
    expr: 'result = value × (factor_from ÷ factor_to)\n°C = (°F − 32) × 5/9     °F = °C × 9/5 + 32     K = °C + 273.15',
    vars: [
      ['factor', 'size of each unit in the measure’s base SI unit (metre, kilogram, litre, …)'],
      ['1 in', '2.54 cm exactly; 1 lb = 0.45359237 kg exactly; 1 US gal = 231 in³ = 3.785411784 L'],
    ],
  },
  examples: [
    { title: '150 lb to kg', inputs: { cat: 'weight', value: 150, from_weight: 'lb', to_weight: 'kg' }, explain: (r) => `${r.primary.label} ${r.primary.value}.` },
    { title: '350 °F oven in °C', inputs: { cat: 'temperature', value: 350, from_temperature: 'f', to_temperature: 'c' }, explain: (r) => `${r.primary.value}, usually set as 175–180 °C.` },
    { title: 'A “1 TB” drive in TiB', inputs: { cat: 'data', value: 1, from_data: 'TB', to_data: 'TiB' }, explain: (r) => `Only ${r.primary.value}, which is why your computer shows less space than the box.` },
    { title: '2,000 sq ft in m²', inputs: { cat: 'area', value: 2000, from_area: 'ft2', to_area: 'm2' }, explain: (r) => `${r.primary.value}.` },
  ],
  analysis() {
    const temps = [-40, -20, 0, 20, 37, 50, 100];
    return [
      {
        title: 'Celsius and Fahrenheit meet at −40',
        insight: 'The two scales cross at exactly −40°. Above that, Fahrenheit numbers grow 1.8 times faster. For a quick mental estimate, double the Celsius figure and add 30: 20 °C ≈ 70 °F (exactly 68 °F).',
        chart: { type: 'line', title: 'Fahrenheit for each Celsius temperature', x: temps.map((t) => t + ' °C'), series: [{ name: '°F', values: temps.map((t) => convert('temperature', t, 'c', 'f')) }, { name: 'Quick rule: 2×C + 30', values: temps.map((t) => 2 * t + 30) }], y: 'num' },
      },
      {
        title: 'Units that share a name but not a size',
        insight: 'Several everyday units have two different definitions. Mixing them up causes real errors in recipes, fuel economy and storage.',
        table: {
          head: ['Unit', 'Version A', 'Version B', 'Difference'],
          rows: [
            ['Gallon', 'US: 3.785 L', 'UK: 4.546 L', 'UK is 20% larger'],
            ['Ton', 'US short: 907 kg', 'Metric: 1,000 kg', 'metric is 10% larger'],
            ['Calorie', 'cal: 4.184 J', 'food Cal (kcal): 4,184 J', '1,000×'],
            ['Terabyte', 'TB: 10¹² bytes', 'TiB: 2⁴⁰ bytes', 'TiB is 10% larger'],
            ['Mile', 'Statute: 1,609 m', 'Nautical: 1,852 m', 'nautical is 15% longer'],
            ['Fluid ounce', 'US: 29.57 mL', 'UK: 28.41 mL', 'US is 4% larger'],
          ],
        },
      },
    ];
  },
  variantQs: [
    { q: 'Is this a metric conversion calculator?', a: 'Yes. It converts between metric (SI) units and US customary units in both directions, using exact definitions.' },
    { q: 'How do I convert feet to metres?', a: 'Multiply by 0.3048. 6 ft × 0.3048 = 1.8288 m. To go back, divide metres by 0.3048, or multiply by 3.28084.' },
    { q: 'How do I convert pounds to kilograms?', a: 'Multiply by 0.45359237, or divide by about 2.2046. 150 lb = 68.04 kg.' },
  ],
  tips: [
    'Cooking: 1 US cup = 236.6 mL, but many recipes round it to 240 mL. Nutrition labels in the US use 240 mL.',
    'Drive and memory makers use GB (1,000³ bytes), but Windows reports GiB (1,024³) while calling them “GB”.',
    'Food “Calories” on labels are kilocalories: 1 Cal = 1,000 cal = 4.184 kJ.',
  ],
  faqs: [
    { q: 'How do you convert Fahrenheit to Celsius?', a: 'Subtract 32, then multiply by 5/9. 98.6 °F − 32 = 66.6, × 5/9 = 37 °C.' },
    { q: 'How many centimetres are in an inch?', a: 'Exactly 2.54 cm, by international agreement since 1959.' },
    { q: 'What is the difference between US and UK gallons?', a: 'A US gallon is 3.785 litres; an imperial (UK) gallon is 4.546 litres, about 20% more. UK miles-per-gallon figures therefore look higher than US ones.' },
    { q: 'How accurate are these conversions?', a: 'The factors are exact definitions from NIST Special Publication 811, and results are rounded to about 7 significant figures for display.' },
  ],
  sources: [
    { label: 'NIST Special Publication 811 – Guide for the use of the SI, Appendix B (conversion factors)', url: 'https://www.nist.gov/pml/special-publication-811' },
    { label: 'NIST Handbook 44 – Appendix C, General tables of units of measurement', url: 'https://www.nist.gov/pml/owm/publications/nist-handbooks/handbook-44' },
  ],
  related: ['height-calculator', 'area-calculator', 'volume-calculator', 'square-footage-calculator', 'distance-calculator'],
};
export default calc;
