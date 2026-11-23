import { CPI, CPI_FIRST, CPI_LAST, CPI_SOURCE, CPI_AS_OF } from '../lib/data/cpi';
import { usd, usd2, pct } from '../lib/format';
import type { Calculator } from '../lib/types';

export function adjust(amount: number, from: number, to: number) {
  return (amount * CPI[to]) / CPI[from];
}
const years = Array.from({ length: CPI_LAST - CPI_FIRST + 1 }, (_, i) => CPI_LAST - i);
const yearOpts = years.map((y) => ({ value: String(y), label: String(y) }));

const calc: Calculator = {
  slug: 'inflation-calculator',
  name: 'Inflation Calculator',
  short: 'Inflation',
  category: 'finance',
  keyword: 'inflation calculator',
  volume: 550000,
  variants: ['calculator for inflation rate', 'cpi inflation calculator', 'value of a dollar over time', 'purchasing power calculator'],
  title: 'Inflation Calculator – What Money Was Worth (CPI 1913–2024)',
  description:
    'See what a dollar amount from any year since 1913 is worth today using official US CPI data, find the average inflation rate between years, or project future prices.',
  accent: 'using official CPI data',
  icon: '↑',
  inputs: [
    {
      id: 'mode',
      label: 'Mode',
      type: 'select',
      default: 'past',
      options: [
        { value: 'past', label: 'Historical (CPI data)' },
        { value: 'future', label: 'Future projection' },
      ],
    },
    { id: 'amount', label: 'Amount', type: 'number', default: 100, min: 0, step: 1, prefix: '$' },
    { id: 'from', label: 'From year', type: 'select', default: '2000', options: yearOpts, showIf: { field: 'mode', in: ['past'] } },
    { id: 'to', label: 'To year', type: 'select', default: String(CPI_LAST), options: yearOpts, showIf: { field: 'mode', in: ['past'] } },
    { id: 'rate', label: 'Assumed inflation rate', type: 'number', default: 3, min: -5, max: 50, step: 0.1, suffix: '%', showIf: { field: 'mode', in: ['future'] } },
    { id: 'n', label: 'Years ahead', type: 'number', default: 10, min: 1, max: 100, step: 1, suffix: 'years', showIf: { field: 'mode', in: ['future'] } },
  ],
  compute(v) {
    const amt = +v.amount;
    if (!(amt >= 0)) return { primary: { label: '', value: '' }, error: 'Enter an amount.' };
    if (v.mode === 'future') {
      const n = Math.round(+v.n),
        r = +v.rate / 100;
      const xs = Array.from({ length: n + 1 }, (_, i) => i);
      const fut = amt * Math.pow(1 + r, n);
      return {
        primary: { label: `Cost in ${n} years`, value: usd2(fut) },
        rows: [
          { label: 'Price increase', value: pct((fut / amt - 1) * 100, 1) },
          { label: `What ${usd(amt)} will buy then (today’s money)`, value: usd2(amt / Math.pow(1 + r, n)) },
          { label: 'Prices double in', value: r > 0 ? `${(Math.log(2) / Math.log(1 + r)).toFixed(1)} years` : 'never' },
        ],
        chart: {
          type: 'line',
          title: 'Projected cost and purchasing power',
          x: xs.map((i) => '+' + i + 'y'),
          series: [
            { name: 'Future price', values: xs.map((i) => amt * Math.pow(1 + r, i)) },
            { name: 'Purchasing power', values: xs.map((i) => amt / Math.pow(1 + r, i)) },
          ],
          y: 'usd',
          xTitle: 'Years from now',
        },
      };
    }
    const from = +v.from,
      to = +v.to;
    const val = adjust(amt, from, to);
    const span = Math.abs(to - from);
    const avg = span ? (Math.pow(CPI[Math.max(from, to)] / CPI[Math.min(from, to)], 1 / span) - 1) * 100 : 0;
    const lo = Math.min(from, to),
      hi = Math.max(from, to);
    const xs = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
    return {
      primary: { label: `${usd(amt)} in ${from} equals in ${to}`, value: usd2(val) },
      rows: [
        { label: 'Cumulative price change', value: pct((CPI[to] / CPI[from] - 1) * 100, 1) },
        { label: 'Average inflation per year', value: pct(avg, 2) },
        { label: `CPI ${from} → ${to}`, value: `${CPI[from]} → ${CPI[to]}` },
      ],
      chart: {
        type: 'line',
        title: `Equivalent value of ${usd(amt)} (${from} dollars)`,
        x: xs,
        series: [{ name: 'Equivalent value', values: xs.map((y) => adjust(amt, from, y)) }],
        y: 'usd',
        xTitle: 'Year',
      },
    };
  },
  answer: {
    text: (r, v) =>
      `According to the US Consumer Price Index, <strong>$${v.amount} in ${v.from}</strong> has the same buying power as <strong>${r.primary.value} in ${v.to}</strong>. Prices rose ${r.rows![0].value} over that period — an average of <strong>${r.rows![1].value} a year</strong>.`,
  },
  intro: [
    'An inflation calculator converts money from one year into another year’s dollars, so you can compare a 1985 salary with today’s or see what a price would have been decades ago. It uses the Consumer Price Index for All Urban Consumers (CPI-U), the official US measure of inflation published by the Bureau of Labor Statistics.',
    'Switch to projection mode to estimate future prices at an assumed inflation rate — useful for retirement planning or long-term savings goals.',
  ],
  formula: {
    expr: 'Value_to = Amount × CPI_to / CPI_from\nAverage rate = (CPI_to / CPI_from)^(1/years) − 1\nFuture price = Amount × (1 + rate)^years',
    vars: [
      ['CPI', 'annual average CPI-U index (1982–84 = 100)'],
      ['years', 'number of years between the two dates'],
    ],
    notes: [`Data: ${CPI_SOURCE}, ${CPI_AS_OF}. Values for 1913–1949 between published reference years are interpolated.`],
  },
  examples: [
    { title: 'A 1990 salary', inputs: { amount: 40000, from: '1990', to: '2024' }, explain: (r) => `A $40,000 salary in 1990 equals ${r.primary.value} in 2024 dollars.` },
    { title: 'The 2021–2023 spike', inputs: { amount: 100, from: '2020', to: '2023' }, explain: (r) => `$100 of 2020 spending cost ${r.primary.value} by 2023 — ${r.rows![1].value} a year.` },
    { title: 'Retirement in 25 years', inputs: { mode: 'future', amount: 5000, rate: 3, n: 25 }, explain: (r) => `$5,000 of monthly expenses today would cost ${r.primary.value} at 3% inflation.` },
  ],
  analysis() {
    const ys = Array.from({ length: CPI_LAST - 1950 + 1 }, (_, i) => 1950 + i);
    const power = ys.map((y) => (100 * CPI[1950]) / CPI[y]);
    const yr = Array.from({ length: CPI_LAST - 1960 }, (_, i) => 1961 + i);
    const infl = yr.map((y) => (CPI[y] / CPI[y - 1] - 1) * 100);
    const top = yr.map((y, i) => ({ y, r: infl[i] })).sort((a, b) => b.r - a.r).slice(0, 5);
    const decades = [1950, 1960, 1970, 1980, 1990, 2000, 2010];
    const dec = decades.map((d) => (Math.pow(CPI[d + 10] / CPI[d], 1 / 10) - 1) * 100);
    dec.push((Math.pow(CPI[CPI_LAST] / CPI[2020], 1 / (CPI_LAST - 2020)) - 1) * 100);
    return [
      {
        title: 'How $100 lost buying power since 1950',
        insight: `$100 held as cash since 1950 would buy only about <strong>${usd(power.at(-1)!)}</strong> worth of 1950 goods in ${CPI_LAST}. Cash loses value steadily even in “low inflation” decades, which is why long-term savings need to earn more than inflation.`,
        chart: { type: 'line', title: 'Purchasing power of $100 (1950 dollars)', x: ys, series: [{ name: 'Purchasing power', values: power }], y: 'usd', xTitle: 'Year' },
      },
      {
        title: 'Annual inflation, year by year',
        insight: `The highest annual inflation since 1961 was <strong>${pct(top[0].r, 1)} in ${top[0].y}</strong>, followed by ${top[1].y} (${pct(top[1].r, 1)}) and ${top[2].y} (${pct(top[2].r, 1)}). The 2022 reading of ${pct(infl[yr.indexOf(2022)], 1)} was the highest in four decades.`,
        chart: { type: 'bar', title: 'Annual US CPI inflation rate', x: yr, series: [{ name: 'Inflation', values: infl }], y: 'pct', xTitle: 'Year' },
      },
      {
        title: 'Average inflation by decade',
        insight: `The 1970s averaged <strong>${pct(dec[2], 1)}</strong> a year, enough to double prices in under a decade. The 2010s averaged ${pct(dec[6], 1)}.`,
        table: { head: ['Decade', 'Average annual inflation'], rows: decades.map((d, i) => [`${d}s`, pct(dec[i], 2)]).concat([[`2020–${CPI_LAST}`, pct(dec[7], 2)]]) },
      },
    ];
  },
  variantQs: [
    { q: 'How do I calculate the inflation rate between two years?', a: 'Divide the later CPI by the earlier CPI, subtract 1 for the total change, and take the n-th root for the yearly average. The calculator does this when you pick two years.' },
    { q: 'Is a CPI inflation calculator accurate for my own costs?', a: 'CPI tracks an average basket of goods for urban consumers. Your personal inflation can be higher or lower depending on what you spend on — housing, healthcare and education have often risen faster than CPI.' },
  ],
  tips: [
    'Use annual averages for year-to-year comparisons; monthly CPI can swing with seasons and energy prices.',
    'For salaries, compare after-tax pay where possible, since tax brackets are also indexed to inflation.',
    'For planning, test 2%, 3% and 4% — small differences compound over decades.',
  ],
  faqs: [
    { q: 'What is $100 in 2000 worth today?', a: `Using CPI-U annual averages, $100 in 2000 is equivalent to about ${usd2(adjust(100, 2000, CPI_LAST))} in ${CPI_LAST} dollars.` },
    { q: 'What is CPI?', a: 'The Consumer Price Index measures the average change over time in prices paid by urban consumers for a basket of goods and services. It is published monthly by the US Bureau of Labor Statistics.' },
    { q: 'What inflation rate should I use for the future?', a: 'The Federal Reserve targets 2% a year over the long run. Many planners use 2.5–3% to be conservative.' },
    { q: 'Why does the calculator stop at ' + CPI_LAST + '?', a: 'We use full-year annual averages so comparisons are consistent. The latest full year is added each January after BLS publishes it.' },
    { q: 'Can prices fall (deflation)?', a: 'Yes. CPI fell in parts of the early 1930s and slightly in 2009. Deflation shows as a negative rate in the chart.' },
  ],
  sources: [
    { label: 'BLS – CPI Inflation Calculator & CPI tables', url: 'https://www.bls.gov/cpi/' },
    { label: 'Federal Reserve – Why does the Fed aim for 2% inflation?', url: 'https://www.federalreserve.gov/faqs/economy_14400.htm' },
  ],
  related: ['compound-interest-calculator', 'investment-calculator', 'cd-calculator', 'paycheck-calculator', 'percent-change-calculator'],
  disclaimer: 'finance',
};
export default calc;
