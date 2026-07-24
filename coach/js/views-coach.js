// Coach — chat con motor de reglas, flujos guiados y IA opcional.

import { db } from './db.js';
import { h, esc, toast, state } from './app.js';
import { FLOWS, dailyMessage } from './coach-rules.js';
import { askClaude, askLocal, exportForClaude } from './coach-ai.js';

let activeFlow = null; // { flow, step, answers }

export async function render(el) {
  const wrap = h(`<div>
    <div class="seg" style="margin-bottom:12px" id="quick"></div>
    <div class="chat-log" id="log"></div>
    <div class="chat-input">
      <textarea id="chat-in" rows="1" placeholder="Escríbele a tu coach…"></textarea>
      <button class="btn" id="chat-send">→</button>
    </div>
  </div>`);
  el.appendChild(wrap);

  const log = wrap.querySelector('#log');
  const input = wrap.querySelector('#chat-in');
  const send = wrap.querySelector('#chat-send');

  // accesos rápidos
  const quick = wrap.querySelector('#quick');
  const shortcuts = [
    ['Planear semana', () => startFlow('woop', log)],
    ['Reencuadrar pensamiento', () => startFlow('reframe', log)],
    ['Cerrar el día', () => startFlow('cierre', log)],
    ['Copiar contexto → Claude', async () => {
      try {
        const n = await exportForClaude();
        toast(`Contexto copiado (${Math.round(n / 1000)}k caracteres). Pégalo en la app de Claude.`, 'ok');
      } catch { toast('No se pudo copiar', 'err'); }
    }],
  ];
  shortcuts.forEach(([label, fn]) => {
    const b = h(`<button type="button">${esc(label)}</button>`);
    b.addEventListener('click', fn);
    quick.appendChild(b);
  });

  // historial
  const history = await db.all('chats');
  if (!history.length) {
    const msg = await dailyMessage();
    bubble(log, 'coach', msg?.text || '¿En qué estás? Cuéntame o usa un acceso rápido.');
  } else {
    history.slice(-40).forEach((m) => bubble(log, m.role === 'user' ? 'me' : 'coach', m.text));
  }

  // flujo pendiente desde URL (#/coach?flow=woop)
  const qs = location.hash.split('?')[1];
  const flowParam = qs && new URLSearchParams(qs).get('flow');
  if (flowParam && FLOWS[flowParam]) startFlow(flowParam, log);

  const submit = async () => {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    bubble(log, 'me', text);
    await db.put('chats', { date: new Date().toISOString(), role: 'user', text });

    // ¿estamos dentro de un flujo guiado?
    if (activeFlow) { await flowStep(text, log); return; }

    const mode = state.settings.aiMode || 'rules';
    if (mode === 'rules') {
      const reply = 'Modo sin IA activo. Usa los accesos rápidos (son los flujos del método) o "Copiar contexto → Claude" para una conversación profunda. Puedes activar la IA en Ajustes.';
      bubble(log, 'coach', reply);
      await db.put('chats', { date: new Date().toISOString(), role: 'coach', text: reply });
      return;
    }

    const thinking = bubble(log, 'sys', mode === 'local' ? 'pensando (modelo local)…' : 'pensando…');
    try {
      const msgs = (await db.all('chats')).slice(-16).map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));
      const reply = mode === 'local'
        ? await askLocal(msgs, (p) => (thinking.textContent = p))
        : await askClaude(msgs);
      thinking.remove();
      bubble(log, 'coach', reply);
      await db.put('chats', { date: new Date().toISOString(), role: 'coach', text: reply });
    } catch (err) {
      thinking.remove();
      bubble(log, 'sys', `⚠ ${err.message}`);
    }
  };

  send.addEventListener('click', submit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  });
}

/* ── flujos guiados ─────────────────────────────────────────── */

function startFlow(id, log) {
  const flow = FLOWS[id];
  activeFlow = { flow, step: 0, answers: {} };
  bubble(log, 'coach', `${flow.title}\n\n${flow.intro}\n\n${flow.steps[0].q}`);
}

async function flowStep(text, log) {
  const st = activeFlow;
  st.answers[st.flow.steps[st.step].id] = text;
  st.step++;
  if (st.step < st.flow.steps.length) {
    const q = st.flow.steps[st.step].q;
    bubble(log, 'coach', q);
    await db.put('chats', { date: new Date().toISOString(), role: 'coach', text: q });
  } else {
    const closing = st.flow.close(st.answers);
    if (st.flow.save) await st.flow.save(st.answers);
    bubble(log, 'coach', closing);
    await db.put('chats', { date: new Date().toISOString(), role: 'coach', text: closing });
    activeFlow = null;
  }
}

function bubble(log, kind, text) {
  const b = h(`<div class="bubble ${kind}"></div>`);
  b.textContent = text;
  log.appendChild(b);
  b.scrollIntoView({ block: 'end' });
  return b;
}
