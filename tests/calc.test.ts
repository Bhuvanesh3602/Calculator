/** Known-answer tests: every formula is checked against a value computed independently. */
import { describe, it, expect } from 'vitest';
import { pmt, amortize, growth, gcd, lcm, primeFactors, ymd, daysBetween, businessDays, addMonths } from '../src/lib/math';
import { federalTax, SS_WAGE_BASE } from '../src/lib/data/tax2026';
import { bmi, mifflin, harris, katch } from '../src/lib/health';
import { paycheck } from '../src/calculators/paycheck-calculator';
import { employerCost } from '../src/calculators/payroll-calculator';
import { aprWithFees, principalFor } from '../src/calculators/loan-calculator';
import { monthsToPay } from '../src/calculators/payment-calculator';
import { cdValue, aprToApy } from '../src/calculators/cd-calculator';
import { adjust } from '../src/calculators/inflation-calculator';
import { ULT } from '../src/calculators/rmd-calculator';
import { navyBF } from '../src/calculators/body-fat-calculator';
import { epley, brzycki } from '../src/calculators/one-rep-max-calculator';
import { percent } from '../src/calculators/percentage-calculator';
import { parse, op, show } from '../src/calculators/fraction-calculator';
import { factorQuadratic } from '../src/calculators/factoring-calculator';
import { stats } from '../src/calculators/average-calculator';
import { gpa } from '../src/calculators/gpa-calculator';
import { needed } from '../src/calculators/final-grade-calculator';
import { haversine } from '../src/calculators/distance-calculator';
import { tip } from '../src/calculators/tip-calculator';
import { concreteCuFt } from '../src/calculators/concrete-calculator';
import { integrate, compileFx, roots } from '../src/lib/expr';
import { eddFromLmp } from '../src/lib/pregnancy';
import { bySlug, calculators } from '../src/lib/registry';
import { defaults } from '../src/lib/render';

const d = (s: string) => {
  const [y, m, dd] = s.split('-').map(Number);
  return new Date(y, m - 1, dd, 12);
};

describe('finance', () => {
  it('mortgage payment: $200k, 6%, 30y = $1,199.10', () => expect(pmt(200000, 6, 360)).toBeCloseTo(1199.1, 2));
  it('0% loan divides evenly', () => expect(pmt(12000, 0, 12)).toBe(1000));
  it('amortization ends at zero and sums to principal', () => {
    const s = amortize(100000, 5, 120);
    expect(s.length).toBe(120);
    expect(s.at(-1)!.balance).toBeCloseTo(0, 6);
    expect(s.reduce((a, r) => a + r.principal, 0)).toBeCloseTo(100000, 4);
  });
  it('compound: $1,000 at 5% yearly for 3 years = $1,157.63', () => {
    expect(growth({ principal: 1000, ratePct: 5, years: 3, compoundsPerYear: 1 }).at(-1)!.balance).toBeCloseTo(1157.63, 2);
  });
  it('APR with no fee equals the rate; fees raise it', () => {
    expect(aprWithFees(10000, 10, 36, 0)).toBe(10);
    expect(aprWithFees(10000, 10, 36, 500)).toBeGreaterThan(13);
  });
  it('principalFor inverts pmt', () => expect(principalFor(pmt(25000, 8, 60), 8, 60)).toBeCloseTo(25000, 6));
  it('months to pay: payment below interest never pays off', () => {
    expect(monthsToPay(5000, 24, 100)).toBe(Infinity);
    expect(monthsToPay(1200, 0, 100)).toBe(12);
  });
  it('CD and APY', () => {
    expect(cdValue(10000, 5, 12)).toBeCloseTo(10500, 6);
    expect(aprToApy(5, 12)).toBeCloseTo(5.116, 3);
  });
  it('CPI: $100 in 2000 ≈ $182.17 in 2024', () => expect(adjust(100, 2000, 2024)).toBeCloseTo(182.17, 1));
  it('RMD factor at 75 is 24.6 (IRS ULT)', () => expect(ULT[75]).toBe(24.6));
});

describe('tax 2026', () => {
  it('single taxable $50,000 → $5,752', () => expect(federalTax(50000, 'single')).toBeCloseTo(5752, 2));
  it('married taxable $100,000 → $11,456', () => expect(federalTax(100000, 'married')).toBeCloseTo(2480 + (100000 - 24800) * 0.12, 2));
  it('Social Security caps at wage base', () => {
    const p = paycheck({ payType: 'salary', salary: 300000, freq: 'biweekly', filing: 'single', state: 'none', k401: 0, health: 0 });
    expect(p.ss).toBeCloseTo(SS_WAGE_BASE * 0.062, 4);
  });
  it('employer FICA on $60k = $4,590', () => {
    const c = employerCost({ salary: 60000, sutaRate: 0, sutaBase: 0, wc: 0, benefits: 0, match: 0 });
    expect(c.ss + c.med).toBeCloseTo(4590, 4);
    expect(c.futa).toBeCloseTo(42, 6);
  });
});

describe('health', () => {
  it('BMI 70 kg / 1.75 m = 22.86', () => expect(bmi(70, 1.75)).toBeCloseTo(22.857, 3));
  it('Mifflin male 80 kg, 180 cm, 30 y = 1,780', () => expect(mifflin(80, 180, 30, true)).toBe(1780));
  it('Harris-Benedict female', () => expect(harris(60, 165, 30, false)).toBeCloseTo(447.593 + 9.247 * 60 + 3.098 * 165 - 4.33 * 30, 6));
  it('Katch-McArdle', () => expect(katch(80, 20)).toBeCloseTo(370 + 21.6 * 64, 6));
  it('Navy body fat male ≈ 17.5%', () => expect(navyBF(true, 70, 15, 34, 0)).toBeCloseTo(17.51, 1));
  it('1RM: Epley and Brzycki at 5 reps', () => {
    expect(epley(100, 5)).toBeCloseTo(116.667, 2);
    expect(brzycki(100, 5)).toBeCloseTo(112.5, 6);
  });
  it('due date = LMP + 280 days', () => expect(daysBetween(d('2026-01-01'), eddFromLmp(d('2026-01-01')))).toBe(280));
});

describe('math', () => {
  it('15% of 80 = 12', () => expect(percent({ mode: 'of', x: 15, y: 80 }).primary.value).toBe('12'));
  it('fractions: 3/4 + 2/3 = 17/12; 1 1/2 ÷ 3/4 = 2', () => {
    expect(show(op(parse('3/4')!, parse('2/3')!, '+').r)).toBe('17/12');
    expect(show(op(parse('1 1/2')!, parse('3/4')!, '/').r)).toBe('2');
  });
  it('gcd/lcm/primes', () => {
    expect(gcd(48, 180)).toBe(12);
    expect(lcm(12, 18)).toBe(36);
    expect(primeFactors(360)).toEqual([2, 2, 2, 3, 3, 5]);
  });
  it('factors 2x²+7x+3 = (2x + 1)(x + 3)', () => expect(factorQuadratic(2, 7, 3).primary.value).toBe('(2x + 1)(x + 3)'));
  it('factors 6x²+x−2 = (2x − 1)(3x + 2)', () => expect(factorQuadratic(6, 1, -2).primary.value).toBe('(2x − 1)(3x + 2)'));
  it('stats', () => {
    const s = stats([2, 4, 4, 4, 5, 5, 7, 9]);
    expect(s.mean).toBe(5);
    expect(s.median).toBe(4.5);
    expect(s.modes).toEqual([4]);
    expect(s.psd).toBeCloseTo(2, 10);
  });
  it('numeric integral ∫0^π x² sin x = π² − 4', () => expect(integrate(compileFx('x^2*sin(x)'), 0, Math.PI)).toBeCloseTo(Math.PI ** 2 - 4, 8));
  it('roots of x² − 4', () => expect(roots(compileFx('x^2-4'), -5, 5).map((r) => +r.toFixed(6))).toEqual([-2, 2]));
});

describe('dates & everyday', () => {
  it('exact age handles month ends', () => {
    expect(ymd(d('2000-01-31'), d('2000-03-01'))).toEqual({ years: 0, months: 1, days: 1 });
    expect(ymd(d('1990-06-15'), d('2026-06-14'))).toEqual({ years: 35, months: 11, days: 30 });
  });
  it('addMonths clamps', () => expect(addMonths(d('2026-01-31'), 1).getDate()).toBe(28));
  it('business days in one week', () => expect(businessDays(d('2026-11-23'), d('2026-11-30'))).toBe(5));
  it('GPA: A(3) + B(3) = 3.5', () => expect(gpa([{ grade: 'A', credits: 3 }, { grade: 'B', credits: 3 }], false).gpa).toBe(3.5));
  it('final grade needed', () => expect(needed(88, 90, 25)).toBeCloseTo(96, 6));
  it('London–Paris ≈ 344 km', () => expect(haversine(51.5074, -0.1278, 48.8566, 2.3522)).toBeCloseTo(343.6, 0));
  it('tip on pre-tax', () => expect(tip(86.4, 18, 3, 6.4, true, 'none').tip).toBeCloseTo(14.4, 6));
  it('concrete slab 12×10×4in = 40 ft³', () => expect(concreteCuFt({ shape: 'slab', length: 12, width: 10, thick: 4, qty: 1 })).toBeCloseTo(40, 6));
});

describe('every calculator', () => {
  it('has 67 calculators with unique slugs', () => {
    expect(calculators.length).toBe(67);
    expect(new Set(calculators.map((c) => c.slug)).size).toBe(67);
  });
  for (const c of calculators) {
    it(`${c.slug}: defaults compute, SEO fields valid, related links exist`, () => {
      const r = c.compute(defaults(c.inputs));
      expect(r.error).toBeUndefined();
      expect(r.primary.value).not.toBe('');
      expect(c.title.length).toBeLessThanOrEqual(70);
      expect(c.description.length).toBeGreaterThan(110);
      expect(c.description.length).toBeLessThanOrEqual(165);
      expect(c.faqs.length).toBeGreaterThanOrEqual(4);
      expect(c.analysis().length).toBeGreaterThanOrEqual(1);
      for (const s of c.related) expect(bySlug[s], `${c.slug} → ${s}`).toBeDefined();
      for (const ex of c.examples) {
        const v = defaults(c.inputs, ex.inputs);
        const er = c.compute(v);
        expect(er.error, `${c.slug} example ${ex.title}`).toBeUndefined();
        const txt = ex.explain(er, v);
        expect(txt, `${c.slug} example text`).not.toMatch(/undefined|NaN/);
      }
      const av = defaults(c.inputs, c.answer.inputs ?? {});
      expect(c.answer.text(c.compute(av), av), `${c.slug} answer`).not.toMatch(/undefined|NaN/);
      for (const f of c.faqs) expect(f.a, `${c.slug} faq`).not.toMatch(/undefined|NaN/);
    });
  }
});
