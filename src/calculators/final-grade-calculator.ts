import { num } from '../lib/format';
import type { Calculator } from '../lib/types';

export const needed = (current: number, target: number, weight: number) => (target - current * (1 - weight / 100)) / (weight / 100);

const calc: Calculator = {
  slug: 'final-grade-calculator',
  name: 'Final Grade Calculator',
  short: 'Final Grade',
  category: 'education',
  keyword: 'final exam calculator',
  volume: 90500,
  variants: ['final grade calculator', 'what do I need on my final', 'grade needed calculator', 'exam grade calculator'],
  title: 'Final Grade Calculator – What Do I Need on My Final Exam?',
  description:
    'Find the score you need on your final exam to reach the course grade you want, from your current grade and the final’s weight — for every letter grade.',
  accent: 'what you need on the final',
  icon: '✎',
  inputs: [
    { id: 'current', label: 'Current grade', type: 'number', default: 88, min: 0, max: 120, step: 0.1, suffix: '%' },
    { id: 'target', label: 'Grade you want', type: 'number', default: 90, min: 0, max: 120, step: 0.5, suffix: '%' },
    { id: 'weight', label: 'Final exam weight', type: 'number', default: 25, min: 1, max: 100, step: 1, suffix: '%' },
  ],
  compute(v) {
    const c = +v.current,
      t = +v.target,
      w = +v.weight;
    if (!(w > 0)) return { primary: { label: '', value: '' }, error: 'Enter the final’s weight.' };
    const n = needed(c, t, w);
    const letters: [string, number][] = [
      ['A (90%)', 90],
      ['B (80%)', 80],
      ['C (70%)', 70],
      ['D (60%)', 60],
    ];
    const scores = [0, 50, 60, 70, 80, 90, 100];
    return {
      primary: { label: `Score needed for ${t}%`, value: num(n, 1) + '%' },
      rows: [
        { label: 'Verdict', value: n > 100 ? 'Above 100% — not reachable without extra credit' : n <= 0 ? 'Already secured, even with a 0' : n > 90 ? 'Tough but possible' : 'Achievable' },
        ...letters.map(([l, g]) => ({ label: `Need for ${l}`, value: num(needed(c, g, w), 1) + '%' })),
      ],
      chart: {
        type: 'line',
        title: 'Final course grade by final exam score',
        x: scores.map((s) => s + '%'),
        series: [{ name: 'Course grade', values: scores.map((s) => c * (1 - w / 100) + (s * w) / 100) }],
        y: 'pct',
        xTitle: 'Final exam score',
      },
    };
  },
  answer: {
    text: (r) =>
      `With a current grade of <strong>88%</strong> and a final worth <strong>25%</strong> of the course, you need <strong>${r.primary.value}</strong> on the final to finish with a 90% (an A). Formula: (target − current × 0.75) ÷ 0.25.`,
  },
  intro: [
    'A final grade calculator works backwards from the grade you want to the exam score you need. It uses your current grade (everything before the final) and how much the final counts toward the course total.',
    'It also lists the score you need for every letter grade and charts how your course grade moves with each possible exam score, so you can decide where to focus study time.',
  ],
  formula: {
    expr: 'Needed = (Target − Current × (1 − w)) ÷ w\nCourse grade = Current × (1 − w) + Final × w',
    vars: [
      ['w', 'weight of the final as a decimal (25% → 0.25)'],
      ['Current', 'your grade before the final'],
    ],
  },
  examples: [
    { title: 'Hold on to a B', inputs: { current: 82, target: 80, weight: 30 }, explain: (r) => `You need ${r.primary.value}.` },
    { title: 'Final worth 40%', inputs: { current: 75, target: 80, weight: 40 }, explain: (r) => `A heavy final: ${r.primary.value} lifts you to a B.` },
    { title: 'Reaching for an A from a B−', inputs: { current: 80, target: 90, weight: 20 }, explain: (r) => `${r.primary.value} — ${r.rows![0].value.toLowerCase()}.` },
  ],
  analysis() {
    const ws = [10, 20, 30, 40, 50];
    const fromCurrent = [70, 80, 85];
    return [
      {
        title: 'How the final’s weight changes the score you need for 90%',
        insight: `From an 85% current grade, a 10%-weight final requires <strong>${num(needed(85, 90, 10), 0)}%</strong> to reach 90 — impossible — while a 50%-weight final needs just ${num(needed(85, 90, 50), 0)}%. Heavy finals give more room to recover, and more room to fall.`,
        chart: {
          type: 'line',
          title: 'Final score needed for a 90% course grade',
          x: ws.map((w) => w + '% weight'),
          series: fromCurrent.map((c) => ({ name: `Current ${c}%`, values: ws.map((w) => needed(c, 90, w)) })),
          y: 'pct',
          xTitle: 'Weight of final exam',
        },
      },
    ];
  },
  variantQs: [
    { q: 'What do I need on my final?', a: 'Enter your current grade, the grade you want, and the final’s weight from your syllabus. The headline number is the score you need.' },
    { q: 'Can I use this as a grade needed calculator for any test?', a: 'Yes — any single remaining assessment works the same way. Use its weight in place of the final’s.' },
  ],
  tips: [
    'Find the final’s exact weight in your syllabus or course portal.',
    'If your current grade already includes the final’s category, ask your teacher how it is calculated.',
    'Make sure your “current grade” is weighted the same way as the course (categories, not raw points).',
  ],
  faqs: [
    { q: 'How do I calculate my final grade?', a: 'Multiply your current grade by (1 − final weight) and add your final exam score times the final weight.' },
    { q: 'What happens if I get a 0 on the final?', a: 'Your course grade becomes current × (1 − weight). For 88% and a 25% final, that is 66%.' },
    { q: 'Why is the score I need over 100%?', a: 'The target is out of reach with the remaining weight. Aim for the next letter grade down or ask about extra credit.' },
    { q: 'Does this work for weighted categories?', a: 'Yes, as long as your current grade is the weighted average of all other categories.' },
  ],
  sources: [{ label: 'Example syllabus grading policies – check your own institution’s policy', url: 'https://www.cmu.edu/teaching/designteach/design/syllabus/' }],
  related: ['gpa-calculator', 'percentage-calculator', 'average-calculator'],
};
export default calc;
