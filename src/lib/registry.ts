import type { Calculator, Category } from './types';

const mods = import.meta.glob<{ default: Calculator }>('../calculators/*.ts', { eager: true });

export const calculators: Calculator[] = Object.values(mods)
  .map((m) => m.default)
  .sort((a, b) => b.volume - a.volume);

export const bySlug = Object.fromEntries(calculators.map((c) => [c.slug, c]));

export const CATEGORIES: Record<Category, { name: string; slug: string; blurb: string; accent: string }> = {
  finance: {
    name: 'Finance Calculators',
    slug: 'finance-calculators',
    blurb: 'Mortgages, loans, interest and investing — every payment shown month by month.',
    accent: 'money, made legible',
  },
  payroll: {
    name: 'Paycheck & Payroll Calculators',
    slug: 'payroll-calculators',
    blurb: 'Take-home pay, employer cost and retirement withdrawals using 2026 US rules.',
    accent: 'know your net',
  },
  health: {
    name: 'Health & Fitness Calculators',
    slug: 'health-calculators',
    blurb: 'BMI, calories, macros, body fat and pregnancy dates, using published clinical formulas.',
    accent: 'numbers for your body',
  },
  math: {
    name: 'Math Calculators',
    slug: 'math-calculators',
    blurb: 'Percentages, fractions, algebra, calculus and graphing, with step-by-step working.',
    accent: 'show the working',
  },
  education: {
    name: 'Education Calculators',
    slug: 'education-calculators',
    blurb: 'GPA and final-exam grade planning for students.',
    accent: 'plan the grade',
  },
  'date-time': {
    name: 'Date & Time Calculators',
    slug: 'date-time-calculators',
    blurb: 'Ages, date differences, time arithmetic, work hours and timesheets.',
    accent: 'every day counted',
  },
  construction: {
    name: 'Construction & Measurement Calculators',
    slug: 'construction-calculators',
    blurb: 'Area, square footage, volume, concrete and distance for real projects.',
    accent: 'measure twice',
  },
  everyday: {
    name: 'Everyday Calculators',
    slug: 'everyday-calculators',
    blurb: 'Quick, practical tools such as tipping and splitting the bill.',
    accent: 'small sums, sorted',
  },
};

export const categoryList = Object.entries(CATEGORIES).map(([key, v]) => ({
  key: key as Category,
  ...v,
  items: calculators.filter((c) => c.category === key),
}));
