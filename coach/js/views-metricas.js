// Métricas — energía, sueño, hábitos, foco, evolución ISE.

import { db } from './db.js';
import { h, esc, todayStr, addDays } from './app.js';
import { lineChart, barChart, axisBars } from './charts.js';
import { dayOf } from './coach-rules.js';

const C = { ember: '#D0702E', teal: '#2E9E8F', gold: '#B8862B', lav: '#9B6FD0' };

export async function render(el) {
  const [checkins, ring, habits, habitLogs, focus, tests, invocations] = await Promise.all([
    db.all('checkins'), db.all('ring'), db.all('habits'),
    db.all('habit_logs'), db.all('focus'), db.all('tests'), db.all('invocations'),
  ]);

  const days = lastNDays(14);
  const byDay = indexBy(checkins, (c) => c.key);

  // ── tiles resumen ──
  const week = lastNDays(7);
  const weekPM = week.map((d) => byDay[`${d}:pm`]).filter(Boolean);
  const weekAM = week.map((d) => byDay[`${d}:am`]).filter(Boolean);
  const sleepVals = week.map((d) => byDay[`${d}:am`]?.sleepH ?? ringByDate(ring, d)?.sleepH).filter((v) => v != null);
  const focusWeek = focus.filter((f) => week.includes(f.date) && f.done).length;
  const avanceRate = weekPM.length ? Math.round((weekPM.filter((c) => c.avance).length / weekPM.length) * 100) : null;

  el.appendChild(h(`
    <div class="card"><div class="grid2">
      <div class="stat-tile"><div class="val">${avg(weekAM.map((c) => c.energia)) ?? '—'}</div><div class="lbl">Energía am · 7d</div></div>
      <div class="stat-tile"><div class="val">${avg(sleepVals) ?? '—'}<span class="small muted"> h</span></div><div class="lbl">Sueño · 7d</div></div>
      <div class="stat-tile"><div class="val">${focusWeek}</div><div class="lbl">Bloques foco · 7d</div></div>
      <div class="stat-tile"><div class="val">${avanceRate == null ? '—' : avanceRate + '%'}</div><div class="lbl">Días con avance</div></div>
    </div></div>`));

  // ── energía am/pm 14 días ──
  const cardE = chartCard(el, 'Energía (mañana y noche)', [
    ['Mañana', C.ember], ['Noche', C.teal],
  ]);
  lineChart(cardE, [
    { name: 'Mañana', color: C.ember, data: days.map((d) => ({ x: dd(d), y: byDay[`${d}:am`]?.energia ?? null })) },
    { name: 'Noche', color: C.teal, data: days.map((d) => ({ x: dd(d), y: byDay[`${d}:pm`]?.energia ?? null })) },
  ], { yMin: 1, yMax: 5 });

  // ── sueño 14 días (check-in manual o anillo) ──
  const cardS = chartCard(el, 'Horas de sueño', null);
  barChart(cardS, days.map((d) => ({
    x: dd(d),
    y: byDay[`${d}:am`]?.sleepH ?? ringByDate(ring, d)?.sleepH ?? 0,
  })), { color: C.lav, yMax: 10, unit: ' h' });

  // ── hábitos: adherencia 7 días ──
  const active = habits.filter((x) => x.active !== false);
  if (active.length) {
    const logIdx = indexBy(habitLogs, (l) => l.key);
    const cardH = chartCard(el, 'Hábitos ancla · últimos 7 días', null);
    barChart(cardH, active.map((hb) => ({
      x: hb.name.slice(0, 8),
      y: week.filter((d) => logIdx[`${d}:${hb.id}`]?.done).length,
    })), { color: C.gold, yMax: 7, unit: '/7' });
  }

  // ── evolución ISE ──
  if (tests.length) {
    tests.sort((a, b) => a.date.localeCompare(b.date));
    const last = tests.at(-1), first = tests[0];
    const cardI = h(`<div class="card"><div class="card-head"><span class="eyebrow">Evolución ISE</span>
      <a class="small" href="#/test">ver test</a></div><div id="ax"></div>
      ${tests.length > 1 ? `<p class="small muted" style="margin-top:8px">Comparando con tu línea base (${esc(first.date.slice(0, 10))}).</p>` : ''}</div>`);
    el.appendChild(cardI);
    axisBars(cardI.querySelector('#ax'), last.byAxis, tests.length > 1 ? first.byAxis : null);
  }

  // ── invocaciones ──
  if (invocations.length) {
    const recent = invocations.slice(-5).reverse();
    const cardV = h(`<div class="card"><span class="eyebrow">Invocaciones del alter ego</span>
      <p class="small muted" style="margin:4px 0 8px">${invocations.length} en total</p><div class="stack"></div></div>`);
    recent.forEach((v) => cardV.querySelector('.stack').appendChild(
      h(`<div class="row between small"><span class="muted">${esc(dayOf(v).slice(5))}</span>
        <span style="flex:1;margin-left:10px">${esc(v.context || '—')}</span></div>`)));
    el.appendChild(cardV);
  }

  if (!checkins.length && !tests.length) {
    el.appendChild(h(`<div class="empty"><div class="display">Sin datos todavía</div>
      <p>Haz tu primer check-in en Hoy y el test ISE.<br>Aquí se verá todo lo que midas.</p></div>`));
  }
}

/* helpers */
function chartCard(el, title, legend) {
  const card = h(`<div class="card"><span class="eyebrow">${esc(title)}</span>
    <canvas class="chart" style="margin-top:10px"></canvas>
    ${legend ? `<div class="legend">${legend.map(([n, c]) => `<span><i style="background:${c}"></i>${esc(n)}</span>`).join('')}</div>` : ''}
  </div>`);
  el.appendChild(card);
  return card.querySelector('canvas');
}

const dd = (dateStr) => dateStr.slice(8, 10) + '/' + dateStr.slice(5, 7);

function lastNDays(n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) out.push(addDays(todayStr(), -i));
  return out;
}
function indexBy(arr, fn) {
  const o = {};
  arr.forEach((x) => (o[fn(x)] = x));
  return o;
}
function ringByDate(ring, d) { return ring.find((r) => r.date === d); }
function avg(vals) {
  if (!vals.length) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}
