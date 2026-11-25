import type { Calculator, Category } from './types';

const mods = import.meta.glob<{ default: Calculator }>('../calculators/*.ts', { eager: true });

export const calculators: Calculator[] = Object.values(mods)
  .map((m) => m.default)
  .sort((a, b) => b.volume - a.volume);

export const bySlug = Object.fromEntries(calculators.map((c) => [c.slug, c]));

/**
 * Calculators whose head searches are low-competition (keyword difficulty 0-15, Nov 2026).
 * A new domain can realistically reach page one for these first, so the home page and hubs
 * give them prominent links. Revisit once Search Console shows which pages actually rank.
 */
export const FEATURED_SLUGS = [
  'ratio-calculator',
  'average-calculator',
  'slope-calculator',
  'gcf-calculator',
  'cd-calculator',
  'square-footage-calculator',
  'volume-calculator',
];
export const featured: Calculator[] = FEATURED_SLUGS.map((s) => bySlug[s]).filter(Boolean);
const featuredRank = (slug: string) => {
  const i = FEATURED_SLUGS.indexOf(slug);
  return i === -1 ? Infinity : i;
};

export const CATEGORIES: Record<Category, { name: string; slug: string; blurb: string; accent: string; intro: string }> = {
  finance: {
    name: 'Finance Calculators',
    slug: 'finance-calculators',
    blurb: 'Mortgages, loans, interest, retirement and investing — every payment shown month by month.',
    accent: 'money, made legible',
    intro:
      'These calculators cover borrowing, saving and investing: mortgages, car and personal loans, amortization schedules, simple and compound interest, implied interest rates, CDs, inflation, retirement planning, investment growth and a full time-value-of-money (TVM) solver. Each one prints the formula it uses and a month-by-month or year-by-year table, so you can check every number.',
  },
  payroll: {
    name: 'Paycheck, Salary & Tax Calculators',
    slug: 'payroll-calculators',
    blurb: 'Take-home pay, salary conversion, income tax, employer cost and RMDs using 2026 US rules.',
    accent: 'know your net',
    intro:
      'These calculators estimate take-home pay, convert hourly pay to salary, work out federal income tax and refunds bracket by bracket, total payroll cost for employers and required minimum distributions from retirement accounts. They use 2026 US federal rules and state income tax rates, and each page lists the tax tables it relies on.',
  },
  health: {
    name: 'Health & Fitness Calculators',
    slug: 'health-calculators',
    blurb: 'BMI, ideal weight, calories, running pace, body fat and pregnancy dates, using published formulas.',
    accent: 'numbers for your body',
    intro:
      'These calculators cover body measurements and ideal weight, energy needs, nutrition, strength, running pace and race prediction, and pregnancy and conception dates. Each one names the clinical formula or guideline it follows, such as Mifflin-St Jeor or Naegele’s rule, and links the published source. Results are estimates, not medical advice.',
  },
  math: {
    name: 'Math Calculators',
    slug: 'math-calculators',
    blurb: 'Percentages, fractions, triangles, statistics, algebra and calculus, with step-by-step working.',
    accent: 'show the working',
    intro:
      'These calculators cover arithmetic, ratios, averages, standard deviation, fractions, factoring, slope, triangles, algebra, calculus, graphing and secure random numbers. Every answer comes with the working, step by step, so you can follow the method as well as the result.',
  },
  education: {
    name: 'Education Calculators',
    slug: 'education-calculators',
    blurb: 'Weighted class grades, GPA and final-exam planning for students.',
    accent: 'plan the grade',
    intro:
      'These calculators help students work out a weighted class grade from assignments and tests, a GPA on a 4.0 scale, weighted or unweighted, and the final exam score needed for a target course grade. Each one shows how each grade feeds into the result.',
  },
  'date-time': {
    name: 'Date & Time Calculators',
    slug: 'date-time-calculators',
    blurb: 'Ages, date differences, time arithmetic, work hours and timesheets.',
    accent: 'every day counted',
    intro:
      'These calculators count ages, days between dates, time added or subtracted, hours worked and weekly timesheet totals. Each one handles leap years, overnight shifts and breaks, and shows how the total was reached.',
  },
  construction: {
    name: 'Construction & Measurement Calculators',
    slug: 'construction-calculators',
    blurb: 'Area, square footage, volume, concrete and distance for real projects.',
    accent: 'measure twice',
    intro:
      'These calculators measure area, square footage, volume, concrete and distance for real projects. Enter dimensions in any unit and get the result converted, with the formula and a waste allowance where it matters.',
  },
  everyday: {
    name: 'Everyday Calculators',
    slug: 'everyday-calculators',
    blurb: 'Tips, sales tax, unit conversion, passwords and IP subnets.',
    accent: 'small sums, sorted',
    intro:
      'This group holds quick, practical tools: tipping and splitting a bill, adding or removing sales tax, converting units, generating strong passwords and working out IPv4 subnets. Each one shows its working, so you can check the result.',
  },
};

export const categoryList = Object.entries(CATEGORIES).map(([key, v]) => ({
  key: key as Category,
  ...v,
  items: calculators
    .filter((c) => c.category === key)
    .sort((a, b) => featuredRank(a.slug) - featuredRank(b.slug) || b.volume - a.volume),
}));
