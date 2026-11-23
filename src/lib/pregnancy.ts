import { addDays, daysBetween, parseDate } from './math';

/** Estimated due date from LMP using Naegele’s rule adjusted for cycle length. */
export const eddFromLmp = (lmp: Date, cycle = 28) => addDays(lmp, 280 + (cycle - 28));
export const lmpFromEdd = (edd: Date) => addDays(edd, -280);

export function gestation(lmp: Date, today: Date) {
  const d = daysBetween(lmp, today);
  return { days: d, weeks: Math.floor(d / 7), rem: d % 7 };
}
export function trimester(weeks: number) {
  return weeks < 14 ? 'First trimester' : weeks < 28 ? 'Second trimester' : 'Third trimester';
}
export const MILESTONES: [number, string][] = [
  [4, 'Positive pregnancy test possible'],
  [8, 'First prenatal visit (typical)'],
  [12, 'End of first trimester risk peak'],
  [20, 'Anatomy scan (18–22 weeks)'],
  [24, 'Glucose screening window (24–28 wks)'],
  [28, 'Third trimester begins'],
  [37, 'Early term'],
  [39, 'Full term'],
  [40, 'Estimated due date'],
  [41, 'Late term'],
];
export { parseDate };
