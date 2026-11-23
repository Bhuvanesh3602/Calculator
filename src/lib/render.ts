import { renderChart } from './chart';
import { esc } from './format';
import { addDays, isoDate } from './math';
import type { Field, Result, Table, Values } from './types';

export function tableHtml(t: Table, cls = 'data-table') {
  return (
    `<div class="table-wrap"><table class="${cls}">` +
    (t.caption ? `<caption>${esc(t.caption)}</caption>` : '') +
    `<thead><tr>${t.head.map((h) => `<th scope="col">${esc(String(h))}</th>`).join('')}</tr></thead><tbody>` +
    t.rows.map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th scope="row">${esc(String(c))}</th>` : `<td>${esc(String(c))}</td>`)).join('')}</tr>`).join('') +
    `</tbody></table></div>`
  );
}

/** Result panel HTML — identical on server and client. */
export function resultHtml(r: Result): string {
  if (r.error) return `<p class="result-error" role="alert">${esc(r.error)}</p>`;
  let h = `<p class="result-label">${esc(r.primary.label)}</p><p class="result-value${r.primary.value.length > 22 ? ' long' : ''}">${esc(r.primary.value)}</p>`;
  if (r.rows?.length)
    h += `<dl class="result-rows">${r.rows.map((x) => `<div><dt>${esc(x.label)}</dt><dd>${esc(x.value)}</dd></div>`).join('')}</dl>`;
  if (r.note) h += `<p class="result-note">${esc(r.note)}</p>`;
  return h;
}
export function resultExtraHtml(r: Result, chartWidth = 1000): string {
  if (r.error) return '';
  let h = '';
  if (r.steps?.length) h += `<div class="steps"><h3>Step-by-step working</h3><ol>${r.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol></div>`;
  if (r.chart) h += renderChart(r.chart, chartWidth);
  if (r.table) h += `<details class="result-table"><summary>Show full table</summary>${tableHtml(r.table)}</details>`;
  return h;
}

/** Resolve "today", "today+30" etc. */
export function resolveDefault(f: Field, now = new Date()): any {
  if (f.type === 'date') {
    const m = /^today([+-]\d+)?$/.exec(f.default);
    if (m) return isoDate(addDays(now, m[1] ? +m[1] : 0));
  }
  return f.default;
}

export function defaults(fields: Field[], over: Values = {}): Values {
  const v: Values = {};
  for (const f of fields) v[f.id] = f.id in over ? over[f.id] : resolveDefault(f);
  return v;
}

/** Human summary of inputs for worked examples. */
export function describeInputs(fields: Field[], v: Values): string {
  return fields
    .filter((f) => f.type !== 'rows' && (!f.showIf || f.showIf.in.includes(String(v[f.showIf.field]))))
    .map((f) => {
      const val = v[f.id];
      if (f.type === 'select') return `${f.label}: ${f.options.find((o) => o.value === val)?.label ?? val}`;
      if (f.type === 'number') return `${f.label}: ${f.prefix ?? ''}${Number(val).toLocaleString('en-US')}${f.suffix ? ' ' + f.suffix : ''}`;
      return `${f.label}: ${val}`;
    })
    .join(' · ');
}
