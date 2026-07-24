// Hoy — check-ins, hábitos del día, mensaje del coach, invocación.

import { db } from './db.js';
import { h, esc, scale5, toast, todayStr, state, currentWeek, openInvoke, refreshTopbar } from './app.js';
import { dailyMessage } from './coach-rules.js';
import { PROGRAM } from './data-program.js';

export async function render(el) {
  const today = todayStr();
  const [am, pm, ringToday] = await Promise.all([
    db.get('checkins', `${today}:am`),
    db.get('checkins', `${today}:pm`),
    db.get('ring', today),
  ]);

  // ── contexto del programa ──
  const wk = currentWeek();
  if (wk >= 1 && wk <= 6) {
    const w = PROGRAM[wk - 1];
    el.appendChild(h(`
      <a href="#/programa" style="text-decoration:none;color:inherit">
        <div class="card row between">
          <div><span class="phase-tag">${esc(w.phase)}</span>
            <div class="display" style="font-size:19px">Semana ${wk} · ${esc(w.title)}</div></div>
          <span class="muted">→</span>
        </div>
      </a>`));
  }

  // ── mensaje del coach ──
  const msg = await dailyMessage();
  if (msg) {
    const card = h(`
      <div class="card" style="border-color:rgba(232,131,58,0.35)">
        <div class="eyebrow" style="color:var(--ember);margin-bottom:6px">Tu coach</div>
        <p>${esc(msg.text)}</p>
        ${msg.action ? `<button class="btn mini gold" style="margin-top:10px">${esc(msg.action.label)}</button>` : ''}
      </div>`);
    if (msg.action) card.querySelector('button').addEventListener('click', msg.action.run);
    el.appendChild(card);
  }

  // ── check-in de mañana ──
  el.appendChild(checkinCard('am', am, ringToday));

  // ── hábitos de hoy ──
  const habits = (await db.all('habits')).filter((x) => x.active !== false);
  if (habits.length) {
    const logs = await Promise.all(habits.map((hb) => db.get('habit_logs', `${today}:${hb.id}`)));
    const card = h(`<div class="card"><div class="card-head"><span class="eyebrow">Hábitos ancla</span><a class="small" href="#/habitos">editar</a></div></div>`);
    habits.forEach((hb, i) => {
      const done = !!logs[i]?.done;
      const row = h(`
        <div class="check-item ${done ? 'done' : ''}" role="checkbox" aria-checked="${done}" tabindex="0">
          <div class="box">✓</div>
          <div class="check-text"><div>${esc(hb.name)}</div>
            <div class="small muted">${esc(hb.trigger)} → ${esc(hb.action)}</div></div>
        </div>`);
      const flip = async () => {
        const now = !row.classList.contains('done');
        row.classList.toggle('done', now);
        row.setAttribute('aria-checked', now);
        await db.put('habit_logs', { key: `${today}:${hb.id}`, date: today, habitId: hb.id, done: now });
      };
      row.addEventListener('click', flip);
      row.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); } });
      card.appendChild(row);
    });
    el.appendChild(card);
  }

  // ── check-in de noche ──
  el.appendChild(checkinCard('pm', pm));

  // ── invocar ──
  if (state.alterEgo) {
    const b = h(`<button class="btn ghost">◈ Invocar a ${esc(state.alterEgo.name)}</button>`);
    b.addEventListener('click', openInvoke);
    el.appendChild(b);
  }
}

/* Tarjeta de check-in (am = mañana, pm = noche) */
function checkinCard(kind, existing, ringToday = null) {
  const today = todayStr();
  const isAM = kind === 'am';
  const title = isAM ? 'Check-in de mañana' : 'Cierre del día';

  if (existing) {
    const lines = isAM
      ? [`Energía al despertar: ${existing.energia}/5`,
         existing.sleepH ? `Sueño: ${existing.sleepH} h` : null,
         existing.restingHR ? `FC reposo: ${existing.restingHR} lpm` : null,
         existing.task ? `LA tarea: ${existing.task}` : null]
      : [`Energía: ${existing.energia}/5`,
         `¿Avancé en lo importante?: ${existing.avance ? 'sí' : 'no'}`,
         existing.drop ? `Suelto: ${existing.drop}` : null,
         existing.task ? `Mañana: ${existing.task}` : null];
    const card = h(`
      <div class="card">
        <div class="card-head"><span class="eyebrow">${title}</span><span class="tag ok">hecho</span></div>
        ${lines.filter(Boolean).map((l) => `<p class="small muted">${esc(l)}</p>`).join('')}
        <button class="btn mini ghost" style="margin-top:8px">Editar</button>
      </div>`);
    card.querySelector('button').addEventListener('click', () => {
      card.replaceWith(formCard());
    });
    return card;
  }
  return formCard();

  function formCard() {
    const v = { energia: existing?.energia || 0 };
    const card = h(`<div class="card"><div class="card-head"><span class="eyebrow">${title}</span></div></div>`);

    card.appendChild(h(`<span class="small muted" style="display:block;margin-bottom:6px">${isAM ? '¿Con cuánta energía despiertas?' : '¿Cómo termina tu energía?'}</span>`));
    card.appendChild(scale5(v.energia, (x) => (v.energia = x)));

    if (isAM) {
      const pre = ringToday
        ? `<p class="small" style="color:var(--good);margin-top:8px">Anillo sincronizado: ${ringToday.sleepH ?? '—'} h de sueño${ringToday.restingHR ? `, FC ${ringToday.restingHR}` : ''}.</p>`
        : '';
      card.appendChild(h(`
        <div>${pre}
          <div class="grid2" style="margin-top:10px">
            <label class="field"><span>Horas de sueño</span>
              <input type="number" step="0.5" min="0" max="14" id="ci-sleep" value="${ringToday?.sleepH ?? ''}" placeholder="7"></label>
            <label class="field"><span>FC en reposo</span>
              <input type="number" min="30" max="120" id="ci-hr" value="${ringToday?.restingHR ?? ''}" placeholder="60"></label>
          </div>
          <label class="field"><span>LA tarea de hoy (una sola)</span>
            <input type="text" id="ci-task" value="${esc(existing?.task || '')}" placeholder="Lo único que haría que hoy valga"></label>
        </div>`));
    } else {
      const seg = h(`
        <div style="margin-top:10px">
          <span class="small muted" style="display:block;margin-bottom:6px">¿Avanzaste en lo importante?</span>
          <div class="seg">
            <button type="button" data-v="1">Sí</button>
            <button type="button" data-v="0">No</button>
          </div>
        </div>`);
      seg.querySelectorAll('.seg button').forEach((b) =>
        b.addEventListener('click', () => {
          seg.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', 'false'));
          b.setAttribute('aria-pressed', 'true');
          v.avance = b.dataset.v === '1';
        }));
      card.appendChild(seg);
      card.appendChild(h(`
        <div>
          <label class="field" style="margin-top:10px"><span>¿Qué sueltas de hoy?</span>
            <input type="text" id="ci-drop" placeholder="Lo que no salió y no vas a cargar"></label>
          <label class="field"><span>LA tarea de mañana</span>
            <input type="text" id="ci-task" placeholder="Decidida hoy, no mañana"></label>
          <label class="field"><span>Nota del día (opcional)</span>
            <textarea id="ci-note" placeholder="Qué drenó, qué recargó, qué observaste"></textarea></label>
        </div>`));
    }

    const save = h(`<button class="btn" style="margin-top:6px">Guardar ${isAM ? 'check-in' : 'cierre'}</button>`);
    save.addEventListener('click', async () => {
      if (!v.energia) { toast('Marca tu energía (1–5)', 'err'); return; }
      if (!isAM && v.avance === undefined) { toast('Responde si avanzaste en lo importante', 'err'); return; }
      const rec = { key: `${today}:${kind}`, date: today, type: kind, energia: v.energia };
      const g = (id) => card.querySelector(id)?.value.trim();
      if (isAM) {
        const sleep = parseFloat(g('#ci-sleep'));
        const hr = parseInt(g('#ci-hr'));
        rec.sleepH = Number.isFinite(sleep) ? sleep : null;   // 0 horas cuenta
        rec.restingHR = Number.isFinite(hr) ? hr : null;
        rec.task = g('#ci-task') || '';
      } else {
        rec.avance = v.avance;
        rec.drop = g('#ci-drop') || '';
        rec.task = g('#ci-task') || '';
        rec.note = g('#ci-note') || '';
      }
      await db.put('checkins', rec);
      toast(isAM ? 'Día abierto. A lo importante.' : 'Día cerrado. Lo de hoy ya fue.', 'ok');
      await refreshTopbar();
      location.reload();
    });
    card.appendChild(save);
    return card;
  }
}
