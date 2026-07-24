// Brasa — arranque, router y utilidades de UI compartidas.

import { db } from './db.js';

/* ── utilidades DOM ─────────────────────────────────────────── */

export const $ = (sel, root = document) => root.querySelector(sel);

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// h`...` — crea un elemento desde un template string
export function h(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export function toast(msg, kind = '') {
  const el = h(`<div class="toast ${kind}">${esc(msg)}</div>`);
  $('#toast-root').appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

export function sheet(contentEl) {
  const back = h(`<div class="sheet-back"><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div></div></div>`);
  back.querySelector('.sheet').appendChild(contentEl);
  back.addEventListener('click', (e) => { if (e.target === back) back.remove(); });
  $('#overlay-root').appendChild(back);
  return { close: () => back.remove() };
}

// selector 1–5 accesible; onPick(valor)
export function scale5(current, onPick) {
  const wrap = h('<div class="scale5" role="group"></div>');
  for (let v = 1; v <= 5; v++) {
    const b = h(`<button type="button" aria-pressed="${v === current}">${v}</button>`);
    b.addEventListener('click', () => {
      wrap.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', 'true');
      onPick(v);
    });
    wrap.appendChild(b);
  }
  return wrap;
}

/* ── fechas ─────────────────────────────────────────────────── */

export const todayStr = (d = new Date()) => {
  const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};
export const addDays = (dateStr, n) => {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return todayStr(d);
};
export const fmtLong = (d = new Date()) =>
  d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });

/* ── estado compartido ──────────────────────────────────────── */

export const state = { settings: null, alterEgo: null, program: null };

export async function loadState() {
  state.settings = (await db.kvGet('settings')) || { name: 'Julián', aiMode: 'rules', apiKey: '', reminders: true };
  state.alterEgo = (await db.kvGet('alterEgo')) || null;
  state.program = (await db.kvGet('program')) || null;
}

export async function saveSettings() { await db.kvSet('settings', state.settings); }

// Semana actual del programa (1–6), 0 = no iniciado, 7 = terminado
export function currentWeek() {
  if (!state.program?.startDate) return 0;
  const days = Math.floor((new Date(todayStr() + 'T12:00:00') - new Date(state.program.startDate + 'T12:00:00')) / 86400000);
  if (days < 0) return 0;
  return Math.min(Math.floor(days / 7) + 1, 7);
}

export async function streak() {
  const all = await db.all('checkins');
  const days = new Set(all.map((c) => c.date));
  let n = 0;
  let d = todayStr();
  if (!days.has(d)) d = addDays(d, -1); // hoy aún no cuenta en contra
  while (days.has(d)) { n++; d = addDays(d, -1); }
  return n;
}

/* ── router ─────────────────────────────────────────────────── */

const ROUTES = {
  hoy:        { title: 'Hoy',        mod: './views-hoy.js',      tab: 'hoy' },
  coach:      { title: 'Coach',      mod: './views-coach.js',    tab: 'coach' },
  programa:   { title: 'Programa',   mod: './views-programa.js', tab: 'programa' },
  metricas:   { title: 'Métricas',   mod: './views-metricas.js', tab: 'metricas' },
  test:       { title: 'Test ISE',   mod: './views-test.js',     tab: 'metricas' },
  mas:        { title: 'Más',        mod: './views-mas.js',      tab: 'mas', fn: 'renderMenu' },
  alterego:   { title: 'Alter ego',  mod: './views-mas.js',      tab: 'mas', fn: 'renderAlterEgo' },
  saboteadores:{ title: 'Saboteadores', mod: './views-mas.js',   tab: 'mas', fn: 'renderSaboteurs' },
  habitos:    { title: 'Hábitos',    mod: './views-mas.js',      tab: 'mas', fn: 'renderHabits' },
  foco:       { title: 'Foco',       mod: './views-mas.js',      tab: 'mas', fn: 'renderFocus' },
  anillo:     { title: 'Anillo',     mod: './views-mas.js',      tab: 'mas', fn: 'renderRing' },
  ajustes:    { title: 'Ajustes',    mod: './views-mas.js',      tab: 'mas', fn: 'renderSettings' },
};

export function navigate(route) { location.hash = '#/' + route; }

let navSeq = 0;

async function route() {
  const seq = ++navSeq;
  const name = (location.hash || '#/hoy').replace(/^#\//, '').split('?')[0] || 'hoy';
  const r = ROUTES[name] || ROUTES.hoy;
  const view = $('#view');
  try {
    const m = await import(r.mod);
    if (seq !== navSeq) return; // llegó una navegación más nueva mientras cargaba
    $('#top-title').textContent = r.title;
    document.querySelectorAll('.tabbar a').forEach((a) =>
      a.classList.toggle('active', a.dataset.tab === r.tab));
    view.innerHTML = '';
    await m[r.fn || 'render'](view);
    if (seq !== navSeq) return;
  } catch (err) {
    if (seq !== navSeq) return;
    console.error(err);
    view.innerHTML = '';
    view.appendChild(h(`<div class="empty"><div class="display">Algo falló al cargar esta pantalla</div><p class="small">${esc(err.message)}</p></div>`));
  }
  view.focus({ preventScroll: true });
  refreshTopbar();
}

export async function refreshTopbar() {
  $('#top-date').textContent = fmtLong();
  $('#chip-streak').textContent = `🔥 ${await streak()}`;
  $('#chip-invoke').hidden = !state.alterEgo;
}

/* ── pantalla Invocar (accesible desde cualquier lugar) ─────── */

export async function openInvoke() {
  const ego = state.alterEgo;
  if (!ego) { navigate('alterego'); return; }
  const ov = h(`
    <div class="invoke-overlay" role="dialog" aria-modal="true" aria-label="Invocar alter ego">
      <div class="invoke-ember" aria-hidden="true"></div>
      <div class="invoke-phrase">${esc(ego.phrase || ego.name)}</div>
      <div class="invoke-traits">${(ego.traits || []).map((t) => `<b>${esc(t)}</b>`).join(' · ')}</div>
      <div class="invoke-q">¿Qué haría ${esc(ego.name)} ahora mismo?</div>
      <label class="field" style="width:100%"><span>¿Qué está pasando? (opcional)</span>
        <input type="text" id="inv-ctx" placeholder="Situación en 5 palabras"></label>
      <div class="grid2" style="width:100%">
        <button class="btn ghost" id="inv-close">Cerrar</button>
        <button class="btn" id="inv-save">Invocado</button>
      </div>
    </div>`);
  ov.querySelector('#inv-close').addEventListener('click', () => ov.remove());
  ov.querySelector('#inv-save').addEventListener('click', async () => {
    await db.put('invocations', {
      date: new Date().toISOString(),
      day: todayStr(),
      context: ov.querySelector('#inv-ctx').value.trim(),
    });
    ov.remove();
    toast(`${ego.name} está aquí. Actúa como él.`, 'ok');
  });
  $('#overlay-root').appendChild(ov);
}

/* ── init ───────────────────────────────────────────────────── */

async function init() {
  await loadState();
  $('#chip-invoke').addEventListener('click', openInvoke);
  window.addEventListener('hashchange', route);
  await route();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

init();
