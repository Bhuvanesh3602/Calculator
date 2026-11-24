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
    blurb: 'Mortgages, loans, interest and investing — every payment shown month by month.',
    accent: 'money, made legible',
    intro:
      'These calculators cover borrowing, saving and investing: mortgages, car and personal loans, amortization schedules, CDs, compound interest, inflation and long-term investment growth. Each one prints the formula it uses and a month-by-month or year-by-year table, so you can check every number.',
  },
  payroll: {
    name: 'Paycheck & Payroll Calculators',
    slug: 'payroll-calculators',
    blurb: 'Take-home pay, employer cost and retirement withdrawals using 2026 US rules.',
    accent: 'know your net',
    intro:
      'These calculators estimate take-home pay for employees, total payroll cost for employers and required minimum distributions from retirement accounts. They use 2026 US federal rules and state income tax rates, and each page lists the tax tables it relies on.',
  },
  health: {
    name: 'Health & Fitness Calculators',
    slug: 'health-calculators',
    blurb: 'BMI, calories, macros, body fat and pregnancy dates, using published clinical formulas.',
    accent: 'numbers for your body',
    intro:
      'These calculators cover body measurements, energy needs, nutrition, strength and pregnancy dates. Each one names the clinical formula or guideline it follows, such as Mifflin-St Jeor or Naegele’s rule, and links the published source. Results are estimates, not medical advice.',
  },
  math: {
    name: 'Math Calculators',
    slug: 'math-calculators',
    blurb: 'Percentages, fractions, algebra, calculus and graphing, with step-by-step working.',
    accent: 'show the working',
    intro:
      'These calculators cover arithmetic, ratios, averages, fractions, factoring, slope, algebra, calculus and graphing. Every answer comes with the working, step by step, so you can follow the method as well as the result.',
  },
  education: {
    name: 'Education Calculators',
    slug: 'education-calculators',
    blurb: 'GPA and final-exam grade planning for students.',
    accent: 'plan the grade',
    intro:
      'These calculators help students work out a GPA on a 4.0 scale, weighted or unweighted, and the final exam score needed for a target course grade. Both show how each grade feeds into the result.',
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
    blurb: 'Quick, practical tools such as tipping and splitting the bill.',
    accent: 'small sums, sorted',
    intro:
      'This group holds quick, practical tools for everyday sums, starting with tipping and splitting a bill. Each one shows the arithmetic, so you can check it at the table.',
  },
};

export const categoryList = Object.entries(CATEGORIES).map(([key, v]) => ({
  key: key as Category,
  ...v,
  items: calculators
    .filter((c) => c.category === key)
    .sort((a, b) => featuredRank(a.slug) - featuredRank(b.slug) || b.volume - a.volume),
}));
