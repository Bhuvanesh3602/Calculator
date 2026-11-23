import type { Field, Values } from './types';

export const ACTIVITY = [
  { value: '1.2', label: 'Sedentary (little or no exercise)' },
  { value: '1.375', label: 'Light (1–3 days/week)' },
  { value: '1.55', label: 'Moderate (3–5 days/week)' },
  { value: '1.725', label: 'Very active (6–7 days/week)' },
  { value: '1.9', label: 'Extra active (physical job + training)' },
];

export function bodyFields(opts: { sex?: boolean; age?: boolean; height?: boolean; weight?: boolean; activity?: boolean } = {}): Field[] {
  const { sex = true, age = true, height = true, weight = true, activity = false } = opts;
  const f: Field[] = [
    {
      id: 'units',
      label: 'Units',
      type: 'select',
      default: 'us',
      options: [
        { value: 'us', label: 'US (lb, ft/in)' },
        { value: 'metric', label: 'Metric (kg, cm)' },
      ],
    },
  ];
  if (sex)
    f.push({
      id: 'sex',
      label: 'Sex',
      type: 'select',
      default: 'female',
      options: [
        { value: 'female', label: 'Female' },
        { value: 'male', label: 'Male' },
      ],
    });
  if (age) f.push({ id: 'age', label: 'Age', type: 'number', default: 35, min: 15, max: 100, step: 1, suffix: 'years' });
  if (height) {
    f.push(
      { id: 'ft', label: 'Height (feet)', type: 'number', default: 5, min: 2, max: 8, step: 1, suffix: 'ft', showIf: { field: 'units', in: ['us'] } },
      { id: 'in', label: 'Height (inches)', type: 'number', default: 6, min: 0, max: 11.9, step: 0.5, suffix: 'in', showIf: { field: 'units', in: ['us'] } },
      { id: 'cm', label: 'Height', type: 'number', default: 168, min: 50, max: 250, step: 0.5, suffix: 'cm', showIf: { field: 'units', in: ['metric'] } },
    );
  }
  if (weight) {
    f.push(
      { id: 'lb', label: 'Weight', type: 'number', default: 160, min: 40, max: 700, step: 0.5, suffix: 'lb', showIf: { field: 'units', in: ['us'] } },
      { id: 'kg', label: 'Weight', type: 'number', default: 72.5, min: 20, max: 320, step: 0.1, suffix: 'kg', showIf: { field: 'units', in: ['metric'] } },
    );
  }
  if (activity) f.push({ id: 'activity', label: 'Activity level', type: 'select', default: '1.375', options: ACTIVITY });
  return f;
}

export function body(v: Values) {
  const metric = v.units === 'metric';
  const cm = metric ? +v.cm : (+v.ft * 12 + +v.in) * 2.54;
  const kg = metric ? +v.kg : +v.lb * 0.45359237;
  return { cm, kg, m: cm / 100, metric, male: v.sex === 'male', age: +v.age };
}

export const kgTo = (kg: number, metric: boolean) => (metric ? `${kg.toFixed(1)} kg` : `${(kg / 0.45359237).toFixed(1)} lb`);

/** Mifflin-St Jeor (1990). */
export function mifflin(kg: number, cm: number, age: number, male: boolean) {
  return 10 * kg + 6.25 * cm - 5 * age + (male ? 5 : -161);
}
/** Revised Harris-Benedict (Roza & Shizgal, 1984). */
export function harris(kg: number, cm: number, age: number, male: boolean) {
  return male ? 88.362 + 13.397 * kg + 4.799 * cm - 5.677 * age : 447.593 + 9.247 * kg + 3.098 * cm - 4.33 * age;
}
/** Katch-McArdle — needs body-fat %. */
export function katch(kg: number, bodyFatPct: number) {
  return 370 + 21.6 * kg * (1 - bodyFatPct / 100);
}

export const bmi = (kg: number, m: number) => kg / (m * m);
export function bmiCategory(b: number) {
  if (b < 18.5) return 'Underweight';
  if (b < 25) return 'Healthy weight';
  if (b < 30) return 'Overweight';
  if (b < 35) return 'Obesity class 1';
  if (b < 40) return 'Obesity class 2';
  return 'Obesity class 3';
}
