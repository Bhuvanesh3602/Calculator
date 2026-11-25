import { num, pct } from '../lib/format';
import type { Calculator, Values } from '../lib/types';

/** Standard US letter-grade cut-offs (percent). */
export const LETTERS: [number, string, number][] = [
  [97, 'A+', 4.0], [93, 'A', 4.0], [90, 'A-', 3.7], [87, 'B+', 3.3], [83, 'B', 3.0], [80, 'B-', 2.7],
  [77, 'C+', 2.3], [73, 'C', 2.0], [70, 'C-', 1.7], [67, 'D+', 1.3], [63, 'D', 1.0], [60, 'D-', 0.7], [0, 'F', 0],
];
export const letter = (p: number) => LETTERS.find(([min]) => p >= min - 1e-9) ?? LETTERS[LETTERS.length - 1];

/** Weighted grade from rows of {earned, possible, weight}. Rows with no weight are combined by points. */
export function weightedGrade(rows: Values[]) {
  const valid = rows
    .map((r) => ({ name: String(r.name || ''), earned: +r.earned, possible: +r.possible, weight: +r.weight || 0 }))
    .filter((r) => isFinite(r.earned) && r.possible > 0);
  const anyWeight = valid.some((r) => r.weight > 0);
  if (!anyWeight) {
    const e = valid.reduce((a, r) => a + r.earned, 0),
      p = valid.reduce((a, r) => a + r.possible, 0);
    return { grade: p ? (e / p) * 100 : NaN, weightDone: 100, rows: valid.map((r) => ({ ...r, pct: (r.earned / r.possible) * 100, share: p ? (r.possible / p) * 100 : 0 })), byPoints: true };
  }
  const w = valid.filter((r) => r.weight > 0);
  const wSum = w.reduce((a, r) => a + r.weight, 0);
  const g = w.reduce((a, r) => a + (r.earned / r.possible) * r.weight, 0) / wSum;
  return { grade: g * 100, weightDone: wSum, rows: w.map((r) => ({ ...r, pct: (r.earned / r.possible) * 100, share: r.weight })), byPoints: false };
}

const row = (name: string, earned: number, possible: number, weight: number) => ({ name, earned, possible, weight });

const calc: Calculator = {
  slug: 'grade-calculator',
  name: 'Grade Calculator',
  short: 'Grade',
  category: 'education',
  keyword: 'grade calculator',
  volume: 673000,
  variants: ['weighted grade calculator', 'class grade calculator', 'test grade calculator', 'what grade do I need', 'points grade calculator'],
  title: 'Grade Calculator – Weighted Class Grade & What You Need',
  description:
    'Calculate your weighted class grade from assignments, tests and their weights or points. See your letter grade and the score you need on the rest to hit a target.',
  accent: 'weighted, not guessed',
  icon: 'B+',
  inputs: [
    {
      id: 'items',
      label: 'Assignments, tests and categories',
      type: 'rows',
      addLabel: 'Add item',
      maxRows: 30,
      help: 'Enter weights as % of the final grade (they don’t need to add to 100 yet). Leave all weights at 0 for a points-based class.',
      columns: [
        { id: 'name', label: 'Item', type: 'text', default: 'Assignment' },
        { id: 'earned', label: 'Score', type: 'number', default: 85, min: 0, step: 0.5 },
        { id: 'possible', label: 'Out of', type: 'number', default: 100, min: 0, step: 1 },
        { id: 'weight', label: 'Weight %', type: 'number', default: 10, min: 0, max: 100, step: 1 },
      ],
      default: [row('Homework', 92, 100, 20), row('Quizzes', 41, 50, 15), row('Midterm exam', 78, 100, 25), row('Project', 88, 100, 10)],
    },
    { id: 'target', label: 'Target final grade', type: 'number', default: 85, min: 0, max: 120, step: 1, suffix: '%' },
  ],
  compute(v) {
    const g = weightedGrade(v.items || []);
    if (!g.rows.length || !isFinite(g.grade)) return { primary: { label: '', value: '' }, error: 'Enter at least one item with a score and a total above zero.' };
    const [, L, gp] = letter(g.grade);
    const remaining = g.byPoints ? 0 : Math.max(0, 100 - g.weightDone);
    const target = +v.target || 0;
    const needed = remaining > 0 ? (target * 100 - g.grade * g.weightDone) / remaining : NaN;
    const out = [
      { label: 'Letter grade', value: `${L} (${gp.toFixed(1)} GPA points)` },
      { label: g.byPoints ? 'Graded by' : 'Weight graded so far', value: g.byPoints ? 'total points' : pct(g.weightDone, 1) },
    ];
    if (remaining > 0) {
      const best = (g.grade * g.weightDone + 100 * remaining) / 100;
      const worst = (g.grade * g.weightDone) / 100;
      out.push(
        { label: `Needed on the remaining ${pct(remaining, 0)} for ${pct(target, 0)}`, value: needed <= 0 ? 'already secured' : needed > 100 ? `${pct(needed, 1)} (not possible without extra credit)` : pct(needed, 1) },
        { label: 'Final grade if you score 100% on the rest', value: `${pct(best, 1)} (${letter(best)[1]})` },
        { label: 'Final grade if you score 0% on the rest', value: `${pct(worst, 1)} (${letter(worst)[1]})` },
      );
    }
    const contrib = g.rows.map((r) => (g.byPoints ? r.earned : (r.pct * r.weight) / 100));
    return {
      primary: { label: g.byPoints ? 'Grade (by points)' : remaining > 0 ? 'Current weighted grade' : 'Final weighted grade', value: pct(g.grade, 2) },
      rows: out,
      table: {
        head: ['Item', 'Score', g.byPoints ? 'Points share' : 'Weight', g.byPoints ? 'Points' : 'Adds to final grade'],
        rows: g.rows.map((r, i) => [r.name || `Item ${i + 1}`, pct(r.pct, 1), pct(r.share, 1), g.byPoints ? `${num(r.earned, 2)} / ${num(r.possible, 2)}` : `${num(contrib[i], 2)} pts`]),
      },
      chart: { type: 'bar', title: 'Score on each item (%)', x: g.rows.map((r, i) => r.name || `Item ${i + 1}`), series: [{ name: 'Score', values: g.rows.map((r) => r.pct) }], y: 'pct' },
      steps: g.byPoints
        ? [`Grade = total earned ÷ total possible = ${num(g.rows.reduce((a, r) => a + r.earned, 0), 2)} ÷ ${num(g.rows.reduce((a, r) => a + r.possible, 0), 2)} = ${pct(g.grade, 2)}`]
        : [
            ...g.rows.map((r, i) => `${r.name || 'Item ' + (i + 1)}: ${pct(r.pct, 1)} × ${r.weight}% = ${num(contrib[i], 2)}`),
            `Sum = ${num(contrib.reduce((a, b) => a + b, 0), 2)} points out of ${num(g.weightDone, 1)} possible`,
            `Grade = ${num(contrib.reduce((a, b) => a + b, 0), 2)} ÷ ${num(g.weightDone, 1)} × 100 = ${pct(g.grade, 2)}`,
            ...(remaining > 0 ? [`Needed = (${target} × 100 − ${num(g.grade, 2)} × ${num(g.weightDone, 1)}) ÷ ${num(remaining, 1)} = ${pct(needed, 1)}`] : []),
          ],
    };
  },
  answer: {
    text: (r) =>
      `With homework at 92% (20% weight), quizzes at 41/50 (15%), a midterm of 78% (25%) and a project at 88% (10%), the current weighted grade is <strong>${r.primary.value}</strong>, a ${r.rows![0].value.split(' ')[0]}. To finish with 85%, you need <strong>${r.rows![2].value}</strong> on the remaining 30% of the course.`,
  },
  intro: [
    'A grade calculator works out your class grade from assignment scores and their weights. Most teachers weight categories differently: a midterm might count for 25% of the grade and homework for 20%. A simple average of your scores is therefore usually wrong.',
    'Enter each item as a score out of its total (41 out of 50 is fine, no need to convert) and its weight. The calculator gives your current grade, letter grade, and how much each item adds to your final grade. If the weights add up to less than 100%, it also shows the score you need on the rest of the course to reach your target. For a points-based class, leave all weights at zero.',
  ],
  formula: {
    expr: 'Weighted grade = Σ(score% × weight) ÷ Σ(weight)\nPoints grade = Σ points earned ÷ Σ points possible\nNeeded = (target × 100 − current × weight done) ÷ weight remaining',
    vars: [
      ['score%', 'earned ÷ possible × 100 for each item'],
      ['weight', 'share of the final grade, in %'],
    ],
    notes: ['Letter grades use the common US scale: 93+ A, 90 A−, 87 B+, 83 B, 80 B−, and so on down to below 60 F. Your school’s scale may differ.'],
  },
  examples: [
    { title: 'Points-based class', inputs: { items: [row('Lab 1', 18, 20, 0), row('Lab 2', 17, 20, 0), row('Test 1', 82, 100, 0), row('Test 2', 91, 100, 0)] }, explain: (r) => `${r.primary.value}, a ${r.rows![0].value.split(' ')[0]}.` },
    { title: 'All weights in (final grade)', inputs: { items: [row('Homework', 95, 100, 15), row('Labs', 88, 100, 25), row('Midterm', 74, 100, 25), row('Final exam', 81, 100, 35)] }, explain: (r) => `Final grade ${r.primary.value}, a ${r.rows![0].value.split(' ')[0]}.` },
    { title: 'Need a B with the final worth 40%', inputs: { items: [row('Coursework', 79, 100, 35), row('Midterm', 72, 100, 25)], target: 80 }, explain: (r) => `Need ${r.rows![2].value} on the final.` },
  ],
  analysis() {
    const examScores = [60, 70, 80, 90, 100];
    const weights = [20, 30, 40, 50];
    return [
      {
        title: 'How much one big exam can move your grade',
        insight: 'Take a student averaging 85% before the final. If the final is worth 20%, even a 60% only pulls the grade down to 80%. If it is worth 50%, the same 60% drops the grade to 72.5%, a C−. The heavier the final, the less your earlier work protects you.',
        chart: {
          type: 'line',
          title: 'Final grade for an 85% student, by final-exam score',
          x: examScores.map((s) => s + '% on final'),
          series: weights.slice(0, 4).map((w) => ({ name: `Final worth ${w}%`, values: examScores.map((s) => (85 * (100 - w) + s * w) / 100) })),
          y: 'pct',
        },
      },
      {
        title: 'Weighted vs unweighted: why the simple average misleads',
        insight: `Scores of 95% homework, 88% labs, 74% midterm and 81% final average 84.5%. Weighted 15/25/25/35, they come to <strong>${pct((95 * 15 + 88 * 25 + 74 * 25 + 81 * 35) / 100, 1)}</strong>. The weaker exams carry the most weight, so the real grade is lower than the simple average suggests, and near a letter boundary that can cost a grade.`,
        table: {
          head: ['Method', 'Grade', 'Letter'],
          rows: [
            ['Simple average', '84.5%', letter(84.5)[1]],
            ['Weighted 15/25/25/35', pct((95 * 15 + 88 * 25 + 74 * 25 + 81 * 35) / 100, 2), letter((95 * 15 + 88 * 25 + 74 * 25 + 81 * 35) / 100)[1]],
          ],
        },
      },
    ];
  },
  variantQs: [
    { q: 'How do I calculate a weighted grade?', a: 'Multiply each score (as a percentage) by its weight, add them up, and divide by the total weight. 90% × 40 + 80% × 60 = 84%.' },
    { q: 'What grade do I need on my final?', a: 'Enter everything graded so far with its weights, and set your target. The calculator shows the score needed on the remaining weight. Our final grade calculator does the same from just your current grade and the exam weight.' },
    { q: 'Can I enter points instead of percentages?', a: 'Yes. Each item takes a score and an “out of” total, such as 41 out of 50. Set every weight to 0 to calculate a grade purely by total points.' },
  ],
  tips: [
    'Check your syllabus for category weights, and enter each category’s average as a single row.',
    'Drop-lowest policies: remove the lowest score before entering a category average.',
    'Turn the result into GPA points with our GPA calculator.',
  ],
  faqs: [
    { q: 'What is a weighted grade?', a: 'A grade in which some work counts more than other work. Each category has a percentage weight, and your grade is the weighted average of the category scores.' },
    { q: 'What letter grade is an 85?', a: 'On the standard US scale, 85% is a B (83–86.9). 87–89.9 is a B+ and 80–82.9 a B−.' },
    { q: 'What if my weights do not add up to 100%?', a: 'The calculator divides by the weight graded so far, so the result is your current grade. The remaining weight is used to show what you need on the rest of the course.' },
    { q: 'Is an A+ worth more than an A?', a: 'Usually not on a 4.0 scale: both count as 4.0. Some schools give A+ a 4.3. Check your school’s policy.' },
  ],
  sources: [
    { label: 'College Board – How to convert your GPA to a 4.0 scale', url: 'https://pages.collegeboard.org/how-to-convert-gpa-4.0-scale' },
  ],
  related: ['final-grade-calculator', 'gpa-calculator', 'average-calculator', 'percentage-calculator', 'standard-deviation-calculator'],
  reference: {
    caption: 'Letter Grade Scale',
    source: 'Common US high school and college scale',
    head: ['Letter', 'Percent', 'GPA points'],
    rows: LETTERS.map(([min, l, gp], i) => [l, i === 0 ? `${min}–100` : min === 0 ? 'below 60' : `${min}–${LETTERS[i - 1][0] - 0.1}`, gp.toFixed(1)]),
  },
};
export default calc;
