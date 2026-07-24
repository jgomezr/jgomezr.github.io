// Programa — journey de 6 semanas con gating por fecha de inicio.

import { db } from './db.js';
import { h, esc, toast, todayStr, state, currentWeek } from './app.js';
import { PROGRAM } from './data-program.js';

export async function render(el) {
  if (!state.program?.startDate) {
    el.appendChild(h(`
      <div class="empty">
        <div class="display">Seis semanas. Ser → Hacer → Tener.</div>
        <p>Medir, ordenar, visibilizar, ejecutar, reforzar.<br>El programa se desbloquea semana a semana.</p>
      </div>`));
    const card = h(`
      <div class="card">
        <label class="field"><span>Fecha de inicio</span>
          <input type="date" id="p-start" value="${todayStr()}"></label>
        <button class="btn">Iniciar el programa</button>
        <p class="small muted" style="margin-top:10px">Consejo: empieza un lunes. Si hoy no lo es, pon la fecha del próximo.</p>
      </div>`);
    card.querySelector('.btn').addEventListener('click', async () => {
      state.program = { startDate: card.querySelector('#p-start').value || todayStr(), freeMode: false };
      await db.kvSet('program', state.program);
      toast('Programa iniciado', 'ok');
      location.reload();
    });
    el.appendChild(card);
    return;
  }

  const nowWk = currentWeek();
  const progress = await db.all('progress');
  const doneSet = new Set(progress.filter((p) => p.done).map((p) => p.id));

  // banda de semanas
  const band = h('<div class="week-band" role="tablist"></div>');
  let selected = Math.min(Math.max(nowWk, 1), 6);
  PROGRAM.forEach((w) => {
    const allDone = w.exercises.every((e) => doneSet.has(e.id));
    const locked = !state.program.freeMode && w.week > nowWk;
    const b = h(`<button class="wk ${w.week === nowWk ? 'now' : ''} ${allDone ? 'done' : ''} ${locked ? 'lock' : ''}"
      role="tab" aria-selected="${w.week === selected}">S${w.week}</button>`);
    b.addEventListener('click', () => { selected = w.week; paintWeek(); });
    band.appendChild(b);
  });
  el.appendChild(band);

  const wkBox = h('<div></div>');
  el.appendChild(wkBox);

  // pie: modo libre + progreso global
  const totalEx = PROGRAM.reduce((n, w) => n + w.exercises.length, 0);
  const foot = h(`
    <div class="card flat">
      <div class="row between small muted">
        <span>Progreso total: ${doneSet.size}/${totalEx} ejercicios</span>
        <button class="btn mini ghost" id="free-mode">${state.program.freeMode ? 'Volver al ritmo semanal' : 'Modo libre'}</button>
      </div>
    </div>`);
  foot.querySelector('#free-mode').addEventListener('click', async () => {
    state.program.freeMode = !state.program.freeMode;
    await db.kvSet('program', state.program);
    location.reload();
  });
  el.appendChild(foot);

  async function paintWeek() {
    band.querySelectorAll('.wk').forEach((b, i) => b.setAttribute('aria-selected', i + 1 === selected));
    const w = PROGRAM[selected - 1];
    const locked = !state.program.freeMode && w.week > nowWk;
    wkBox.innerHTML = '';

    wkBox.appendChild(h(`
      <div class="card">
        <span class="phase-tag">${esc(w.phase)}</span>
        <h2 class="display" style="margin:4px 0 6px">Semana ${w.week} · ${esc(w.title)}</h2>
        <p class="muted small">${esc(w.goal)}</p>
      </div>`));

    if (locked) {
      wkBox.appendChild(h(`<div class="empty"><div class="display">Todavía no</div>
        <p>Esta semana se desbloquea cuando llegue.<br>El orden es el método: primero se mide, después se poda.</p></div>`));
      return;
    }

    const exCard = h(`<div class="card"></div>`);
    w.exercises.forEach((ex) => {
      const done = doneSet.has(ex.id);
      const row = h(`
        <div class="check-item ${done ? 'done' : ''}" role="checkbox" aria-checked="${done}" tabindex="0">
          <div class="box">✓</div>
          <div class="check-text"><div>${esc(ex.t)}</div>
            <div class="small muted">${esc(ex.note)}</div></div>
        </div>`);
      const flip = async () => {
        const now = !row.classList.contains('done');
        row.classList.toggle('done', now);
        row.setAttribute('aria-checked', now);
        if (now) doneSet.add(ex.id); else doneSet.delete(ex.id);
        await db.put('progress', { id: ex.id, done: now, date: todayStr() });
      };
      row.addEventListener('click', flip);
      row.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); } });
      exCard.appendChild(row);
    });
    wkBox.appendChild(exCard);

    // entregable
    const saved = await db.get('deliverables', w.week);
    const dCard = h(`
      <div class="card">
        <span class="eyebrow">Entregable de la semana</span>
        <p class="small muted" style="margin:6px 0 10px">${esc(w.deliverable)}</p>
        <textarea id="deliv" placeholder="Escríbelo aquí…">${esc(saved?.text || '')}</textarea>
        <button class="btn mini gold" style="margin-top:10px">Guardar entregable</button>
      </div>`);
    dCard.querySelector('button').addEventListener('click', async () => {
      await db.put('deliverables', { week: w.week, text: dCard.querySelector('#deliv').value, date: todayStr() });
      toast('Entregable guardado', 'ok');
    });
    wkBox.appendChild(dCard);

    wkBox.appendChild(h(`<p class="small muted" style="padding:0 4px">Coach esta semana: ${esc(w.coachMode)}</p>`));
  }

  paintWeek();
}
