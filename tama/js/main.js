// Bootstrap: entrada (táctil + teclado), loop principal, catch-up y service worker.

import * as R from './render.js';
import { loadState, saveState, wipeSave } from './state.js';
import { simulate, tick, act, SPEED } from './engine.js';
import * as UI from './ui.js';

const params = new URLSearchParams(location.search);
if (params.get('reset') === '1') wipeSave();

const canvas = document.getElementById('screen');
R.initRender(canvas);

const state = loadState(Date.now());

// catch-up de todo lo que pasó con la app cerrada
const startupEvents = simulate(state, Date.now());

UI.initUI(state);
UI.notify(startupEvents);

// ---------- entrada ----------
const input = {
  held: { up: false, down: false, left: false, right: false, a: false, b: false, start: false, select: false },
  just: new Set(),
  taps: [],
};

function press(b) {
  if (!input.held[b]) { input.held[b] = true; input.just.add(b); }
}
function release(b) { input.held[b] = false; }

for (const el of document.querySelectorAll('[data-btn]')) {
  const b = el.dataset.btn;
  el.addEventListener('pointerdown', (e) => { e.preventDefault(); el.setPointerCapture(e.pointerId); press(b); });
  el.addEventListener('pointerup', () => release(b));
  el.addEventListener('pointercancel', () => release(b));
  el.addEventListener('contextmenu', (e) => e.preventDefault());
}

const KEYS = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  KeyX: 'a', Space: 'a', KeyZ: 'b', Enter: 'start', ShiftLeft: 'select', ShiftRight: 'select',
};
addEventListener('keydown', (e) => {
  const b = KEYS[e.code];
  if (b) { e.preventDefault(); press(b); }
});
addEventListener('keyup', (e) => {
  const b = KEYS[e.code];
  if (b) release(b);
});

// toques directos sobre el LCD (mini-juego de puntería)
canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  input.taps.push({
    x: ((e.clientX - rect.left) / rect.width) * R.W,
    y: ((e.clientY - rect.top) / rect.height) * R.H,
  });
});

// ---------- loop principal ----------
let last = performance.now();

function frame(t) {
  const dt = Math.min(0.1, (t - last) / 1000);
  last = t;

  const events = tick(state, dt * 1000, Date.now());
  if (events.length) UI.notify(events);

  UI.update(dt, input);
  UI.draw();

  input.just.clear();
  input.taps.length = 0;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ---------- persistencia y segundo plano ----------
setInterval(() => saveState(state), 10e3);
addEventListener('pagehide', () => saveState(state));

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    last = performance.now();
    const ev = simulate(state, Date.now());
    if (ev.length) UI.notify(ev);
  } else {
    saveState(state);
  }
});

// ---------- service worker ----------
if ('serviceWorker' in navigator &&
    (location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname))) {
  navigator.serviceWorker.register('./sw.js').catch(() => { /* sin SW, la app igual corre */ });
}

// ---------- consola de depuración ----------
window.tama = {
  state,
  act,
  SPEED,
  save: () => saveState(state),
  ui: UI,
  debug: {
    setStage(stage, form = 'good') { state.stage = stage; state.form = form; },
    setSpecies(sp) { state.species = sp; },
    startGame(name) { UI.initUI(state); UI._debugStart?.(name); },
  },
};
