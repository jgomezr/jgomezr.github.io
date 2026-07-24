// Más — alter ego, saboteadores, hábitos, foco, anillo, ajustes.

import { db, exportAll, importAll } from './db.js';
import { h, esc, toast, scale5, todayStr, state, saveSettings, openInvoke } from './app.js';
import { SABOTEURS } from './data-test.js';
import { dayOf } from './coach-rules.js';
import { SUGGESTED_HABITS } from './data-program.js';
import * as Ring from './ring.js';
import { LOCAL_MODEL } from './coach-ai.js';

/* ── menú ───────────────────────────────────────────────────── */

export async function renderMenu(el) {
  const items = [
    ['alterego', '◈ Alter ego', state.alterEgo ? state.alterEgo.name : 'crear en semana 4'],
    ['saboteadores', '☁ Saboteadores', 'registro y reencuadre'],
    ['habitos', '⟳ Hábitos ancla', 'if-then'],
    ['foco', '◎ Bloques de foco', '90 minutos'],
    ['anillo', '⬡ Anillo', 'sincronizar TK5'],
    ['ajustes', '⚙ Ajustes', 'IA, datos, respaldo'],
  ];
  const card = h('<div class="card"></div>');
  items.forEach(([route, label, hint]) => {
    const row = h(`<a href="#/${route}" style="text-decoration:none;color:inherit">
      <div class="check-item"><div style="flex:1">${esc(label)}</div>
      <span class="small muted">${esc(hint)}</span></div></a>`);
    card.appendChild(row);
  });
  el.appendChild(card);
}

/* ── alter ego ──────────────────────────────────────────────── */

export async function renderAlterEgo(el) {
  const ego = state.alterEgo;

  if (ego) {
    el.appendChild(h(`
      <div class="archetype-hero">
        <span class="eyebrow">Tu alter ego</span>
        <div class="arc-name">${esc(ego.name)}</div>
        <div class="arc-sub">${(ego.traits || []).map(esc).join(' · ')}</div>
      </div>`));
    el.appendChild(h(`
      <div class="card stack">
        <p><span class="muted small">Frase de invocación</span><br><em class="display" style="font-size:18px">${esc(ego.phrase)}</em></p>
        <p><span class="muted small">Cómo decide</span><br>${esc(ego.decides)}</p>
        <p><span class="muted small">Qué protege / qué suelta</span><br>${esc(ego.protects)}</p>
        <p><span class="muted small">Tótem físico</span><br>${esc(ego.totem)}</p>
      </div>`));
    const inv = h(`<button class="btn">◈ Invocar ahora</button>`);
    inv.addEventListener('click', openInvoke);
    el.appendChild(inv);

    const invocations = await db.all('invocations');
    if (invocations.length) {
      const card = h(`<div class="card"><span class="eyebrow">Registro de invocaciones (${invocations.length})</span><div class="stack" style="margin-top:8px"></div></div>`);
      invocations.slice(-8).reverse().forEach((v) =>
        card.querySelector('.stack').appendChild(h(
          `<div class="row between small"><span class="muted">${esc(dayOf(v).slice(5))}</span>
           <span style="flex:1;margin-left:10px">${esc(v.context || '—')}</span></div>`)));
      el.appendChild(card);
    }
    const edit = h(`<button class="btn ghost" style="margin-top:10px">Editar alter ego</button>`);
    edit.addEventListener('click', () => { el.innerHTML = ''; egoForm(el, ego); });
    el.appendChild(edit);
    return;
  }

  el.appendChild(h(`
    <div class="empty">
      <div class="display">La dosis máxima de distancia</div>
      <p>Encarnar un personaje supera a la tercera persona, y esta a la primera ("efecto Batman").<br>No es un disfraz: es un puente hacia tu identidad real.</p>
    </div>`));
  egoForm(el, null);
}

function egoForm(el, ego) {
  const f = h(`
    <div class="card">
      <label class="field"><span>Nombre propio (distinto de tu arquetipo)</span>
        <input type="text" id="e-name" value="${esc(ego?.name || '')}" placeholder="El nombre de tu versión bajo presión"></label>
      <label class="field"><span>3 rasgos (separados por coma)</span>
        <input type="text" id="e-traits" value="${esc(ego?.traits?.join(', ') || '')}" placeholder="sereno, decisivo, protege su energía"></label>
      <label class="field"><span>¿Cómo decide?</span>
        <input type="text" id="e-decides" value="${esc(ego?.decides || '')}" placeholder="Rápido y con datos; suelta lo que no es suyo"></label>
      <label class="field"><span>¿Qué protege y qué suelta?</span>
        <input type="text" id="e-protects" value="${esc(ego?.protects || '')}" placeholder="Protege sueño y foco; suelta la aprobación ajena"></label>
      <label class="field"><span>Frase de invocación</span>
        <input type="text" id="e-phrase" value="${esc(ego?.phrase || '')}" placeholder="Corta, en presente, tuya"></label>
      <label class="field"><span>Tótem físico</span>
        <input type="text" id="e-totem" value="${esc(ego?.totem || 'Girar el anillo en el dedo')}"></label>
      <button class="btn">Guardar alter ego</button>
    </div>`);
  f.querySelector('.btn').addEventListener('click', async () => {
    const g = (id) => f.querySelector(id).value.trim();
    if (!g('#e-name') || !g('#e-phrase')) { toast('Nombre y frase son el mínimo', 'err'); return; }
    state.alterEgo = {
      name: g('#e-name'),
      traits: g('#e-traits').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 3),
      decides: g('#e-decides'), protects: g('#e-protects'),
      phrase: g('#e-phrase'), totem: g('#e-totem'),
    };
    await db.kvSet('alterEgo', state.alterEgo);
    toast(`${state.alterEgo.name} existe. Invócalo cuando lo necesites.`, 'ok');
    location.reload();
  });
  el.appendChild(f);
}

/* ── saboteadores ───────────────────────────────────────────── */

export async function renderSaboteurs(el) {
  const sel = { saboteur: null };
  const form = h(`
    <div class="card">
      <span class="eyebrow">Registrar pensamiento</span>
      <label class="field" style="margin-top:8px"><span>¿Qué te dijiste? (literal)</span>
        <input type="text" id="s-phrase" placeholder="«No es suficiente…»"></label>
      <label class="field"><span>Situación</span>
        <input type="text" id="s-sit" placeholder="Revisando el entregable por 4ª vez"></label>
      <span class="small muted" style="display:block;margin-bottom:6px">¿Quién habla? (defusión: nómbralo tú)</span>
      <div class="seg" id="s-seg"></div>
      <label class="field" style="margin-top:12px"><span>Reencuadre del mentor justo (opcional)</span>
        <textarea id="s-ref" placeholder="Mismos hechos, sin castigo"></textarea></label>
      <button class="btn">Guardar registro</button>
    </div>`);
  const seg = form.querySelector('#s-seg');
  SABOTEURS.forEach((s) => {
    const b = h(`<button type="button" title="${esc(s.hint)}">${esc(s.name)}</button>`);
    b.addEventListener('click', () => {
      seg.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', 'true');
      sel.saboteur = s.id;
    });
    seg.appendChild(b);
  });
  form.querySelector('.btn').addEventListener('click', async () => {
    const g = (id) => form.querySelector(id).value.trim();
    if (!g('#s-phrase') || !sel.saboteur) { toast('Frase + saboteador, mínimo', 'err'); return; }
    await db.put('thoughts', {
      date: new Date().toISOString(),
      day: todayStr(),
      phrase: g('#s-phrase'), situation: g('#s-sit'),
      saboteur: sel.saboteur, reframe: g('#s-ref'),
    });
    toast('Nombrado. Ya perdió fuerza.', 'ok');
    location.reload();
  });
  el.appendChild(form);

  const thoughts = await db.all('thoughts');
  if (thoughts.length) {
    // conteo por saboteador
    const counts = {};
    thoughts.forEach((t) => (counts[t.saboteur] = (counts[t.saboteur] || 0) + 1));
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const stat = h(`<div class="card"><span class="eyebrow">Tu patrón (${thoughts.length} registros)</span><div style="margin-top:8px"></div></div>`);
    top.forEach(([id, n]) => {
      const s = SABOTEURS.find((x) => x.id === id);
      stat.querySelector('div').appendChild(h(
        `<div class="axis-row"><span class="axis-name">${esc(s?.name || id)}</span>
         <div class="meter"><i style="width:${(n / thoughts.length) * 100}%"></i></div>
         <span class="num">${n}</span></div>`));
    });
    el.appendChild(stat);

    const list = h(`<div class="card"><span class="eyebrow">Recientes</span><div class="stack" style="margin-top:8px"></div></div>`);
    thoughts.slice(-6).reverse().forEach((t) => {
      list.querySelector('.stack').appendChild(h(
        `<div><div class="small"><span class="tag">${esc(SABOTEURS.find((x) => x.id === t.saboteur)?.name || t.saboteur)}</span>
          <span class="muted"> ${esc(dayOf(t).slice(5))}</span></div>
         <div style="margin-top:4px">"${esc(t.phrase)}"</div>
         ${t.reframe ? `<div class="small" style="color:var(--good);margin-top:2px">↪ ${esc(t.reframe)}</div>` : ''}</div>`));
    });
    el.appendChild(list);
  }
}

/* ── hábitos ────────────────────────────────────────────────── */

export async function renderHabits(el) {
  const habits = await db.all('habits');
  const card = h(`<div class="card"><span class="eyebrow">Hábitos ancla (formato if-then)</span>
    <p class="small muted" style="margin:6px 0 4px">Máximo 3 — tu perfeccionista quiere 10; no se los des.</p><div id="hlist"></div></div>`);
  const list = card.querySelector('#hlist');
  habits.filter((x) => x.active !== false).forEach((hb) => {
    const row = h(`<div class="check-item"><div style="flex:1">
        <div>${esc(hb.name)}</div>
        <div class="small muted">Cuando ${esc(hb.trigger)} → ${esc(hb.action)}</div></div>
      <button class="btn mini danger">Quitar</button></div>`);
    row.querySelector('button').addEventListener('click', async () => {
      await db.put('habits', { ...hb, active: false });
      location.reload();
    });
    list.appendChild(row);
  });
  el.appendChild(card);

  const form = h(`
    <div class="card">
      <span class="eyebrow">Nuevo hábito</span>
      <label class="field" style="margin-top:8px"><span>Nombre</span><input type="text" id="h-name"></label>
      <label class="field"><span>Disparador — "Cuando…"</span><input type="text" id="h-trig" placeholder="termine mi última reunión"></label>
      <label class="field"><span>Acción mínima — "…entonces yo"</span><input type="text" id="h-act" placeholder="apago el computador"></label>
      <button class="btn">Agregar</button>
    </div>`);
  form.querySelector('.btn').addEventListener('click', async () => {
    const g = (id) => form.querySelector(id).value.trim();
    if (!g('#h-name') || !g('#h-trig') || !g('#h-act')) { toast('Completa las 3 partes del if-then', 'err'); return; }
    await db.put('habits', { name: g('#h-name'), trigger: g('#h-trig'), action: g('#h-act'), active: true, createdAt: todayStr() });
    toast('Hábito anclado', 'ok');
    location.reload();
  });
  el.appendChild(form);

  // sugerencias por eje crítico (del test más reciente por fecha, no por inserción)
  const tests = (await db.all('tests')).sort((a, b) => a.date.localeCompare(b.date));
  const weakest = tests.at(-1)?.weakest || 'energia';
  const sug = SUGGESTED_HABITS[weakest] || [];
  if (sug.length) {
    const s = h(`<div class="card flat"><span class="eyebrow">Sugeridos para tu eje crítico (${esc(weakest)})</span><div class="stack" style="margin-top:8px"></div></div>`);
    sug.forEach((x) => {
      const b = h(`<button class="btn mini ghost" style="width:100%;justify-content:flex-start;text-align:left">+ ${esc(x.name)}: ${esc(x.trigger.toLowerCase())} → ${esc(x.action)}</button>`);
      b.addEventListener('click', async () => {
        await db.put('habits', { ...x, active: true, createdAt: todayStr() });
        toast('Agregado', 'ok');
        location.reload();
      });
      s.querySelector('.stack').appendChild(b);
    });
    el.appendChild(s);
  }
}

/* ── foco ───────────────────────────────────────────────────── */

// Estado a nivel de módulo: solo datos (endAt, minutes). El interval se re-crea
// en cada render y se ancla al DOM vigente, así el timer sobrevive la navegación.
let focusState = null;   // { endAt, minutes } | null
let focusInterval = null;

export async function renderFocus(el) {
  const focus = await db.all('focus');
  const week = focus.filter((f) => f.done && f.date >= mondayOfWeek()).length;
  const running = focusState && focusState.endAt > Date.now();

  const clock = h(`
    <div class="card">
      <div class="focus-clock">
        <div class="time num" id="f-time">${running ? '' : '90:00'}</div>
        <div class="sub">bloque profundo · celular en otra habitación</div>
      </div>
      <div class="grid2" style="margin-top:14px">
        <button class="btn ghost" id="f-25" ${running ? 'disabled' : ''}>25 min</button>
        <button class="btn" id="f-90" ${running ? 'disabled' : ''}>90 min</button>
      </div>
      <button class="btn danger" id="f-stop" ${running ? '' : 'hidden'} style="margin-top:10px">Abandonar bloque</button>
      <p class="small muted" style="margin-top:12px;text-align:center">Esta semana (desde el lunes): <b>${week}</b> bloques${week >= 5 ? ' — meta cumplida ✓' : ' (meta S5: 5)'}</p>
    </div>`);
  el.appendChild(clock);

  const timeEl = clock.querySelector('#f-time');
  const stopBtn = clock.querySelector('#f-stop');
  const rerender = () => window.dispatchEvent(new HashChangeEvent('hashchange'));

  function attachTicker() {
    if (focusInterval) clearInterval(focusInterval);
    focusInterval = setInterval(async () => {
      if (!focusState) { clearInterval(focusInterval); focusInterval = null; return; }
      const left = Math.ceil((focusState.endAt - Date.now()) / 1000);
      if (left <= 0) {
        const { minutes } = focusState;
        focusState = null;
        clearInterval(focusInterval); focusInterval = null;
        await db.put('focus', { date: todayStr(), minutes, done: true });
        toast('Bloque completado. Ahora: pausa real de 5 minutos, sin pantalla.', 'ok');
        if (Notification?.permission === 'granted') new Notification('Brasa', { body: 'Bloque de foco completado.' });
        if (timeEl.isConnected) rerender();
        return;
      }
      if (timeEl.isConnected) {
        timeEl.textContent = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
      }
    }, 500);
  }

  function start(minutes) {
    if (focusState) return;
    focusState = { endAt: Date.now() + minutes * 60000, minutes };
    clock.querySelector('#f-25').disabled = true;
    clock.querySelector('#f-90').disabled = true;
    stopBtn.hidden = false;
    attachTicker();
  }

  clock.querySelector('#f-25').addEventListener('click', () => start(25));
  clock.querySelector('#f-90').addEventListener('click', () => start(90));
  stopBtn.addEventListener('click', () => {
    focusState = null;
    if (focusInterval) { clearInterval(focusInterval); focusInterval = null; }
    toast('Bloque abandonado. Sin culpa: registra qué te sacó.', '');
    rerender();
  });

  if (running) attachTicker(); // volver a la vista con timer activo: re-anclar al DOM nuevo
}

function mondayOfWeek() {
  const d = new Date(todayStr() + 'T12:00:00');
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

/* ── anillo ─────────────────────────────────────────────────── */

export async function renderRing(el) {
  const today = await db.get('ring', todayStr());
  const card = h(`
    <div class="card">
      <div class="card-head"><span class="eyebrow">R11M / TK5 · Web Bluetooth</span>
        <span class="tag" id="r-state">${Ring.ring.connected ? 'conectado' : 'sin conexión'}</span></div>
      ${today ? `<p class="small muted">Hoy: batería ${today.battery ?? '—'}%${today.steps != null ? ` · ${today.steps} pasos` : ''}${today.sleepH != null ? ` · ${today.sleepH} h sueño` : ''}</p>` : ''}
      <div class="stack" style="margin-top:8px">
        <button class="btn" id="r-connect">${Ring.ring.connected ? 'Sincronizar ahora' : 'Conectar y sincronizar'}</button>
        <div class="grid2">
          <button class="btn mini ghost" id="r-hr">Medir FC (30 s)</button>
          <button class="btn mini ghost" id="r-blink" ${Ring.ring.connected ? '' : 'disabled'}>Parpadear anillo</button>
        </div>
      </div>
      <p class="small muted" style="margin-top:10px">La app oficial no debe estar conectada al mismo tiempo (el anillo acepta una sola conexión). Si algo no responde, la consola de abajo muestra los paquetes crudos para ajustar el protocolo.</p>
    </div>`);
  el.appendChild(card);

  const consoleCard = h(`<div class="card"><span class="eyebrow">Consola BLE</span><div class="ble-log" id="r-log" style="margin-top:8px">—</div></div>`);
  el.appendChild(consoleCard);
  const logEl = consoleCard.querySelector('#r-log');
  Ring.ring.onLog = (line) => {
    if (logEl.textContent === '—') logEl.textContent = '';
    logEl.textContent += line + '\n';
    logEl.scrollTop = logEl.scrollHeight;
  };

  const status = (msg) => { card.querySelector('#r-state').textContent = msg; };

  card.querySelector('#r-connect').addEventListener('click', async () => {
    try {
      if (!Ring.ring.connected) { status('conectando…'); await Ring.connect(); }
      status('sincronizando…');
      await Ring.syncToday(status);
      toast('Anillo sincronizado', 'ok');
      status('conectado');
    } catch (err) { status('error'); toast(err.message, 'err'); }
  });
  card.querySelector('#r-hr').addEventListener('click', async () => {
    try {
      if (!Ring.ring.connected) await Ring.connect();
      status('midiendo FC…');
      const bpm = await Ring.readHeartRateLive((v) => status(`FC: ${v}`));
      if (bpm) {
        const rec = (await db.get('ring', todayStr())) || { date: todayStr() };
        await db.put('ring', { ...rec, restingHR: bpm });
        toast(`FC registrada: ${bpm} lpm`, 'ok');
      } else toast('El sensor no reportó valor (¿anillo puesto?)', 'err');
      status('conectado');
    } catch (err) { status('error'); toast(err.message, 'err'); }
  });
  card.querySelector('#r-blink').addEventListener('click', () => Ring.blink().catch((e) => toast(e.message, 'err')));
}

/* ── ajustes ────────────────────────────────────────────────── */

export async function renderSettings(el) {
  const s = state.settings;
  const card = h(`
    <div class="card">
      <span class="eyebrow">Coach IA</span>
      <div class="seg" style="margin:10px 0" id="ai-seg">
        <button type="button" data-v="rules" aria-pressed="${s.aiMode === 'rules'}">Sin modelo (reglas)</button>
        <button type="button" data-v="claude" aria-pressed="${s.aiMode === 'claude'}">Claude API</button>
        <button type="button" data-v="local" aria-pressed="${s.aiMode === 'local'}">Modelo local</button>
      </div>
      <div id="ai-claude" ${s.aiMode === 'claude' ? '' : 'hidden'}>
        <label class="field"><span>Clave de API (se guarda solo en este dispositivo)</span>
          <input type="password" id="a-key" value="${esc(s.apiKey || '')}" placeholder="sk-ant-…"></label>
        <div class="grid2">
          <label class="field"><span>Modelo</span>
            <select id="a-model">
              <option value="claude-opus-5" ${(s.model || 'claude-opus-5') === 'claude-opus-5' ? 'selected' : ''}>claude-opus-5</option>
              <option value="claude-sonnet-5" ${s.model === 'claude-sonnet-5' ? 'selected' : ''}>claude-sonnet-5</option>
              <option value="claude-haiku-4-5" ${s.model === 'claude-haiku-4-5' ? 'selected' : ''}>claude-haiku-4-5</option>
            </select></label>
          <label class="field"><span>Esfuerzo</span>
            <select id="a-effort">
              <option value="low" ${(s.effort || 'low') === 'low' ? 'selected' : ''}>low (rápido)</option>
              <option value="medium" ${s.effort === 'medium' ? 'selected' : ''}>medium</option>
              <option value="high" ${s.effort === 'high' ? 'selected' : ''}>high</option>
            </select></label>
        </div>
      </div>
      <p id="ai-local" class="small muted" ${s.aiMode === 'local' ? '' : 'hidden'}>Modelo local: ${LOCAL_MODEL} (~350 MB, se descarga una vez, corre en tu GPU vía WebGPU). Bueno para respuestas cortas; para conversación profunda usa Claude.</p>
      <button class="btn" style="margin-top:8px">Guardar ajustes</button>
    </div>`);
  card.querySelectorAll('#ai-seg button').forEach((b) =>
    b.addEventListener('click', () => {
      card.querySelectorAll('#ai-seg button').forEach((x) => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', 'true');
      s.aiMode = b.dataset.v;
      card.querySelector('#ai-claude').hidden = s.aiMode !== 'claude';
      card.querySelector('#ai-local').hidden = s.aiMode !== 'local';
    }));
  card.querySelector('.btn').addEventListener('click', async () => {
    s.apiKey = card.querySelector('#a-key').value.trim();
    s.model = card.querySelector('#a-model').value;
    s.effort = card.querySelector('#a-effort').value;
    await saveSettings();
    toast('Ajustes guardados', 'ok');
  });
  el.appendChild(card);

  // notificaciones
  const notif = h(`<div class="card"><span class="eyebrow">Notificaciones</span>
    <p class="small muted" style="margin:6px 0 10px">Aviso al terminar bloques de foco (con la app abierta). Los recordatorios de check-in funcionan mejor con una alarma del teléfono a tu hora de mañana/noche.</p>
    <button class="btn ghost">${Notification?.permission === 'granted' ? 'Permiso concedido ✓' : 'Permitir notificaciones'}</button></div>`);
  notif.querySelector('button').addEventListener('click', async () => {
    const p = await Notification.requestPermission();
    toast(p === 'granted' ? 'Notificaciones activas' : 'Permiso denegado', p === 'granted' ? 'ok' : 'err');
  });
  el.appendChild(notif);

  // respaldo
  const backup = h(`<div class="card"><span class="eyebrow">Tus datos</span>
    <p class="small muted" style="margin:6px 0 10px">Todo vive en este dispositivo. Exporta un respaldo de vez en cuando.</p>
    <div class="grid2">
      <button class="btn ghost" id="b-exp">Exportar JSON</button>
      <button class="btn ghost" id="b-imp">Importar JSON</button>
    </div>
    <input type="file" id="b-file" accept="application/json" hidden></div>`);
  backup.querySelector('#b-exp').addEventListener('click', async () => {
    const dump = await exportAll();
    const blob = new Blob([JSON.stringify(dump, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `brasa-respaldo-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
  const fileInput = backup.querySelector('#b-file');
  backup.querySelector('#b-imp').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    try {
      const dump = JSON.parse(await fileInput.files[0].text());
      await importAll(dump);
      toast('Datos restaurados', 'ok');
      location.reload();
    } catch (err) { toast(`No se pudo importar: ${err.message}`, 'err'); }
  });
  el.appendChild(backup);

  el.appendChild(h(`<p class="small muted" style="text-align:center;padding:8px">Brasa v1 · local-first · sin servidores<br>Contenido propio inspirado en la estructura del programa Domina tu Destino (uso personal).</p>`));
}
