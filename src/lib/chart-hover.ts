/** Delegated hover/tooltip layer for every chart on the page (also re-rendered ones). */
export function initCharts(root: Document) {
  let current: Element | null = null;
  const hide = (plot: Element | null) => {
    if (!plot) return;
    const tip = plot.querySelector<HTMLElement>('.chart-tip');
    const xh = plot.querySelector<SVGLineElement>('.xhair');
    if (tip) tip.hidden = true;
    if (xh) xh.style.display = 'none';
  };
  const show = (el: Element, evt: { clientX: number; clientY: number }) => {
    const plot = el.closest('.chart-plot');
    if (!plot) return;
    const tip = plot.querySelector<HTMLElement>('.chart-tip')!;
    const svg = plot.querySelector('svg')!;
    const text = el.getAttribute('data-tip') || '';
    const [head, ...rest] = text.split('\n');
    tip.innerHTML = '';
    const b = document.createElement('b');
    b.textContent = head;
    tip.append(b);
    if (rest.length) tip.append('\n' + rest.join('\n'));
    tip.hidden = false;
    const pr = plot.getBoundingClientRect();
    let x = evt.clientX - pr.left;
    let y = evt.clientY - pr.top;
    const dx = el.getAttribute('data-x');
    const xh = plot.querySelector<SVGLineElement>('.xhair');
    if (dx && xh) {
      const vb = svg.viewBox.baseVal;
      const scale = pr.width / vb.width;
      x = +dx * scale;
      xh.setAttribute('x1', dx);
      xh.setAttribute('x2', dx);
      xh.setAttribute('y1', el.getAttribute('y') || '0');
      xh.setAttribute('y2', String(+(el.getAttribute('y') || 0) + +(el.getAttribute('height') || 0)));
      xh.style.display = '';
      y = Math.max(40, y);
    }
    const w = tip.offsetWidth;
    x = Math.min(Math.max(x, w / 2 + 4), pr.width - w / 2 - 4);
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
  };
  root.addEventListener('pointermove', (e) => {
    const el = (e.target as Element)?.closest?.('[data-tip]');
    if (el && el.closest('.chart')) {
      current = el;
      show(el, e);
    } else if (current) {
      hide(current.closest('.chart-plot'));
      current = null;
    }
  });
  root.addEventListener('pointerleave', () => current && hide(current.closest('.chart-plot')), true);
}
