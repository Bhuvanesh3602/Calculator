import { num } from '../lib/format';
import type { Calculator, Values } from '../lib/types';

const RAD = Math.PI / 180;
export interface Tri {
  a: number;
  b: number;
  c: number;
  A: number;
  B: number;
  C: number;
}

/** Solve a triangle. Angles in degrees. Returns every valid solution (SSA can have two). */
export function solveTriangle(mode: string, v: Values): Tri[] {
  const a = +v.a,
    b = +v.b,
    c = +v.c,
    A = +v.A,
    B = +v.B,
    C = +v.C;
  const fromSides = (a: number, b: number, c: number): Tri[] => {
    if (!(a > 0 && b > 0 && c > 0) || a + b <= c || a + c <= b || b + c <= a) return [];
    const A = Math.acos((b * b + c * c - a * a) / (2 * b * c)) / RAD;
    const B = Math.acos((a * a + c * c - b * b) / (2 * a * c)) / RAD;
    return [{ a, b, c, A, B, C: 180 - A - B }];
  };
  switch (mode) {
    case 'sss':
      return fromSides(a, b, c);
    case 'sas': {
      // sides a, b and the included angle C
      if (!(a > 0 && b > 0 && C > 0 && C < 180)) return [];
      return fromSides(a, b, Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(C * RAD)));
    }
    case 'asa': {
      // angles A, B and the included side c
      if (!(A > 0 && B > 0 && A + B < 180 && c > 0)) return [];
      const Cc = 180 - A - B;
      const k = c / Math.sin(Cc * RAD);
      return [{ a: k * Math.sin(A * RAD), b: k * Math.sin(B * RAD), c, A, B, C: Cc }];
    }
    case 'aas': {
      // angles A, B and side a (opposite A)
      if (!(A > 0 && B > 0 && A + B < 180 && a > 0)) return [];
      const Cc = 180 - A - B;
      const k = a / Math.sin(A * RAD);
      return [{ a, b: k * Math.sin(B * RAD), c: k * Math.sin(Cc * RAD), A, B, C: Cc }];
    }
    case 'ssa': {
      // sides a, b and angle A (opposite a) – the ambiguous case
      if (!(a > 0 && b > 0 && A > 0 && A < 180)) return [];
      const sinB = (b * Math.sin(A * RAD)) / a;
      if (sinB > 1 + 1e-12) return [];
      const B1 = Math.asin(Math.min(1, sinB)) / RAD;
      const out: Tri[] = [];
      for (const Bx of [B1, 180 - B1]) {
        const Cx = 180 - A - Bx;
        if (Cx <= 1e-9) continue;
        if (out.some((t) => Math.abs(t.B - Bx) < 1e-9)) continue;
        out.push({ a, b, c: (a * Math.sin(Cx * RAD)) / Math.sin(A * RAD), A, B: Bx, C: Cx });
      }
      return out;
    }
    case 'right':
      // legs a, b; right angle at C
      if (!(a > 0 && b > 0)) return [];
      return fromSides(a, b, Math.hypot(a, b));
  }
  return [];
}

export function props(t: Tri) {
  const s = (t.a + t.b + t.c) / 2;
  const area = Math.sqrt(Math.max(0, s * (s - t.a) * (s - t.b) * (s - t.c)));
  const e = 1e-7;
  const sides = [t.a, t.b, t.c].sort((x, y) => x - y);
  const byS = Math.abs(sides[0] - sides[2]) < e * sides[2] ? 'equilateral' : Math.abs(sides[0] - sides[1]) < e * sides[2] || Math.abs(sides[1] - sides[2]) < e * sides[2] ? 'isosceles' : 'scalene';
  const maxAng = Math.max(t.A, t.B, t.C);
  const byA = Math.abs(maxAng - 90) < 1e-6 ? 'right' : maxAng > 90 ? 'obtuse' : 'acute';
  return {
    perimeter: 2 * s,
    area,
    type: `${byS[0].toUpperCase() + byS.slice(1)}, ${byA}`,
    ha: (2 * area) / t.a,
    hb: (2 * area) / t.b,
    hc: (2 * area) / t.c,
    inradius: area / s,
    circumradius: (t.a * t.b * t.c) / (4 * area),
    ma: 0.5 * Math.sqrt(2 * t.b * t.b + 2 * t.c * t.c - t.a * t.a),
  };
}

const sideIn = (id: 'a' | 'b' | 'c', modes: string[], def: number) => ({ id, label: `Side ${id}`, type: 'number' as const, default: def, min: 0, step: 0.1, showIf: { field: 'mode', in: modes } });
const angIn = (id: 'A' | 'B' | 'C', modes: string[], def: number) => ({ id, label: `Angle ${id}`, type: 'number' as const, default: def, min: 0, max: 180, step: 0.1, suffix: '°', showIf: { field: 'mode', in: modes } });

const calc: Calculator = {
  slug: 'triangle-calculator',
  name: 'Triangle Calculator',
  short: 'Triangle',
  category: 'math',
  keyword: 'triangle calculator',
  volume: 40500,
  variants: ['right triangle calculator', 'triangle solver', 'law of sines calculator', 'law of cosines calculator', 'triangle area calculator', 'sss sas asa calculator'],
  title: 'Triangle Calculator – Solve SSS, SAS, ASA, AAS & SSA',
  description:
    'Solve any triangle from three known values: sides, angles, area, perimeter, heights, medians, inradius and circumradius, with step-by-step law of sines and cosines.',
  accent: 'three values in, all six out',
  icon: '△',
  inputs: [
    {
      id: 'mode',
      label: 'What do you know?',
      type: 'select',
      default: 'sss',
      options: [
        { value: 'sss', label: 'SSS – three sides' },
        { value: 'sas', label: 'SAS – two sides and the angle between them' },
        { value: 'asa', label: 'ASA – two angles and the side between them' },
        { value: 'aas', label: 'AAS – two angles and a side not between them' },
        { value: 'ssa', label: 'SSA – two sides and an angle not between them' },
        { value: 'right', label: 'Right triangle – two legs' },
      ],
    },
    sideIn('a', ['sss', 'sas', 'aas', 'ssa', 'right'], 7),
    sideIn('b', ['sss', 'sas', 'ssa', 'right'], 9),
    sideIn('c', ['sss', 'asa'], 12),
    angIn('A', ['asa', 'aas', 'ssa'], 40),
    angIn('B', ['asa', 'aas'], 65),
    angIn('C', ['sas'], 50),
  ],
  compute(v) {
    const sols = solveTriangle(v.mode, v);
    if (!sols.length) {
      const msg: Record<string, string> = {
        sss: 'These sides cannot form a triangle: each side must be shorter than the other two added together.',
        ssa: 'No triangle exists: side a is too short to reach the third side at this angle.',
      };
      return { primary: { label: '', value: '' }, error: msg[v.mode] ?? 'Check the values: sides must be positive and angles must add up to less than 180°.' };
    }
    const t = sols[0];
    const p = props(t);
    const rows = [
      { label: 'Sides a, b, c', value: `${num(t.a, 4)}, ${num(t.b, 4)}, ${num(t.c, 4)}` },
      { label: 'Angles A, B, C', value: `${num(t.A, 4)}°, ${num(t.B, 4)}°, ${num(t.C, 4)}°` },
      { label: 'Perimeter', value: num(p.perimeter, 4) },
      { label: 'Type', value: p.type },
      { label: 'Heights hₐ, h_b, h_c', value: `${num(p.ha, 4)}, ${num(p.hb, 4)}, ${num(p.hc, 4)}` },
      { label: 'Median to side a', value: num(p.ma, 4) },
      { label: 'Inradius / circumradius', value: `${num(p.inradius, 4)} / ${num(p.circumradius, 4)}` },
      { label: 'Angles in radians', value: [t.A, t.B, t.C].map((x) => num(x * RAD, 5)).join(', ') },
    ];
    if (sols.length > 1) {
      const t2 = sols[1];
      rows.push({ label: 'Second solution (ambiguous case)', value: `B = ${num(t2.B, 4)}°, C = ${num(t2.C, 4)}°, c = ${num(t2.c, 4)}, area ${num(props(t2).area, 4)}` });
    }
    const steps: Record<string, string[]> = {
      sss: [`Law of cosines: cos A = (b² + c² − a²) ÷ 2bc = ${num(Math.cos(t.A * RAD), 6)} → A = ${num(t.A, 4)}°`, `cos B = (a² + c² − b²) ÷ 2ac → B = ${num(t.B, 4)}°`, `C = 180° − A − B = ${num(t.C, 4)}°`],
      sas: [`c² = a² + b² − 2ab·cos C = ${num(t.c * t.c, 4)} → c = ${num(t.c, 4)}`, `Then the law of cosines gives A = ${num(t.A, 4)}° and B = ${num(t.B, 4)}°`],
      asa: [`C = 180° − A − B = ${num(t.C, 4)}°`, `Law of sines: a = c·sin A ÷ sin C = ${num(t.a, 4)}`, `b = c·sin B ÷ sin C = ${num(t.b, 4)}`],
      aas: [`C = 180° − A − B = ${num(t.C, 4)}°`, `Law of sines: b = a·sin B ÷ sin A = ${num(t.b, 4)}`, `c = a·sin C ÷ sin A = ${num(t.c, 4)}`],
      ssa: [`sin B = b·sin A ÷ a = ${num(Math.sin(t.B * RAD), 6)}`, sols.length > 1 ? `Two angles have this sine: B = ${num(sols[0].B, 4)}° or ${num(sols[1].B, 4)}°, so two triangles fit` : `Only B = ${num(t.B, 4)}° leaves room for angle C`, `C = 180° − A − B = ${num(t.C, 4)}°; c = a·sin C ÷ sin A = ${num(t.c, 4)}`],
      right: [`Pythagoras: c = √(a² + b²) = ${num(t.c, 4)}`, `A = arctan(a ÷ b) = ${num(t.A, 4)}°, B = ${num(t.B, 4)}°`],
    };
    return {
      primary: { label: sols.length > 1 ? 'Area (first of two solutions)' : 'Area', value: num(p.area, 4) },
      rows,
      steps: [...steps[v.mode], `Area (Heron): s = ${num(p.perimeter / 2, 4)}, A = √(s(s−a)(s−b)(s−c)) = ${num(p.area, 4)}`],
      chart: { type: 'donut', title: 'How the 180° is shared between the angles', x: [`A ${num(t.A, 1)}°`, `B ${num(t.B, 1)}°`, `C ${num(t.C, 1)}°`], series: [{ name: 'Degrees', values: [t.A, t.B, t.C] }], y: 'num' },
    };
  },
  answer: {
    text: (r) =>
      `A triangle with sides <strong>7, 9 and 12</strong> has an area of <strong>${r.primary.value}</strong> (Heron’s formula) and a perimeter of 28. The law of cosines gives its angles as ${r.rows![1].value}, so it is ${r.rows![3].value.toLowerCase()}. Enter any three values, including at least one side, to solve a triangle.`,
  },
  intro: [
    'A triangle calculator finds every side and angle of a triangle from any three values that fix its shape, as long as at least one is a side. It also works out the area, perimeter, heights, medians and the radii of the inscribed and circumscribed circles.',
    'Choose the case that matches what you know: SSS, SAS, ASA, AAS or SSA. The SSA case is “ambiguous”: two different triangles can fit the same data. Many solvers show only one of them, but this calculator detects the second and shows it too. Each answer comes with the law of sines or cosines working, so you can check it step by step.',
  ],
  formula: {
    expr: 'Law of sines:    a ÷ sin A = b ÷ sin B = c ÷ sin C = 2R\nLaw of cosines:  c² = a² + b² − 2ab·cos C\nHeron:           Area = √(s(s−a)(s−b)(s−c)),  s = (a+b+c) ÷ 2\nInradius r = Area ÷ s     Circumradius R = abc ÷ (4·Area)',
    vars: [
      ['a, b, c', 'sides; side a is opposite angle A, and so on'],
      ['A + B + C', 'always 180°'],
    ],
    notes: ['Three angles alone (AAA) cannot fix a triangle’s size, only its shape, so at least one side is always needed.'],
  },
  examples: [
    { title: '3-4-5 right triangle', inputs: { mode: 'right', a: 3, b: 4 }, explain: (r) => `Area ${r.primary.value}; angles ${r.rows![1].value}.` },
    { title: 'SAS: sides 10 and 14, 60° between', inputs: { mode: 'sas', a: 10, b: 14, C: 60 }, explain: (r) => `Third side c = ${r.rows![0].value.split(', ')[2]}, area ${r.primary.value}.` },
    { title: 'Ambiguous SSA: a = 8, b = 10, A = 40°', inputs: { mode: 'ssa', a: 8, b: 10, A: 40 }, explain: (r) => `Two triangles fit. ${r.rows!.at(-1)!.value}.` },
    { title: 'Equilateral, side 6', inputs: { mode: 'sss', a: 6, b: 6, c: 6 }, explain: (r) => `Area ${r.primary.value} (= 9√3).` },
  ],
  analysis() {
    const sides = [6, 7, 8, 9, 10, 11];
    return [
      {
        title: 'When does SSA give two triangles?',
        insight: 'With b = 10 and angle A = 40°, the outcome depends only on side a. If a is shorter than b·sin A (6.43), no triangle exists. If a is between 6.43 and 10, two triangles fit. If a is 10 or more, there is exactly one. The table shows the possible values of angle B.',
        table: {
          head: ['Side a', 'Solutions', 'Angle B'],
          rows: sides.map((a) => {
            const s = solveTriangle('ssa', { a, b: 10, A: 40 });
            return [a, String(s.length), s.length ? s.map((t) => num(t.B, 1) + '°').join(' or ') : 'none'];
          }),
        },
      },
      {
        title: 'Same perimeter, very different areas',
        insight: 'For a fixed perimeter of 30, the equilateral triangle encloses the most area. Stretching the triangle into a long, thin shape shrinks the area towards zero, even though the perimeter stays the same.',
        chart: {
          type: 'bar',
          title: 'Area of triangles with perimeter 30',
          x: ['10-10-10', '9-10-11', '8-10-12', '6-10-14', '5-11-14', '3-13-14'],
          series: [{ name: 'Area', values: [[10, 10, 10], [9, 10, 11], [8, 10, 12], [6, 10, 14], [5, 11, 14], [3, 13, 14]].map(([a, b, c]) => props(solveTriangle('sss', { a, b, c })[0]).area) }],
          y: 'num',
        },
      },
    ];
  },
  variantQs: [
    { q: 'Is this a right triangle calculator?', a: 'Yes. Choose “Right triangle – two legs” to get the hypotenuse by Pythagoras, both acute angles and the area. For other known values, use SAS with C = 90°.' },
    { q: 'How do I use the law of sines?', a: 'Each side divided by the sine of its opposite angle gives the same number. Choose ASA, AAS or SSA, and the working steps show the law of sines applied to your values.' },
    { q: 'How do I find the area of a triangle with three sides?', a: 'Use Heron’s formula: s = half the perimeter, then area = √(s(s−a)(s−b)(s−c)). Choose SSS and enter the sides.' },
  ],
  tips: [
    'Label sides so that side a is opposite angle A. Most mistakes come from mismatching sides and angles.',
    'The longest side is always opposite the largest angle.',
    'In the SSA case, check whether the second solution fits your real-world problem, such as a roof pitch or a survey.',
  ],
  faqs: [
    { q: 'What information do I need to solve a triangle?', a: 'Three values, including at least one side: three sides (SSS), two sides and an angle (SAS or SSA), or two angles and a side (ASA or AAS).' },
    { q: 'What is the triangle inequality?', a: 'Any two sides must add up to more than the third. Sides 2, 3 and 6 cannot form a triangle because 2 + 3 is less than 6.' },
    { q: 'Why can SSA give two answers?', a: 'For a given sine value, there are two angles between 0° and 180°, such as 30° and 150°. If both leave room for a third angle, two different triangles match the data.' },
    { q: 'How do I find the third angle?', a: 'Subtract the other two from 180°. The angles of any flat triangle add up to exactly 180°.' },
  ],
  sources: [
    { label: 'Wolfram MathWorld – Triangle', url: 'https://mathworld.wolfram.com/Triangle.html' },
    { label: 'Khan Academy – Law of sines and law of cosines', url: 'https://www.khanacademy.org/math/trigonometry/trig-with-general-triangles' },
  ],
  related: ['area-calculator', 'slope-calculator', 'scientific-calculator', 'distance-calculator', 'square-footage-calculator'],
};
export default calc;
