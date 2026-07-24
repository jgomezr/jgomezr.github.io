// Test ISE — cuestionario, resultado con arquetipo y comparativo histórico.

import { db } from './db.js';
import { h, esc, toast, todayStr } from './app.js';
import { QUESTIONS, AXES, scoreTest, ARCHETYPES, URGENCY } from './data-test.js';
import { axisBars } from './charts.js';

export async function render(el) {
  const tests = await db.all('tests');
  tests.sort((a, b) => a.date.localeCompare(b.date));

  if (!tests.length) {
    el.appendChild(h(`
      <div class="empty">
        <div class="display">Tu línea base</div>
        <p>30 preguntas, ~6 minutos. Sé brutalmente honesto:<br>el test no se aprueba, se usa.</p>
      </div>`));
    const start = h(`<button class="btn">Empezar el test</button>`);
    start.addEventListener('click', () => runTest(el));
    el.appendChild(start);
    el.appendChild(h(`<p class="small muted" style="margin-top:14px;text-align:center">¿Ya lo hiciste en papel? <a href="#" id="manual-entry">Registrar resultado manual</a></p>`));
    el.querySelector('#manual-entry').addEventListener('click', (e) => { e.preventDefault(); manualEntry(el); });
    return;
  }

  const last = tests.at(-1);
  const prev = tests.length > 1 ? tests.at(-2) : null;
  showResult(el, last, prev, tests);
}

/* ── cuestionario ───────────────────────────────────────────── */

function runTest(el) {
  el.innerHTML = '';
  const answers = new Array(QUESTIONS.length).fill(0);
  let i = 0;

  const prog = h(`<div class="q-progress"><div class="meter"><i style="width:0%"></i></div>
    <p class="small muted" style="margin-top:6px"><span id="q-n">1</span> / ${QUESTIONS.length}</p></div>`);
  const qCard = h(`<div class="card"></div>`);
  el.appendChild(prog);
  el.appendChild(qCard);

  const LABELS = ['Nunca', 'Rara vez', 'A veces', 'Casi siempre', 'Siempre'];

  function paint() {
    const q = QUESTIONS[i];
    const axis = AXES.find((a) => a.id === q.ax);
    prog.querySelector('i').style.width = `${(i / QUESTIONS.length) * 100}%`;
    prog.querySelector('#q-n').textContent = i + 1;
    qCard.innerHTML = '';
    qCard.appendChild(h(`<span class="phase-tag">${esc(axis.name)}</span>`));
    qCard.appendChild(h(`<h2 class="display" style="margin:8px 0 16px">${esc(q.t)}</h2>`));
    const opts = h('<div class="stack"></div>');
    LABELS.forEach((lbl, idx) => {
      const v = idx + 1;
      const b = h(`<button class="btn ghost" style="justify-content:flex-start" aria-pressed="${answers[i] === v}">
        <span class="num" style="color:var(--ink-3);width:14px">${v}</span> ${lbl}</button>`);
      if (answers[i] === v) b.style.borderColor = 'var(--ember)';
      b.addEventListener('click', () => {
        answers[i] = v;
        if (i < QUESTIONS.length - 1) { i++; paint(); } else finish();
      });
      opts.appendChild(b);
    });
    qCard.appendChild(opts);
    if (i > 0) {
      const back = h(`<button class="btn mini ghost" style="margin-top:12px">← Anterior</button>`);
      back.addEventListener('click', () => { i--; paint(); });
      qCard.appendChild(back);
    }
  }

  async function finish() {
    const r = scoreTest(answers);
    const rec = {
      date: new Date().toISOString(),
      answers,
      byAxis: r.byAxis,
      total: r.total,
      archetype: r.archetype.name,
      weakest: r.weakest,
    };
    await db.put('tests', rec);
    toast('Test guardado', 'ok');
    el.innerHTML = '';
    const tests = await db.all('tests');
    tests.sort((a, b) => a.date.localeCompare(b.date));
    showResult(el, tests.at(-1), tests.length > 1 ? tests.at(-2) : null, tests);
  }

  paint();
}

/* ── resultado ──────────────────────────────────────────────── */

function showResult(el, t, prev, all) {
  const arch = ARCHETYPES.find((a) => a.name === t.archetype) || ARCHETYPES[0];
  el.appendChild(h(`
    <div class="archetype-hero">
      <span class="eyebrow">Tu nivel</span>
      <div class="arc-name">${esc(t.archetype)}</div>
      <div class="arc-sub">${esc(arch.sub)}</div>
      <div class="arc-score">${t.total} / 150 ${deltaTag(t, prev)}</div>
    </div>`));

  const axCard = h(`<div class="card"><span class="eyebrow">Tu perfil por eje</span><div id="ax"></div></div>`);
  el.appendChild(axCard);
  axisBars(axCard.querySelector('#ax'), t.byAxis, prev?.byAxis || null);

  el.appendChild(h(`<div class="card"><p>${esc(arch.desc)}</p></div>`));

  el.appendChild(h(`<div class="card" style="border-color:rgba(217,164,65,0.4)">
      <span class="eyebrow" style="color:var(--gold)">Urgencia — eje crítico: ${esc(AXES.find((a) => a.id === t.weakest).name)}</span>
      <p style="margin-top:6px">${esc(URGENCY[t.weakest])}</p></div>`));

  if (all.length > 1) {
    const histCard = h(`<div class="card"><span class="eyebrow">Historial</span><div class="stack" style="margin-top:8px"></div></div>`);
    all.slice().reverse().forEach((x) => {
      histCard.querySelector('.stack').appendChild(h(
        `<div class="row between small">
          <span class="muted">${esc(x.date.slice(0, 10))}</span>
          <span>${esc(x.archetype)}</span>
          <span class="num">${x.total}/150</span>
        </div>`));
    });
    el.appendChild(histCard);
  }

  const retest = h(`<button class="btn ghost">Repetir el test</button>`);
  retest.addEventListener('click', () => runTest(el));
  el.appendChild(retest);
}

function deltaTag(t, prev) {
  if (!prev) return '';
  const d = t.total - prev.total;
  const col = d >= 0 ? 'var(--good)' : 'var(--bad)';
  return `<span style="color:${col}">· ${d >= 0 ? '+' : ''}${d} vs anterior</span>`;
}

/* ── registro manual (resultado hecho fuera de la app) ──────── */

function manualEntry(el) {
  el.innerHTML = '';
  const card = h(`
    <div class="card">
      <span class="eyebrow">Registrar resultado existente</span>
      <p class="small muted" style="margin:6px 0 12px">Del PDF de tu test original (17 jul 2026): Claridad 33, Energía 29, Foco 33.</p>
      <div class="grid2">
        <label class="field"><span>Claridad /50</span><input type="number" id="m-c" min="10" max="50" value="33"></label>
        <label class="field"><span>Energía /50</span><input type="number" id="m-e" min="10" max="50" value="29"></label>
      </div>
      <label class="field"><span>Foco /50</span><input type="number" id="m-f" min="10" max="50" value="33"></label>
      <label class="field"><span>Fecha del test</span><input type="date" id="m-d" value="2026-07-17"></label>
      <button class="btn">Guardar línea base</button>
    </div>`);
  card.querySelector('.btn').addEventListener('click', async () => {
    const c = +card.querySelector('#m-c').value, e = +card.querySelector('#m-e').value, f = +card.querySelector('#m-f').value;
    const total = c + e + f;
    const arch = ARCHETYPES.find((a) => total >= a.min && total <= a.max) || ARCHETYPES[0];
    const byAxis = { claridad: c, energia: e, foco: f };
    const weakest = Object.entries(byAxis).sort((a, b) => a[1] - b[1])[0][0];
    await db.put('tests', {
      date: (card.querySelector('#m-d').value || todayStr()) + 'T12:00:00.000Z',
      answers: null, byAxis, total, archetype: arch.name, weakest,
    });
    toast('Línea base registrada', 'ok');
    location.hash = '#/test';
    location.reload();
  });
  el.appendChild(card);
}
