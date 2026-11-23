import type { ChartSpec } from './chart';

export type Values = Record<string, any>;

interface BaseField {
  id: string;
  label: string;
  help?: string;
  /** Only show this field when another field has one of these values. */
  showIf?: { field: string; in: string[] };
}
export interface NumberField extends BaseField {
  type: 'number';
  default: number;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string; // "$"
  suffix?: string; // "%", "years"
}
export interface SelectField extends BaseField {
  type: 'select';
  default: string;
  options: { value: string; label: string }[];
}
export interface DateField extends BaseField {
  type: 'date';
  /** ISO date, or "today", or "today+N" / "today-N" (days). */
  default: string;
}
export interface TimeField extends BaseField {
  type: 'time';
  default: string; // "09:00"
}
export interface TextField extends BaseField {
  type: 'text';
  default: string;
  placeholder?: string;
  mono?: boolean;
}
export type SimpleField = NumberField | SelectField | DateField | TimeField | TextField;
export interface RowsField extends BaseField {
  type: 'rows';
  columns: SimpleField[];
  default: Values[];
  addLabel: string;
  maxRows?: number;
}
export type Field = SimpleField | RowsField;

export interface Result {
  primary: { label: string; value: string };
  rows?: { label: string; value: string }[];
  chart?: ChartSpec;
  table?: Table;
  steps?: string[];
  note?: string;
  error?: string;
}

export interface Table {
  caption?: string;
  head: string[];
  rows: (string | number)[][];
}

export interface AnalysisBlock {
  title: string;
  insight: string;
  chart?: ChartSpec;
  table?: Table;
  stats?: { label: string; value: string }[];
}

export type Category =
  | 'finance'
  | 'payroll'
  | 'health'
  | 'math'
  | 'education'
  | 'date-time'
  | 'construction'
  | 'everyday';

export interface QA {
  q: string;
  a: string;
}

export interface Calculator {
  slug: string; // "mortgage-calculator"
  name: string; // "Mortgage Calculator"
  short: string; // "Mortgage"
  category: Category;
  keyword: string;
  volume: number;
  variants: string[];
  /** SEO title, <= 60 chars */
  title: string;
  /** Meta description, 140-160 chars */
  description: string;
  /** Italic accent phrase shown after the H1 */
  accent: string;
  icon: string; // one or two characters for the key badge
  inputs: Field[];
  keypad?: boolean;
  compute: (v: Values) => Result;
  /** 40-60 word answer block. Built from a real computed example. */
  answer: { inputs?: Values; text: (r: Result, v: Values) => string };
  intro: string[];
  formula: { expr: string; vars: [string, string][]; notes?: string[] };
  examples: { title: string; inputs: Values; explain: (r: Result, v: Values) => string }[];
  analysis: () => AnalysisBlock[];
  variantQs: QA[];
  tips: string[];
  faqs: QA[];
  sources: { label: string; url: string }[];
  related: string[];
  disclaimer?: 'finance' | 'health' | 'tax' | 'general';
  reference?: Table & { asOf?: string; source?: string };
}
