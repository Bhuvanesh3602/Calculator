/**
 * 2026 US federal payroll & income-tax parameters.
 * Sources: IRS Rev. Proc. 2025-32 (inflation adjustments for tax year 2026),
 * SSA 2026 COLA fact sheet (wage base), IRS Pub 15-T.
 * VERIFY each January before relying on these values.
 */
export const TAX_YEAR = 2026;
export type Filing = 'single' | 'married' | 'hoh';

export const STANDARD_DEDUCTION: Record<Filing, number> = { single: 16100, married: 32200, hoh: 24150 };

// [upper bound of bracket, rate]
export const BRACKETS: Record<Filing, [number, number][]> = {
  single: [
    [12400, 0.1],
    [50400, 0.12],
    [105700, 0.22],
    [201775, 0.24],
    [256225, 0.32],
    [640600, 0.35],
    [Infinity, 0.37],
  ],
  married: [
    [24800, 0.1],
    [100800, 0.12],
    [211400, 0.22],
    [403550, 0.24],
    [512450, 0.32],
    [768700, 0.35],
    [Infinity, 0.37],
  ],
  hoh: [
    [17700, 0.1],
    [67450, 0.12],
    [105700, 0.22],
    [201750, 0.24],
    [256200, 0.32],
    [640600, 0.35],
    [Infinity, 0.37],
  ],
};

export const SS_RATE = 0.062;
export const SS_WAGE_BASE = 184500;
export const MEDICARE_RATE = 0.0145;
export const ADDL_MEDICARE_RATE = 0.009;
export const ADDL_MEDICARE_THRESHOLD: Record<Filing, number> = { single: 200000, married: 250000, hoh: 200000 };
export const FUTA_RATE_NET = 0.006; // 6.0% less 5.4% state credit
export const FUTA_WAGE_BASE = 7000;
export const LIMIT_401K = 24500;

/** Progressive federal income tax on taxable income. */
export function federalTax(taxable: number, filing: Filing) {
  let tax = 0,
    lower = 0;
  for (const [upper, rate] of BRACKETS[filing]) {
    if (taxable <= lower) break;
    tax += (Math.min(taxable, upper) - lower) * rate;
    lower = upper;
  }
  return Math.max(0, tax);
}
export function marginalRate(taxable: number, filing: Filing) {
  for (const [upper, rate] of BRACKETS[filing]) if (taxable <= upper) return rate;
  return 0.37;
}

/** Simplified state handling: no-tax states and flat-rate states; otherwise user enters a rate. */
export const STATES: { value: string; label: string; rate: number | null }[] = [
  { value: 'none', label: 'No state income tax (AK, FL, NV, NH, SD, TN, TX, WA, WY)', rate: 0 },
  { value: 'AZ', label: 'Arizona (flat 2.5%)', rate: 2.5 },
  { value: 'IL', label: 'Illinois (flat 4.95%)', rate: 4.95 },
  { value: 'IN', label: 'Indiana (flat 2.95% + county)', rate: 2.95 },
  { value: 'KY', label: 'Kentucky (flat 3.5%)', rate: 3.5 },
  { value: 'MI', label: 'Michigan (flat 4.25%)', rate: 4.25 },
  { value: 'NC', label: 'North Carolina (flat 3.99%)', rate: 3.99 },
  { value: 'PA', label: 'Pennsylvania (flat 3.07%)', rate: 3.07 },
  { value: 'UT', label: 'Utah (flat 4.5%)', rate: 4.5 },
  { value: 'custom', label: 'Other state – enter effective rate', rate: null },
];
