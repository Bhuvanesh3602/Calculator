/** Browser-side calculator engine: reads the form, computes, re-renders, syncs URL. */
import { isShown, resolveDefault, resultExtraHtml, resultHtml } from './render';
import type { Calculator, Values } from './types';

const loaders = import.meta.glob<{ default: Calculator }>('../calculators/*.ts');

function readForm(form: HTMLFormElement, calc: Calculator): Values {
  const v: Values = {};
  for (const f of calc.inputs) {
    if (f.type === 'rows') {
      const rows: Values[] = [];
      form.querySelectorAll(`[data-rows="${f.id}"] tbody tr`).forEach((tr) => {
        const row: Values = {};
        tr.querySelectorAll<HTMLElement>('[data-col]').forEach((td) => {
          const el = td.querySelector<HTMLInputElement>('input,select')!;
          row[td.dataset.col!] = el.dataset.type === 'number' ? parseFloat(el.value) : el.value;
        });
        rows.push(row);
      });
      v[f.id] = rows;
    } else {
      const el = form.querySelector<HTMLInputElement>(`[name="${f.id}"]`);
      if (!el) continue;
      v[f.id] = f.type === 'number' ? parseFloat(el.value) : el.value;
    }
  }
  return v;
}

function applyShowIf(form: HTMLFormElement) {
  form.querySelectorAll<HTMLElement>('[data-showif]').forEach((el) => {
    el.hidden = !isShown(JSON.parse(el.dataset.showif!), (k) => form.querySelector<HTMLInputElement>(`[name="${k}"]`)?.value);
  });
}

function syncUrl(calc: Calculator, v: Values) {
  const p = new URLSearchParams();
  for (const f of calc.inputs) {
    if (f.type === 'rows') p.set(f.id, JSON.stringify(v[f.id]));
    else if (v[f.id] !== undefined && String(v[f.id]) !== 'NaN') p.set(f.id, String(v[f.id]));
  }
  history.replaceState(null, '', location.pathname + '?' + p.toString());
}

function loadUrl(form: HTMLFormElement, calc: Calculator) {
  const p = new URLSearchParams(location.search);
  if (![...p.keys()].length) return false;
  for (const f of calc.inputs) {
    const val = p.get(f.id);
    if (val == null) continue;
    if (f.type === 'rows') {
      try {
        const rows = JSON.parse(val) as Values[];
        const tb = form.querySelector(`[data-rows="${f.id}"] tbody`)!;
        tb.innerHTML = '';
        rows.slice(0, f.maxRows ?? 30).forEach((r) => {
          const tr = addRow(form, f.id);
          tr.querySelectorAll<HTMLElement>('[data-col]').forEach((td) => {
            const el = td.querySelector<HTMLInputElement>('input,select')!;
            if (r[td.dataset.col!] != null) el.value = String(r[td.dataset.col!]);
          });
        });
      } catch {}
    } else {
      const el = form.querySelector<HTMLInputElement>(`[name="${f.id}"]`);
      if (el) el.value = val;
    }
  }
  return true;
}

function addRow(form: HTMLFormElement, id: string) {
  const box = form.querySelector<HTMLElement>(`[data-rows="${id}"]`)!;
  const tpl = box.querySelector('template')!;
  const tb = box.querySelector('tbody')!;
  const tr = (tpl.content.firstElementChild as HTMLElement).cloneNode(true) as HTMLElement;
  const n = tb.children.length + Math.floor(Math.random() * 1e6);
  tr.querySelectorAll('input,select').forEach((el) => (el.id = el.id.replace('-new', '-' + n)));
  tb.append(tr);
  return tr;
}

export async function initCalculator(form: HTMLFormElement) {
  const slug = form.dataset.calc!;
  const load = loaders[`../calculators/${slug}.ts`];
  if (!load) return;
  const calc = (await load()).default;
  const out = document.querySelector<HTMLElement>('[data-result]')!;
  const extra = document.querySelector<HTMLElement>('[data-result-extra]')!;
  const live = document.querySelector<HTMLElement>('[data-live]');
  const initialHtml = form.innerHTML;

  const run = (push = true) => {
    applyShowIf(form);
    const v = readForm(form, calc);
    let r;
    try {
      r = calc.compute(v);
    } catch (e) {
      r = { primary: { label: '', value: '' }, error: 'Check your inputs — ' + (e as Error).message };
    }
    out.innerHTML = resultHtml(r);
    extra.innerHTML = resultExtraHtml(r, window.innerWidth < 700 ? 520 : 1000);
    if (live) live.textContent = r.error ? r.error : `${r.primary.label}: ${r.primary.value}`;
    if (push) syncUrl(calc, v);
  };

  let t: number | undefined;
  form.addEventListener('input', () => {
    clearTimeout(t);
    t = window.setTimeout(() => run(), 180);
  });
  form.addEventListener('change', () => run());
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    run();
  });
  form.addEventListener('click', (e) => {
    const el = e.target as HTMLElement;
    if (el.closest('[data-reset]')) {
      form.innerHTML = initialHtml;
      history.replaceState(null, '', location.pathname);
      run(false);
    } else if (el.closest('[data-add]')) {
      const box = el.closest<HTMLElement>('[data-rows]')!;
      if (box.querySelectorAll('tbody tr').length < +(box.dataset.max || 30)) addRow(form, box.dataset.rows!);
      run();
    } else if (el.closest('[data-del]')) {
      const tb = el.closest('tbody')!;
      if (tb.children.length > 1) el.closest('tr')!.remove();
      run();
    } else if (el.closest('[data-key]')) {
      const key = el.closest<HTMLElement>('[data-key]')!.dataset.key!;
      const input = form.querySelector<HTMLInputElement>('input[data-type="text"]')!;
      if (key === 'C') input.value = '';
      else if (key !== '=') {
        const s = input.selectionStart ?? input.value.length;
        const eEnd = input.selectionEnd ?? s;
        input.value = input.value.slice(0, s) + key + input.value.slice(eEnd);
        input.setSelectionRange(s + key.length, s + key.length);
      }
      input.focus();
      run();
    }
  });

  document.querySelector('[data-copy]')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget as HTMLButtonElement;
    const text = out.innerText.replace(/\n+/g, '\n');
    try {
      await navigator.clipboard.writeText(text + '\n' + location.href);
      btn.textContent = 'Copied ✓';
    } catch {
      btn.textContent = 'Copy failed';
    }
    setTimeout(() => (btn.textContent = 'Copy result'), 1600);
  });
  document.querySelector('[data-share]')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget as HTMLButtonElement;
    syncUrl(calc, readForm(form, calc));
    if (navigator.share) {
      try {
        await navigator.share({ title: document.title, url: location.href });
      } catch {}
    } else {
      await navigator.clipboard?.writeText(location.href);
      btn.textContent = 'Link copied ✓';
      setTimeout(() => (btn.textContent = 'Share link'), 1600);
    }
  });
  document.querySelector('[data-print]')?.addEventListener('click', () => print());

  const fromUrl = loadUrl(form, calc);
  if (!fromUrl) {
    for (const f of calc.inputs) {
      if (f.type === 'date' && f.default.startsWith('today')) {
        const el = form.querySelector<HTMLInputElement>(`[name="${f.id}"]`);
        if (el) el.value = resolveDefault(f);
      }
    }
  }
  // The server already rendered the default result. Only recompute on load when the
  // inputs came from a shared link or depend on today's date — re-rendering identical
  // content would cause a layout shift (bad for Core Web Vitals / CLS).
  const usesToday = calc.inputs.some((f) => f.type === 'date' && f.default.startsWith('today'));
  if (fromUrl || usesToday || calc.liveOnLoad) run(fromUrl);
  else if (window.innerWidth < 700) {
    // Phones: redraw the result chart at a narrow size so its labels are readable.
    // It sits below the first screen, so this does not count as a layout shift.
    try {
      extra.innerHTML = resultExtraHtml(calc.compute(readForm(form, calc)), 520);
    } catch {}
  }
}
