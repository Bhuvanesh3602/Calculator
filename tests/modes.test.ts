/** Known-answer tests for the calculator modes and formatting fixes added in Nov 2026. */
import { describe, it, expect } from 'vitest';
import { bySlug } from '../src/lib/registry';
import { defaults } from '../src/lib/render';
import { usd, num, compact } from '../src/lib/format';

const run = (slug: string, inputs: Record<string, unknown>) => {
  const c = bySlug[slug];
  return c.compute(defaults(c.inputs, inputs));
};
const row = (r: ReturnType<typeof run>, label: string) => r.rows?.find((x) => x.label === label)?.value;

describe('format: no negative zero', () => {
  it('usd(-0.0001) is $0', () => expect(usd(-0.0001)).toBe('$0'));
  it('num(-0.00001, 4) is 0', () => expect(num(-0.00001, 4)).toBe('0'));
  it('num(-1.5, 1) keeps its sign', () => expect(num(-1.5, 1)).toBe('-1.5'));
  it('compact(-0) is 0', () => expect(compact(-0, 'usd')).toBe('$0'));
});

describe('ratio modes', () => {
  it('find D: 16:9 = 1920:D → 1,080', () => expect(run('ratio-calculator', { a: 16, b: 9, c: 1920, solve: 'd' }).primary.value).toBe('1,080'));
  it('find C: 16:9 = C:1080 → 1,920', () => expect(run('ratio-calculator', { a: 16, b: 9, d: 1080, solve: 'c' }).primary.value).toBe('1,920'));
  it('split 500 in 2:3 → 200 and 300', () => expect(run('ratio-calculator', { a: 2, b: 3, total: 500, solve: 'split' }).primary.value).toBe('200 and 300'));
  it('scale 3:4 by 2.5 → 7.5:10', () => expect(run('ratio-calculator', { a: 3, b: 4, factor: 2.5, solve: 'scale' }).primary.value).toBe('7.5:10'));
});

describe('slope modes', () => {
  it('two points (0,0),(1,2): y = 2x with no "+ 0" and no "-0"', () => {
    const r = run('slope-calculator', { mode: 'two', x1: 0, y1: 0, x2: 1, y2: 2 });
    expect(row(r, 'Slope-intercept')).toBe('y = 2x');
    expect(row(r, 'x-intercept')).toBe('0');
  });
  it('point (1,2) with slope 3 → y = 3x − 1', () => {
    const r = run('slope-calculator', { mode: 'pointslope', x1: 1, y1: 2, m: 3 });
    expect(r.primary.value).toBe('3');
    expect(row(r, 'Slope-intercept')).toBe('y = 3x − 1');
  });
  it('rise 3 over run 12 → 0.25, 25% grade, fraction 1/4', () => {
    const r = run('slope-calculator', { mode: 'riserun', rise: 3, run: 12 });
    expect(r.primary.value).toBe('0.25');
    expect(row(r, 'Grade')).toBe('25%');
    expect(row(r, 'Exact slope (fraction)')).toBe('1/4');
  });
  it('negative fraction: (0,0),(6,-4) → -2/3', () =>
    expect(row(run('slope-calculator', { mode: 'two', x1: 0, y1: 0, x2: 6, y2: -4 }), 'Exact slope (fraction)')).toBe('-2/3'));
});

describe('BMI age group', () => {
  it('adult 5 ft 6 in, 160 lb → 25.8, overweight', () => {
    const r = run('bmi-calculator', { ageGroup: 'adult', units: 'us', ft: 5, in: 6, lb: 160 });
    expect(r.primary.value).toBe('25.8');
    expect(r.primary.label).toMatch(/Overweight/i);
  });
  it('child gets the number but no adult category', () => {
    const r = run('bmi-calculator', { ageGroup: 'child', units: 'us', ft: 4, in: 6, lb: 80 });
    expect(r.primary.value).toBe('19.3'); // 703 × 80 ÷ 54² = 19.29
    expect(r.primary.label).not.toMatch(/Overweight|Healthy|Underweight|Obes/i);
    expect(r.note).toMatch(/CDC/);
  });
});

describe('mortgage PMI duration', () => {
  it('$350k, 10% down, 6.75%, 30 yr: PMI row states years and months', () => {
    const r = run('mortgage-calculator', { price: 350000, down: 10, rate: 6.75, term: '30', tax: 1, insurance: 1500, hoa: 0, pmi: 0.6, extra: 0 });
    expect(r.primary.value).toBe('$2,617.25');
    expect(r.rows?.some((x) => /^PMI \(for \d+ yrs \d+ mo\)$/.test(x.label))).toBe(true);
  });
});
