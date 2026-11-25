/** Known-answer tests for the calculators added in Nov 2026 (interest … conversion). */
import { describe, it, expect } from 'vitest';
import { bySlug } from '../src/lib/registry';
import { defaults, isShown } from '../src/lib/render';
import { pmt } from '../src/lib/math';
import { interestGrowth } from '../src/calculators/interest-calculator';
import { retirementPlan } from '../src/calculators/retirement-calculator';
import { solveTvm } from '../src/calculators/finance-calculator';
import { rateFromPayment, cagr } from '../src/calculators/interest-rate-calculator';
import { incomeTax } from '../src/calculators/income-tax-calculator';
import { annualize } from '../src/calculators/salary-calculator';
import { salesTax } from '../src/calculators/sales-tax-calculator';
import { ibw } from '../src/calculators/ideal-weight-calculator';
import { parseClock, clock, riegel } from '../src/calculators/pace-calculator';
import { conception } from '../src/calculators/pregnancy-conception-calculator';
import { randInts, randBelow } from '../src/calculators/random-number-generator';
import { solveTriangle, props } from '../src/calculators/triangle-calculator';
import { sdStats, t95 } from '../src/calculators/standard-deviation-calculator';
import { weightedGrade, letter } from '../src/calculators/grade-calculator';
import { ipToInt, intToIp, subnet } from '../src/calculators/subnet-calculator';
import { makePassword, charPools, entropyBits } from '../src/calculators/password-generator';
import { convert } from '../src/calculators/conversion-calculator';

const run = (slug: string, inputs: Record<string, unknown>) => {
  const c = bySlug[slug];
  return c.compute(defaults(c.inputs, inputs));
};

describe('finance additions', () => {
  it('simple interest: $5,000 × 5% × 5 = $1,250', () => expect(interestGrowth(5000, 5, 5, 'simple').at(-1)!.interest).toBeCloseTo(1250, 6));
  it('yearly compounding: $1,000 at 5% for 3 y = $157.63', () => expect(interestGrowth(1000, 5, 3, '1').at(-1)!.interest).toBeCloseTo(157.625, 3));
  it('continuous: $1,000 at 5% for 1 y', () => expect(interestGrowth(1000, 5, 1, 'continuous').at(-1)!.interest).toBeCloseTo(1000 * (Math.exp(0.05) - 1), 6));
  it('TVM FV of −10k and −200/mo at 6% for 120 months', () => {
    const g = 1.005 ** 120;
    expect(solveTvm({ n: 120, rate: 6, pv: -10000, pmt: -200, fv: 0, ppy: 12, begin: false }, 'fv')).toBeCloseTo(10000 * g + (200 * (g - 1)) / 0.005, 6);
  });
  it('TVM PMT matches mortgage pmt()', () => expect(-solveTvm({ n: 360, rate: 6, pv: 200000, pmt: 0, fv: 0, ppy: 12, begin: false }, 'pmt')).toBeCloseTo(pmt(200000, 6, 360), 6));
  it('TVM rate and N invert FV', () => {
    const base = { n: 120, rate: 6, pv: -10000, pmt: -200, fv: 0, ppy: 12, begin: true };
    const fv = solveTvm(base, 'fv');
    expect(solveTvm({ ...base, fv }, 'rate')).toBeCloseTo(6, 6);
    expect(solveTvm({ ...base, fv }, 'n')).toBeCloseTo(120, 6);
  });
  it('rate from payment inverts pmt()', () => expect(rateFromPayment(25000, pmt(25000, 7.9, 60), 60)).toBeCloseTo(7.9, 6));
  it('CAGR 100 → 200 in 10 y = 7.177%', () => expect(cagr(100, 200, 10)).toBeCloseTo(7.1773, 3));
  it('retirement: zero return and inflation, savings exactly cover withdrawals', () => {
    const r = retirementPlan({ age: 60, retireAge: 60, endAge: 70, savings: 120000, monthly: 0, raise: 0, preReturn: 0, postReturn: 0, inflation: 0, income: 1000, other: 0 });
    expect(r.need).toBeCloseTo(120000, 6);
    expect(r.endBalance).toBeCloseTo(0, 6);
  });
});

describe('tax and pay additions', () => {
  it('income tax: single, $50,000 taxable → $5,752', () => {
    const t = incomeTax({ filing: 'single', wages: 66100, other: 0, pretax: 0, deduct: 'standard', kids: 0, credits: 0, withheld: 6000, state: 'none' });
    expect(t.taxable).toBe(50000);
    expect(t.fed).toBeCloseTo(5752, 2);
    expect(t.refund).toBeCloseTo(248, 2);
  });
  it('child tax credit: $2,200 per child', () => {
    const base = { filing: 'married', wages: 120000, other: 0, pretax: 0, deduct: 'standard', credits: 0, withheld: 0, state: 'none' };
    expect(incomeTax({ ...base, kids: 0 }).fed - incomeTax({ ...base, kids: 2 }).fed).toBeCloseTo(4400, 6);
  });
  it('salary conversions', () => {
    expect(annualize(25, 'hour', 40, 5, 10, true)).toBe(52000);
    expect(annualize(25, 'hour', 40, 5, 10, false)).toBe(50000);
    expect(annualize(4000, 'month', 40, 5, 0, true)).toBe(48000);
  });
  it('sales tax add / reverse / rate', () => {
    expect(salesTax('add', 100, 8.25).total).toBeCloseTo(108.25, 9);
    expect(salesTax('reverse', 108.25, 8.25).pre).toBeCloseTo(100, 9);
    expect(salesTax('rate', 80, 0, 86.6).rate).toBeCloseTo(8.25, 9);
  });
  it('sales tax page default: CA 7.25% + 1.5% on $249.99', () => expect(run('sales-tax-calculator', {}).rows![0].value).toBe('$21.87'));
});

describe('health additions', () => {
  it('Devine: man 5 ft 10 in = 73 kg', () => expect(ibw('devine', 70 * 2.54, true)).toBeCloseTo(73, 6));
  it('Robinson: woman 5 ft 6 in = 59.2 kg', () => expect(ibw('robinson', 66 * 2.54, false)).toBeCloseTo(59.2, 6));
  it('clock parsing and formatting', () => {
    expect(parseClock('1:45:30')).toBe(6330);
    expect(parseClock('52:30')).toBe(3150);
    expect(clock(3150)).toBe('52:30');
    expect(clock(6330)).toBe('1:45:30');
  });
  it('4-hour marathon = 9:09 per mile', () => expect(run('pace-calculator', { mode: 'pace', race: 'marathon', time: '4:00:00', unit: 'mi' }).primary.value).toBe('9:09 /mi'));
  it('Riegel doubling factor', () => expect(riegel(1000, 5, 10)).toBeCloseTo(1000 * 2 ** 1.06, 9));
  it('conception = due date − 266 days', () => {
    const c = conception({ method: 'due', due: '2026-12-25' });
    expect([c.ovulation.getFullYear(), c.ovulation.getMonth(), c.ovulation.getDate()]).toEqual([2026, 3, 3]);
  });
  it('conception from LMP shifts with cycle length', () => expect(conception({ method: 'lmp', lmp: '2026-03-02', cycle: 32 }).ovulation.getDate()).toBe(20));
});

describe('math additions', () => {
  it('random integers stay in range; no-repeat draws are distinct', () => {
    const xs = randInts(1, 49, 49, true);
    expect(new Set(xs).size).toBe(49);
    expect(Math.min(...xs)).toBe(1);
    expect(Math.max(...xs)).toBe(49);
    for (let i = 0; i < 2000; i++) {
      const r = randBelow(7);
      expect(r >= 0 && r < 7).toBe(true);
    }
  });
  it('generators never bake a value into the static HTML', () => {
    expect(run('random-number-generator', {}).primary.value).toBe('Press Generate');
    expect(run('password-generator', {}).primary.value).toBe('Press Generate');
  });
  it('triangle SSS 3-4-5', () => {
    const t = solveTriangle('sss', { a: 3, b: 4, c: 5 })[0];
    expect(t.C).toBeCloseTo(90, 9);
    expect(props(t).area).toBeCloseTo(6, 9);
    expect(props(t).type).toBe('Scalene, right');
  });
  it('triangle SSA ambiguous case gives two solutions', () => expect(solveTriangle('ssa', { a: 8, b: 10, A: 40 }).length).toBe(2));
  it('triangle SAS 10, 14, 60° → c = √156', () => expect(solveTriangle('sas', { a: 10, b: 14, C: 60 })[0].c).toBeCloseTo(Math.sqrt(156), 9));
  it('impossible triangle is rejected', () => expect(solveTriangle('sss', { a: 2, b: 3, c: 6 }).length).toBe(0));
  it('standard deviation: textbook σ = 2', () => {
    const s = sdStats([2, 4, 4, 4, 5, 5, 7, 9]);
    expect(s.popSd).toBeCloseTo(2, 12);
    expect(s.sampSd).toBeCloseTo(Math.sqrt(32 / 7), 12);
  });
  it('t critical values', () => {
    expect(t95(9)).toBe(2.262);
    expect(t95(500)).toBe(1.96);
  });
});

describe('everyday additions', () => {
  it('weighted grade and letter', () => {
    expect(weightedGrade([{ earned: 90, possible: 100, weight: 40 }, { earned: 80, possible: 100, weight: 60 }]).grade).toBeCloseTo(84, 9);
    expect(letter(84)[1]).toBe('B');
    expect(letter(93)[1]).toBe('A');
  });
  it('points-based grade', () => expect(weightedGrade([{ earned: 18, possible: 20, weight: 0 }, { earned: 82, possible: 100, weight: 0 }]).grade).toBeCloseTo(83.333, 2));
  it('score needed on the rest', () => expect(run('grade-calculator', { items: [{ name: 'A', earned: 80, possible: 100, weight: 60 }], target: 85 }).rows![2].value).toBe('92.5%'));
  it('subnet 192.168.10.77/24', () => {
    const s = subnet(ipToInt('192.168.10.77'), 24);
    expect(intToIp(s.network)).toBe('192.168.10.0');
    expect(intToIp(s.broadcast)).toBe('192.168.10.255');
    expect(s.usable).toBe(254);
  });
  it('subnet /31 and /32 (RFC 3021)', () => {
    expect(subnet(ipToInt('10.0.0.0'), 31).usable).toBe(2);
    expect(subnet(ipToInt('10.0.0.5'), 32).usable).toBe(1);
  });
  it('high first octet stays unsigned', () => expect(intToIp(subnet(ipToInt('203.0.113.9'), 30).network)).toBe('203.0.113.8'));
  it('invalid IPs are rejected', () => {
    expect(ipToInt('256.1.1.1')).toBeNaN();
    expect(ipToInt('1.2.3')).toBeNaN();
  });
  it('password has every chosen set, right length, no look-alikes', () => {
    const pools = charPools({ ambiguous: 'exclude' });
    for (let i = 0; i < 50; i++) {
      const p = makePassword(12, pools);
      expect(p.length).toBe(12);
      for (const pool of pools) expect([...p].some((ch) => pool.includes(ch))).toBe(true);
      expect(p).not.toMatch(/[Il1O0o]/);
    }
    expect(entropyBits(87, 16)).toBeCloseTo(103.09, 1);
  });
  it('conversions use exact factors', () => {
    expect(convert('length', 6, 'ft', 'm')).toBeCloseTo(1.8288, 12);
    expect(convert('weight', 1, 'lb', 'kg')).toBe(0.45359237);
    expect(convert('temperature', 98.6, 'f', 'c')).toBeCloseTo(37, 9);
    expect(convert('temperature', -40, 'c', 'f')).toBeCloseTo(-40, 9);
    expect(convert('data', 1, 'TB', 'TiB')).toBeCloseTo(0.9094947, 6);
  });
  it('showIf with several conditions requires all of them', () => {
    const cond = [{ field: 'mode', in: ['add'] }, { field: 'state', in: ['CA'] }];
    expect(isShown(cond, (k) => ({ mode: 'add', state: 'CA' } as Record<string, string>)[k])).toBe(true);
    expect(isShown(cond, (k) => ({ mode: 'rate', state: 'CA' } as Record<string, string>)[k])).toBe(false);
  });
});
