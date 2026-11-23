import { num } from '../lib/format';
import type { Calculator, Values } from '../lib/types';

export const GRADE_POINTS: Record<string, number> = {
  'A+': 4.0, A: 4.0, 'A-': 3.7, 'B+': 3.3, B: 3.0, 'B-': 2.7, 'C+': 2.3, C: 2.0, 'C-': 1.7, 'D+': 1.3, D: 1.0, 'D-': 0.7, F: 0,
};
const BONUS: Record<string, number> = { regular: 0, honors: 0.5, ap: 1 };
const gradeOpts = Object.keys(GRADE_POINTS).map((g) => ({ value: g, label: `${g} (${GRADE_POINTS[g].toFixed(1)})` }));

export function gpa(rows: Values[], weighted: boolean) {
  let pts = 0,
    cr = 0;
  for (const r of rows) {
    const c = +r.credits || 0;
    if (!c || !(r.grade in GRADE_POINTS)) continue;
    const p = GRADE_POINTS[r.grade] + (weighted && r.grade !== 'F' ? BONUS[r.level] || 0 : 0);
    pts += p * c;
    cr += c;
  }
  return { gpa: cr ? pts / cr : 0, pts, cr };
}

const course = (name: string, grade: string, credits: number, level = 'regular') => ({ name, grade, credits, level });

const calc: Calculator = {
  slug: 'gpa-calculator',
  name: 'GPA Calculator',
  short: 'GPA',
  category: 'education',
  keyword: 'gpa calculator',
  volume: 823000,
  variants: ['grades calculator gpa', 'college gpa calculator', 'cumulative gpa calculator', 'weighted gpa calculator', 'gradebook calculator'],
  title: 'GPA Calculator – Semester & Cumulative, Weighted or Unweighted',
  description:
    'Calculate your semester and cumulative GPA on a 4.0 scale, weighted for honors and AP classes or unweighted, and find the GPA you need next term to reach your goal.',
  accent: 'and what you need next',
  icon: 'A',
  inputs: [
    {
      id: 'courses',
      label: 'This term’s courses',
      type: 'rows',
      addLabel: 'Add course',
      maxRows: 15,
      columns: [
        { id: 'name', label: 'Course', type: 'text', default: 'Course' },
        { id: 'grade', label: 'Grade', type: 'select', default: 'B', options: gradeOpts },
        { id: 'credits', label: 'Credits', type: 'number', default: 3, min: 0, max: 10, step: 0.5 },
        {
          id: 'level',
          label: 'Type',
          type: 'select',
          default: 'regular',
          options: [
            { value: 'regular', label: 'Regular' },
            { value: 'honors', label: 'Honors (+0.5)' },
            { value: 'ap', label: 'AP / IB (+1.0)' },
          ],
        },
      ],
      default: [course('English', 'A-', 3), course('Calculus', 'B+', 4, 'honors'), course('Biology', 'A', 4, 'ap'), course('History', 'B', 3), course('Spanish', 'A', 3)],
    },
    {
      id: 'weighted',
      label: 'GPA type',
      type: 'select',
      default: 'no',
      options: [
        { value: 'no', label: 'Unweighted (4.0 scale)' },
        { value: 'yes', label: 'Weighted (honors/AP bonus)' },
      ],
    },
    { id: 'priorGpa', label: 'Previous cumulative GPA', type: 'number', default: 3.2, min: 0, max: 5, step: 0.01, help: 'Leave credits at 0 if this is your first term.' },
    { id: 'priorCredits', label: 'Previous credits earned', type: 'number', default: 30, min: 0, step: 1 },
    { id: 'target', label: 'Target cumulative GPA', type: 'number', default: 3.5, min: 0, max: 5, step: 0.01 },
    { id: 'nextCredits', label: 'Credits next term', type: 'number', default: 15, min: 1, step: 1 },
  ],
  compute(v) {
    const g = gpa(v.courses || [], v.weighted === 'yes');
    if (!g.cr) return { primary: { label: '', value: '' }, error: 'Add at least one course with credits.' };
    const pc = +v.priorCredits || 0;
    const cum = (g.pts + (+v.priorGpa || 0) * pc) / (g.cr + pc);
    const totalCr = g.cr + pc;
    const need = ((+v.target || 0) * (totalCr + +v.nextCredits) - cum * totalCr) / +v.nextCredits;
    return {
      primary: { label: `Term GPA (${v.weighted === 'yes' ? 'weighted' : 'unweighted'})`, value: num(g.gpa, 3) },
      rows: [
        { label: 'Cumulative GPA', value: num(cum, 3) },
        { label: 'Credits this term', value: num(g.cr, 1) },
        { label: 'Quality points', value: num(g.pts, 1) },
        { label: `GPA needed next term for ${v.target}`, value: need > (v.weighted === 'yes' ? 5 : 4) ? `${num(need, 2)} — not reachable in one term` : need <= 0 ? 'Already there' : num(need, 2) },
      ],
      chart: {
        type: 'bar',
        title: 'Grade points by course',
        x: (v.courses as Values[]).map((c) => String(c.name || '')),
        series: [{ name: 'Grade points', values: (v.courses as Values[]).map((c) => (GRADE_POINTS[c.grade] ?? 0) + (v.weighted === 'yes' && c.grade !== 'F' ? BONUS[c.level] || 0 : 0)) }],
        y: 'num2',
      },
    };
  },
  answer: {
    text: (r) =>
      `With an A− in English, B+ in Calculus, A in Biology, B in History and A in Spanish (17 credits), the unweighted term GPA is <strong>${r.primary.value}</strong>. Combined with 30 earlier credits at 3.2, the cumulative GPA is <strong>${r.rows![0].value}</strong>. GPA = total quality points ÷ total credits.`,
  },
  intro: [
    'GPA (grade point average) converts letter grades into a number on a 4.0 scale and averages them, weighted by each course’s credit hours. Colleges, scholarships and employers use it as a quick summary of academic performance.',
    'This GPA calculator handles unweighted and weighted GPAs (honors +0.5, AP/IB +1.0, as many US high schools use), combines your term with previous credits for a cumulative GPA, and tells you the GPA you would need next term to hit a target.',
  ],
  formula: {
    expr: 'GPA = Σ(grade points × credits) ÷ Σ credits\nCumulative = (term points + prior GPA × prior credits) ÷ all credits\nNeeded = (target × (credits so far + next) − current × credits so far) ÷ next',
    vars: [
      ['A = 4.0', 'A− 3.7, B+ 3.3, B 3.0, B− 2.7, C+ 2.3, C 2.0, D 1.0, F 0'],
      ['Weighted', '+0.5 honors, +1.0 AP/IB (school policies vary)'],
    ],
  },
  examples: [
    { title: 'Straight B student, 15 credits', inputs: { courses: ['Eng', 'Math', 'Sci', 'Hist', 'Art'].map((n) => course(n, 'B', 3)), priorCredits: 0 }, explain: (r) => `GPA ${r.primary.value}.` },
    { title: 'Weighted with AP classes', inputs: { weighted: 'yes' }, explain: (r) => `Weighted term GPA ${r.primary.value}.` },
    { title: 'Raising a 2.8 to 3.0', inputs: { priorGpa: 2.8, priorCredits: 60, target: 3.0 }, explain: (r) => `Next term you need ${r.rows![3].value}.` },
  ],
  analysis() {
    const credits = [15, 30, 60, 90, 120];
    const lift = credits.map((c) => (3.0 * c + 4.0 * 15) / (c + 15) - 3.0);
    return [
      {
        title: 'Why GPA gets harder to move each year',
        insight: `A perfect 4.0 term (15 credits) lifts a 3.0 GPA by <strong>${num(lift[0], 2)}</strong> after one semester, but only by ${num(lift[3], 2)} once you have 90 credits. Early terms matter most — and a bad early term is hard to undo.`,
        chart: { type: 'bar', title: 'GPA increase from one 4.0 term, starting at 3.0', x: credits.map((c) => c + ' prior credits'), series: [{ name: 'GPA increase', values: lift }], y: 'num2' },
      },
      {
        title: 'Letter grade to GPA conversion',
        insight: 'Most US colleges use this plus/minus scale. Some give A+ a 4.3; check your registrar’s policy.',
        table: { head: ['Letter', 'Grade points', 'Typical %'], rows: [['A', '4.0', '93–100'], ['A−', '3.7', '90–92'], ['B+', '3.3', '87–89'], ['B', '3.0', '83–86'], ['B−', '2.7', '80–82'], ['C+', '2.3', '77–79'], ['C', '2.0', '73–76'], ['C−', '1.7', '70–72'], ['D+', '1.3', '67–69'], ['D', '1.0', '63–66'], ['F', '0.0', 'below 60']] },
      },
    ];
  },
  variantQs: [
    { q: 'How do I use a cumulative GPA calculator?', a: 'Enter this term’s courses, then your previous cumulative GPA and the credits it covers. The cumulative line combines them by credit weight.' },
    { q: 'What is a weighted GPA calculator?', a: 'It adds bonus points for harder classes: +0.5 for honors and +1.0 for AP or IB here, so the maximum is above 4.0.' },
    { q: 'Is a gradebook calculator the same as a GPA calculator?', a: 'A gradebook calculator usually averages assignment scores within one class. To combine classes, use this GPA calculator; for a single class’s final exam, use our final grade calculator.' },
  ],
  tips: [
    'Check whether your school counts plus/minus grades and how it weights honors and AP.',
    'Pass/fail and withdrawn courses usually don’t affect GPA.',
    'Retaking a course may replace the old grade at some colleges but average it at others.',
  ],
  faqs: [
    { q: 'How is GPA calculated?', a: 'Multiply each course’s grade points by its credits, add those up, and divide by total credits.' },
    { q: 'What is a good GPA?', a: 'A 3.0 is often the minimum for scholarships and many employers; 3.5+ is strong, and selective colleges often look for 3.7+ unweighted.' },
    { q: 'Can a weighted GPA be above 4.0?', a: 'Yes. With AP or honors bonuses, weighted GPAs commonly reach 4.3–5.0.' },
    { q: 'How can I raise my GPA quickly?', a: 'Focus on high-credit courses, use office hours early, and consider retaking a course if your school replaces the old grade.' },
  ],
  sources: [{ label: 'College Board – How to convert your GPA to a 4.0 scale', url: 'https://pages.collegeboard.org/how-to-convert-gpa-4.0-scale' }],
  related: ['final-grade-calculator', 'percentage-calculator', 'average-calculator', 'age-calculator'],
};
export default calc;
