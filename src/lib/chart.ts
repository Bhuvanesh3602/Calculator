/**
 * Tiny dependency-free SVG chart renderer.
 * Runs at build time (Astro) AND in the browser (live result charts),
 * so it only builds strings. Charts are designed for the dark panels
 * (surface #111). Palette validated with the dataviz validator:
 * orange, blue, green, pink — fixed order, never cycled.
 */
import { compact, esc, fmt, type Fmt } from './format';

export const PALETTE = ['#EA580C', '#3B82F6', '#16A34A', '#DB2777'];

export interface Series {
  name: string;
  values: number[];
}
export interface ChartSpec {
  type: 'line' | 'area' | 'bar' | 'stacked' | 'hbar' | 'donut';
  title: string;
  x: (string | number)[];
  series: Series[];
  y?: Fmt;
  xTitle?: string;
  yTitle?: string;
  /** For numeric-x line charts (graphing). */
  numericX?: boolean;
  /** Draw a highlighted vertical marker at this x index. */
  markIndex?: number;
  height?: number;
}

let W = 640;

function niceStep(range: number, count: number) {
  const raw = range / Math.max(1, count);
  const mag = 10 ** Math.floor(Math.log10(raw || 1));
  const n = raw / mag;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step * mag;
}
function ticks(min: number, max: number, count = 5) {
  if (min === max) {
    max = min + 1;
    min = Math.min(0, min);
  }
  const step = niceStep(max - min, count);
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const out: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) out.push(+v.toFixed(10));
  return out;
}

function legend(spec: ChartSpec, withValues = false) {
  if (spec.series.length < 2 && spec.type !== 'donut') return '';
  const items =
    spec.type === 'donut'
      ? spec.x.map((x, i) => ({
          name: String(x),
          color: PALETTE[i % PALETTE.length],
          val: withValues ? fmt(spec.series[0].values[i], spec.y) : '',
        }))
      : spec.series.map((s, i) => ({ name: s.name, color: PALETTE[i], val: '' }));
  return (
    '<ul class="chart-legend">' +
    items
      .map(
        (it) =>
          `<li><span class="sw" style="background:${it.color}"></span>${esc(it.name)}${
            it.val ? ` <b>${esc(it.val)}</b>` : ''
          }</li>`,
      )
      .join('') +
    '</ul>'
  );
}

function tipFor(spec: ChartSpec, i: number) {
  const head = spec.numericX ? `x = ${fmt(Number(spec.x[i]), 'num2')}` : String(spec.x[i]);
  const lines = spec.series.map((s) => `${s.name}: ${fmt(s.values[i], spec.y)}`);
  if (spec.type === 'stacked' || spec.type === 'area') {
    const tot = spec.series.reduce((a, s) => a + (s.values[i] || 0), 0);
    if (spec.series.length > 1) lines.push(`Total: ${fmt(tot, spec.y)}`);
  }
  return esc([head, ...lines].join('\n'));
}

function xLabelIdx(n: number, max = 7) {
  if (n <= max) return [...Array(n).keys()];
  const step = Math.ceil((n - 1) / (max - 1));
  const idx: number[] = [];
  for (let i = 0; i < n; i += step) idx.push(i);
  if (idx[idx.length - 1] !== n - 1) {
    if (n - 1 - idx[idx.length - 1] < step / 2) idx.pop();
    idx.push(n - 1);
  }
  return idx;
}

function cartesian(spec: ChartSpec) {
  const H = spec.height ?? 300;
  const n = spec.x.length;
  const stacked = spec.type === 'stacked' || spec.type === 'area';
  const all: number[] = [];
  if (stacked) {
    for (let i = 0; i < n; i++) all.push(spec.series.reduce((a, s) => a + Math.max(0, s.values[i] || 0), 0));
  } else spec.series.forEach((s) => s.values.forEach((v) => isFinite(v) && all.push(v)));
  let ymin = Math.min(0, ...all);
  let ymax = Math.max(...all, 0);
  if (spec.numericX && spec.type === 'line') ymin = Math.min(...all);
  const yt = ticks(ymin, ymax);
  ymin = yt[0];
  ymax = yt[yt.length - 1];

  const direct = spec.type === 'line' && spec.series.length >= 2 && spec.series.length <= 4;
  const L = 58,
    R = direct ? 92 : 16,
    T = 14,
    B = spec.xTitle ? 46 : 32;
  const pw = W - L - R,
    ph = H - T - B;
  const ys = (v: number) => T + ph - ((v - ymin) / (ymax - ymin || 1)) * ph;
  const band = pw / n;
  let xs: (i: number) => number;
  if (spec.type === 'bar' || spec.type === 'stacked') xs = (i) => L + band * i + band / 2;
  else if (spec.numericX) {
    const x0 = Number(spec.x[0]),
      x1 = Number(spec.x[n - 1]);
    xs = (i) => L + ((Number(spec.x[i]) - x0) / (x1 - x0 || 1)) * pw;
  } else xs = (i) => L + (n === 1 ? pw / 2 : (pw * i) / (n - 1));

  let g = '';
  // grid + y labels (recessive)
  for (const t of yt) {
    const y = ys(t).toFixed(1);
    g += `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" class="grid${t === 0 ? ' zero' : ''}"/>`;
    g += `<text x="${L - 8}" y="${+y + 4}" class="ax" text-anchor="end">${esc(compact(t, spec.y))}</text>`;
  }
  // x labels
  if (spec.numericX) {
    const xt = ticks(Number(spec.x[0]), Number(spec.x[n - 1]), 8);
    const x0 = Number(spec.x[0]),
      x1 = Number(spec.x[n - 1]);
    for (const t of xt) {
      if (t < x0 || t > x1) continue;
      const x = L + ((t - x0) / (x1 - x0 || 1)) * pw;
      g += `<line x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${T}" y2="${T + ph}" class="grid${t === 0 ? ' zero' : ''}"/>`;
      g += `<text x="${x.toFixed(1)}" y="${H - B + 18}" class="ax" text-anchor="middle">${esc(compact(t))}</text>`;
    }
  } else {
    for (const i of xLabelIdx(n, spec.type === 'bar' || spec.type === 'stacked' ? 12 : 7)) {
      g += `<text x="${xs(i).toFixed(1)}" y="${H - B + 18}" class="ax" text-anchor="middle">${esc(String(spec.x[i]))}</text>`;
    }
  }
  if (spec.xTitle) g += `<text x="${L + pw / 2}" y="${H - 6}" class="ax t" text-anchor="middle">${esc(spec.xTitle)}</text>`;

  if (spec.markIndex != null && spec.markIndex >= 0 && spec.markIndex < n) {
    const x = xs(spec.markIndex).toFixed(1);
    g += `<line x1="${x}" x2="${x}" y1="${T}" y2="${T + ph}" class="mark-line"/>`;
  }

  const base = ys(Math.max(0, ymin));
  if (spec.type === 'bar') {
    const k = spec.series.length;
    const bw = Math.min(42, (band - 6) / k);
    spec.series.forEach((s, si) => {
      s.values.forEach((v, i) => {
        const x = xs(i) - (bw * k) / 2 + si * bw + 1;
        const y = ys(Math.max(0, v)),
          h = Math.abs(ys(v) - ys(0));
        g += barPath(x, v >= 0 ? y : base, bw - 2, h, PALETTE[si], v >= 0, tipFor(spec, i));
      });
    });
    if (k === 1 && n <= 10) {
      spec.series[0].values.forEach((v, i) => {
        g += `<text x="${xs(i).toFixed(1)}" y="${(ys(Math.max(0, v)) - 6).toFixed(1)}" class="val" text-anchor="middle">${esc(compact(v, spec.y))}</text>`;
      });
    }
  } else if (spec.type === 'stacked') {
    const bw = Math.min(46, band - 6);
    for (let i = 0; i < n; i++) {
      let acc = 0;
      spec.series.forEach((s, si) => {
        const v = Math.max(0, s.values[i] || 0);
        const y1 = ys(acc + v),
          y0 = ys(acc);
        const top = si === spec.series.length - 1 || spec.series.slice(si + 1).every((t) => !(t.values[i] > 0));
        // 2px surface gap between segments
        g += barPath(xs(i) - bw / 2, y1, bw, Math.max(0, y0 - y1 - (si ? 2 : 0)), PALETTE[si], top, tipFor(spec, i));
        acc += v;
      });
    }
  } else if (spec.type === 'area') {
    const acc = new Array(n).fill(0);
    spec.series.forEach((s, si) => {
      const lower = acc.slice();
      s.values.forEach((v, i) => (acc[i] += Math.max(0, v || 0)));
      let d = '';
      for (let i = 0; i < n; i++) d += `${i ? 'L' : 'M'}${xs(i).toFixed(1)},${ys(acc[i]).toFixed(1)}`;
      for (let i = n - 1; i >= 0; i--) d += `L${xs(i).toFixed(1)},${ys(lower[i]).toFixed(1)}`;
      g += `<path d="${d}Z" fill="${PALETTE[si]}" fill-opacity=".85" stroke="var(--chart-surface,#111)" stroke-width="2"/>`;
    });
  } else {
    // line
    const endY: { y: number; name: string }[] = [];
    spec.series.forEach((s, si) => {
      let d = '';
      let pen = false;
      s.values.forEach((v, i) => {
        if (!isFinite(v) || v > ymax * 4 + 1e6 || v < ymin * 4 - 1e6) {
          pen = false;
          return;
        }
        const y = Math.min(T + ph + 2, Math.max(T - 2, ys(v)));
        d += `${pen ? 'L' : 'M'}${xs(i).toFixed(1)},${y.toFixed(1)}`;
        pen = true;
      });
      if (spec.series.length === 1 && !spec.numericX && ymin >= 0) {
        g += `<path d="${d}L${xs(n - 1).toFixed(1)},${base.toFixed(1)}L${xs(0).toFixed(1)},${base.toFixed(1)}Z" fill="${PALETTE[si]}" fill-opacity=".14"/>`;
      }
      g += `<path d="${d}" fill="none" stroke="${PALETTE[si]}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
      if (n <= 14 && !spec.numericX)
        s.values.forEach((v, i) => {
          g += `<circle cx="${xs(i).toFixed(1)}" cy="${ys(v).toFixed(1)}" r="4" fill="${PALETTE[si]}" stroke="var(--chart-surface,#111)" stroke-width="2"/>`;
        });
      const last = s.values[n - 1];
      if (isFinite(last)) endY.push({ y: ys(last), name: s.name });
    });
    if (direct) {
      endY.sort((a, b) => a.y - b.y);
      for (let i = 1; i < endY.length; i++) if (endY[i].y - endY[i - 1].y < 14) endY[i].y = endY[i - 1].y + 14;
      for (const e of endY) g += `<text x="${W - R + 8}" y="${(e.y + 4).toFixed(1)}" class="val">${esc(trunc(e.name, 13))}</text>`;
    }
  }
  // hover hit-columns for line/area (bigger than the marks)
  if (spec.type === 'line' || spec.type === 'area') {
    const step = n > 120 ? Math.ceil(n / 120) : 1;
    for (let i = 0; i < n; i += step) {
      const x0 = i === 0 ? L : (xs(i - step) + xs(i)) / 2;
      const x1 = i + step >= n ? W - R : (xs(i) + xs(Math.min(n - 1, i + step))) / 2;
      g += `<rect class="hit" x="${x0.toFixed(1)}" y="${T}" width="${Math.max(1, x1 - x0).toFixed(1)}" height="${ph}" data-tip="${tipFor(spec, i)}" data-x="${xs(i).toFixed(1)}"/>`;
    }
  }
  return { svg: g, H };
}

function trunc(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

/** Bar with 4px rounded data-end anchored to baseline. */
function barPath(x: number, y: number, w: number, h: number, color: string, roundTop: boolean, tip: string) {
  if (h <= 0 || w <= 0) return '';
  const r = Math.min(4, w / 2, h);
  const d = roundTop
    ? `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`
    : `M${x},${y}H${x + w}V${y + h}H${x}Z`;
  return `<path d="${d}" fill="${color}" class="bar" data-tip="${tip}"/>`;
}

function hbar(spec: ChartSpec) {
  const n = spec.x.length;
  const rowH = 30;
  const H = n * rowH + 20;
  const L = 170,
    R = 70;
  const vals = spec.series[0].values;
  const max = Math.max(...vals, 0) || 1;
  const pw = W - L - R;
  let g = '';
  vals.forEach((v, i) => {
    const y = 10 + i * rowH;
    const w = (Math.max(0, v) / max) * pw;
    g += `<text x="${L - 10}" y="${y + 17}" class="ax lbl" text-anchor="end">${esc(trunc(String(spec.x[i]), 24))}</text>`;
    if (w > 0) {
      const r = Math.min(4, w);
      g += `<path class="bar" d="M${L},${y + 4}H${L + w - r}Q${L + w},${y + 4} ${L + w},${y + 4 + r}V${y + 22 - r}Q${L + w},${y + 22} ${L + w - r},${y + 22}H${L}Z" fill="${PALETTE[0]}" data-tip="${esc(String(spec.x[i]) + '\n' + fmt(v, spec.y))}"/>`;
    }
    g += `<text x="${L + w + 8}" y="${y + 17}" class="val">${esc(fmt(v, spec.y))}</text>`;
  });
  return { svg: g, H };
}

function donut(spec: ChartSpec) {
  const H = 240;
  const cx = W / 2,
    cy = H / 2,
    ro = 105,
    ri = 70;
  const vals = spec.series[0].values.map((v) => Math.max(0, v));
  const tot = vals.reduce((a, b) => a + b, 0) || 1;
  let a0 = -Math.PI / 2;
  let g = '';
  vals.forEach((v, i) => {
    if (v <= 0) return;
    const a1 = a0 + (v / tot) * Math.PI * 2 - (vals.filter((x) => x > 0).length > 1 ? 0.0001 : 0);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const p = (r: number, a: number) => `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
    const full = v / tot > 0.9999;
    const d = full
      ? `M${cx - ro},${cy}a${ro},${ro} 0 1,0 ${ro * 2},0a${ro},${ro} 0 1,0 -${ro * 2},0M${cx - ri},${cy}a${ri},${ri} 0 1,1 ${ri * 2},0a${ri},${ri} 0 1,1 -${ri * 2},0Z`
      : `M${p(ro, a0)}A${ro},${ro} 0 ${large} 1 ${p(ro, a1)}L${p(ri, a1)}A${ri},${ri} 0 ${large} 0 ${p(ri, a0)}Z`;
    g += `<path d="${d}" fill="${PALETTE[i % PALETTE.length]}" stroke="var(--chart-surface,#111)" stroke-width="2" fill-rule="evenodd" class="bar" data-tip="${esc(
      String(spec.x[i]) + '\n' + fmt(v, spec.y) + ' (' + fmt((v / tot) * 100, 'pct') + ')',
    )}"/>`;
    a0 = a1;
  });
  g += `<text x="${cx}" y="${cy - 2}" class="donut-total" text-anchor="middle">${esc(compact(tot, spec.y))}</text>`;
  g += `<text x="${cx}" y="${cy + 18}" class="ax" text-anchor="middle">total</text>`;
  return { svg: g, H };
}

export function renderChart(spec: ChartSpec, width = 640): string {
  W = width;
  if (!spec || !spec.x?.length || !spec.series?.length) return '';
  const { svg, H } = spec.type === 'hbar' ? hbar(spec) : spec.type === 'donut' ? donut(spec) : cartesian(spec);
  const desc = spec.series.map((s) => s.name).join(', ');
  return (
    `<div class="chart" data-chart>` +
    legend(spec, spec.type === 'donut') +
    `<div class="chart-plot"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(spec.title)}" preserveAspectRatio="xMidYMid meet">` +
    `<title>${esc(spec.title)}</title><desc>${esc(desc)}</desc>` +
    (spec.yTitle ? `<text x="4" y="10" class="ax t">${esc(spec.yTitle)}</text>` : '') +
    svg +
    `<line class="xhair" x1="0" x2="0" y1="0" y2="0" style="display:none"/>` +
    `</svg><div class="chart-tip" role="status" hidden></div></div></div>`
  );
}

/** Table view of a chart (accessibility + AI-readable). */
export function chartTable(spec: ChartSpec, maxRows = 40) {
  let idx = [...spec.x.keys()];
  if (idx.length > maxRows) {
    const step = Math.ceil(idx.length / maxRows);
    idx = idx.filter((i) => i % step === 0 || i === spec.x.length - 1);
  }
  return {
    head: [spec.xTitle || '', ...spec.series.map((s) => s.name)],
    rows: idx.map((i) => [String(spec.x[i]), ...spec.series.map((s) => fmt(s.values[i], spec.y))]),
  };
}
