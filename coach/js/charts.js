// Gráficas canvas — marcas finas, grid recesivo, tooltip por puntero.
// Paleta categórica validada (dataviz): ver tokens --c1..--c4.

const INK = '#F4E9D7', INK3 = '#93806F', GRID = 'rgba(244,233,215,0.08)', SURF = '#2F1B22';
const FONT = '11px ui-monospace, monospace';

function setup(canvas, cssH) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssW = canvas.clientWidth || canvas.parentElement.clientWidth || 320;
  canvas.width = cssW * dpr;
  canvas.height = cssH * dpr;
  canvas.style.height = cssH + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return { ctx, W: cssW, H: cssH };
}

/* Línea(s) temporales.
   series: [{ name, color, data: [{x:'lbl', y:number|null}] }]
   opts: { yMin, yMax, unit } */
export function lineChart(canvas, series, opts = {}) {
  const { ctx, W, H } = setup(canvas, opts.height || 180);
  const P = { l: 30, r: 10, t: 12, b: 22 };
  const n = Math.max(...series.map((s) => s.data.length));
  const ys = series.flatMap((s) => s.data.map((d) => d.y).filter((v) => v != null));
  if (!ys.length) return drawEmpty(ctx, W, H);
  const yMin = opts.yMin ?? Math.min(...ys);
  const yMax = opts.yMax ?? Math.max(...ys);
  const spanY = yMax - yMin || 1;
  const px = (i) => P.l + (n <= 1 ? 0 : (i / (n - 1)) * (W - P.l - P.r));
  const py = (v) => P.t + (1 - (v - yMin) / spanY) * (H - P.t - P.b);

  function draw(hi = -1) {
    ctx.clearRect(0, 0, W, H);
    ctx.font = FONT;
    // grid horizontal (3 líneas) + etiquetas y
    ctx.strokeStyle = GRID; ctx.fillStyle = INK3; ctx.lineWidth = 1;
    for (let g = 0; g <= 2; g++) {
      const v = yMin + (spanY * g) / 2;
      const y = py(v);
      ctx.beginPath(); ctx.moveTo(P.l, y); ctx.lineTo(W - P.r, y); ctx.stroke();
      ctx.fillText(fmtN(v), 2, y + 3);
    }
    // etiquetas x: primera, media, última
    const lbls = series[0].data;
    [0, Math.floor((n - 1) / 2), n - 1].forEach((i) => {
      if (!lbls[i]) return;
      ctx.fillStyle = INK3;
      const t = lbls[i].x;
      const w = ctx.measureText(t).width;
      ctx.fillText(t, Math.min(Math.max(px(i) - w / 2, 0), W - w), H - 6);
    });
    // series
    series.forEach((s) => {
      ctx.strokeStyle = s.color; ctx.lineWidth = 2; ctx.lineJoin = 'round';
      ctx.beginPath();
      let started = false;
      s.data.forEach((d, i) => {
        if (d.y == null) { started = false; return; }
        const x = px(i), y = py(d.y);
        if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
      });
      ctx.stroke();
      // último punto marcado
      const lastIdx = s.data.map((d) => d.y).lastIndexOf(s.data.filter((d) => d.y != null).at(-1)?.y);
      s.data.forEach((d, i) => {
        if (d.y == null) return;
        if (i === hi || i === lastIdx) {
          ctx.fillStyle = s.color;
          ctx.beginPath(); ctx.arc(px(i), py(d.y), i === hi ? 5 : 3.5, 0, 7); ctx.fill();
          ctx.strokeStyle = SURF; ctx.lineWidth = 2; ctx.stroke();
        }
      });
    });
    // tooltip
    if (hi >= 0) {
      const rows = series.filter((s) => s.data[hi]?.y != null)
        .map((s) => `${s.name}: ${fmtN(s.data[hi].y)}${opts.unit || ''}`);
      if (rows.length) tooltip(ctx, W, px(hi), 8, [series[0].data[hi].x, ...rows]);
    }
  }
  draw();
  bindHover(canvas, W, P, n, draw);
}

/* Barras verticales simples.
   items: [{ x, y, color? }] — un solo matiz salvo que se pase color por ítem. */
export function barChart(canvas, items, opts = {}) {
  const { ctx, W, H } = setup(canvas, opts.height || 170);
  const P = { l: 30, r: 8, t: 14, b: 22 };
  if (!items.length) return drawEmpty(ctx, W, H);
  const yMax = opts.yMax ?? Math.max(...items.map((d) => d.y), 1);
  const bw = Math.min(34, ((W - P.l - P.r) / items.length) * 0.62);
  const px = (i) => P.l + ((i + 0.5) / items.length) * (W - P.l - P.r);
  const py = (v) => P.t + (1 - v / yMax) * (H - P.t - P.b);

  function draw(hi = -1) {
    ctx.clearRect(0, 0, W, H);
    ctx.font = FONT;
    ctx.strokeStyle = GRID; ctx.fillStyle = INK3;
    [0, yMax / 2, yMax].forEach((v) => {
      const y = py(v);
      ctx.beginPath(); ctx.moveTo(P.l, y); ctx.lineTo(W - P.r, y); ctx.stroke();
      ctx.fillText(fmtN(v), 2, y + 3);
    });
    items.forEach((d, i) => {
      const x = px(i) - bw / 2, y = py(d.y), base = py(0);
      ctx.fillStyle = d.color || opts.color || '#D0702E';
      if (base - y > 1) {
        // extremo redondeado 4px anclado a la base
        roundTop(ctx, x, y, bw, base - y, 4);
        ctx.fill();
      }
      ctx.fillStyle = INK3;
      const lbl = String(d.x);
      const tw = ctx.measureText(lbl).width;
      ctx.fillText(lbl, px(i) - tw / 2, H - 6);
      if (i === hi) {
        ctx.fillStyle = INK;
        const v = fmtN(d.y) + (opts.unit || '');
        ctx.fillText(v, px(i) - ctx.measureText(v).width / 2, y - 5);
      }
    });
  }
  draw();
  bindHover(canvas, W, P, items.length, draw, true);
}

/* Barras horizontales por eje (para resultado ISE, máx 50). */
export function axisBars(el, byAxis, prev = null) {
  const rows = [
    ['Claridad', byAxis.claridad, prev?.claridad],
    ['Energía', byAxis.energia, prev?.energia],
    ['Foco', byAxis.foco, prev?.foco],
  ];
  el.innerHTML = '';
  rows.forEach(([name, v, old]) => {
    const row = document.createElement('div');
    row.className = 'axis-row';
    const delta = old != null ? v - old : null;
    const deltaTxt = delta == null ? '' :
      ` <span style="color:${delta >= 0 ? 'var(--good)' : 'var(--bad)'}">(${delta >= 0 ? '+' : ''}${delta})</span>`;
    row.innerHTML =
      `<span class="axis-name">${name}</span>` +
      `<div class="meter"><i style="width:${(v / 50) * 100}%"></i></div>` +
      `<span class="num">${v}/50${deltaTxt}</span>`;
    el.appendChild(row);
  });
}

/* ── helpers ────────────────────────────────────────────────── */

function roundTop(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h);
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
}

function tooltip(ctx, W, x, y, lines) {
  ctx.font = FONT;
  const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 16;
  const h = lines.length * 15 + 10;
  const tx = Math.min(Math.max(x - w / 2, 4), W - w - 4);
  ctx.fillStyle = 'rgba(24,12,16,0.92)';
  ctx.strokeStyle = 'rgba(244,233,215,0.22)';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(tx, y, w, h, 8); else ctx.rect(tx, y, w, h);
  ctx.fill(); ctx.stroke();
  lines.forEach((l, i) => {
    ctx.fillStyle = i === 0 ? INK3 : INK;
    ctx.fillText(l, tx + 8, y + 16 + i * 15);
  });
}

function bindHover(canvas, W, P, n, draw, bars = false) {
  const idxFor = (clientX) => {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const span = W - P.l - P.r;
    const rel = bars ? (x - P.l) / span * n - 0.5 : ((x - P.l) / span) * (n - 1);
    return Math.max(0, Math.min(n - 1, Math.round(rel)));
  };
  canvas.addEventListener('pointermove', (e) => draw(idxFor(e.clientX)));
  canvas.addEventListener('pointerdown', (e) => draw(idxFor(e.clientX)));
  canvas.addEventListener('pointerleave', () => draw(-1));
}

function drawEmpty(ctx, W, H) {
  ctx.font = FONT; ctx.fillStyle = INK3;
  const t = 'sin datos aún';
  ctx.fillText(t, (W - ctx.measureText(t).width) / 2, H / 2);
}

const fmtN = (v) => (Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 10) / 10).toString();
