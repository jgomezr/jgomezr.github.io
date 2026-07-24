// Mini-juego 2: puntería estilo Duck Hunt.
// Se dispara tocando la pantalla; la cruceta mueve la retícula y A dispara.

import * as R from './render.js';
import { spriteFor, ICONS } from './pet.js';
import { rand, drawHUD, stageFactor } from './minigame.js';

const TOTAL_ROUNDS = 8;
const TS = 1.4;                      // escala de los objetivos (8px → ~11px)
const T_HALF = 4 * TS;               // centro del objetivo
const HIT_R2 = (7 * TS) ** 2;        // radio de acierto al cuadrado

export function createShooter(state) {
  const petMap = spriteFor(state);
  const speed = stageFactor(state.stage);

  const g = {
    over: false, won: true, score: 0, msg: '',
    round: 0, shots: 0, targets: [], hits: 0,
    phase: 'between', timer: 0.8, t: 0,
    cx: R.W / 2, cy: R.H / 2,
    flash: 0, reaction: '',
  };

  function startRound() {
    g.round++;
    g.shots = 3;
    g.hits = 0;
    g.phase = 'fly';
    g.reaction = '';
    const v = (26 + g.round * 5) * speed;
    g.targets = [];
    for (let i = 0; i < 2; i++) {
      const fromLeft = Math.random() < 0.5;
      g.targets.push({
        x: fromLeft ? -10 - i * 26 : R.W + 10 + i * 26,
        baseY: rand(28, R.H - 60),
        y: 0,
        vx: (fromLeft ? 1 : -1) * v,
        vy: -3 - g.round,
        amp: rand(4, 14),
        f: rand(2, 4),
        icon: Math.random() < 0.5 ? 'balloon' : 'target',
        hit: false,
        escaping: false,
      });
    }
  }

  function shoot(x, y) {
    if (g.phase !== 'fly' || g.shots <= 0) return;
    g.shots--;
    g.cx = x; g.cy = y;
    g.flash = 0.1;
    let hitSome = false;
    for (const t of g.targets) {
      if (t.hit || t.escaping) continue;
      const dx = x - (t.x + T_HALF), dy = y - (t.y + T_HALF);
      if (dx * dx + dy * dy <= HIT_R2) {
        t.hit = true;
        t.fallY = t.y;
        hitSome = true;
        g.hits++;
        g.score += 10 + g.round * 2;
        break;
      }
    }
    if (!hitSome && g.shots === 0) {
      for (const t of g.targets) if (!t.hit) t.escaping = true;
    }
  }

  g.update = (dt, input) => {
    if (g.over) return;
    g.t += dt;
    g.flash = Math.max(0, g.flash - dt);

    if (g.phase === 'between') {
      g.timer -= dt;
      if (g.timer <= 0) {
        if (g.round >= TOTAL_ROUNDS) { g.over = true; g.msg = 'FIN!'; return; }
        startRound();
      }
      return;
    }

    // retícula con cruceta
    const cs = 75 * dt;
    if (input.held.left) g.cx -= cs;
    if (input.held.right) g.cx += cs;
    if (input.held.up) g.cy -= cs;
    if (input.held.down) g.cy += cs;
    g.cx = Math.max(2, Math.min(R.W - 2, g.cx));
    g.cy = Math.max(12, Math.min(R.H - 26, g.cy));
    if (input.just.has('a')) shoot(g.cx, g.cy);
    for (const tap of input.taps) {
      if (tap.y > 10 && tap.y < R.H - 20) shoot(tap.x, tap.y);
    }

    let alive = 0;
    for (const t of g.targets) {
      if (t.hit) {
        t.y += 90 * dt;             // cae
        if (t.y < R.H) alive++;     // sigue animando la caída
        continue;
      }
      if (t.escaping) {
        t.baseY -= 80 * dt;
      }
      t.x += t.vx * dt;
      t.baseY += t.vy * dt;
      t.y = t.baseY + Math.sin(g.t * t.f) * t.amp;
      const gone = t.x < -14 || t.x > R.W + 14 || t.y < -12;
      if (!gone) alive++;
      else t.escaping = true;
    }

    const remaining = g.targets.filter((t) => !t.hit && !(t.x < -14 || t.x > R.W + 14 || t.y < -12));
    if (remaining.length === 0 || (g.shots === 0 && remaining.every((t) => t.escaping))) {
      if (remaining.length === 0 && g.targets.every((t) => t.hit || t.x < -14 || t.x > R.W + 14 || t.y < -12)) {
        g.phase = 'between';
        g.timer = 1.1;
        g.reaction = g.hits === 2 ? 'happy' : g.hits === 0 ? 'sad' : '';
      }
    }
  };

  g.draw = () => {
    R.clear(g.flash > 0 ? '#ffffff' : '#b8e0f4');
    if (g.flash > 0) { drawHUD(g.score, `R${g.round}/${TOTAL_ROUNDS}`); return; }

    // sol y hierba
    R.rect(136, 16, 10, 10, '#f6d35a');
    R.rect(138, 18, 6, 6, '#fce88a');
    R.rect(0, R.H - 20, R.W, 20, '#5da13e');
    R.rect(0, R.H - 20, R.W, 1, '#3e7a2e');
    for (let x = 4; x < R.W; x += 12) R.rect(x, R.H - 23, 2, 3, '#3e7a2e');

    for (const t of g.targets) {
      if (t.x < -14 || t.x > R.W + 14 || t.y < -12 || t.y > R.H) continue;
      R.sprite(ICONS[t.icon], t.x, t.y, { scale: TS });
      if (t.hit) R.text('*', t.x + 3, t.y - 6, 3);
    }

    // mascota abajo, reacciona entre rondas
    R.sprite(petMap, R.W / 2 - 8, R.H - 19);
    if (g.reaction === 'happy') R.sprite(ICONS.heart, R.W / 2 + 8, R.H - 26);
    if (g.reaction === 'sad') R.text('?', R.W / 2 + 10, R.H - 26, 3);

    // retícula
    const x = Math.round(g.cx), y = Math.round(g.cy);
    R.rect(x - 4, y, 3, 1, 3);
    R.rect(x + 2, y, 3, 1, 3);
    R.rect(x, y - 4, 1, 3, 3);
    R.rect(x, y + 2, 1, 3, 3);

    drawHUD(g.score, `R${g.round}/${TOTAL_ROUNDS}`);
    // balas
    for (let i = 0; i < g.shots; i++) R.rect(60 + i * 5, 3, 3, 4, 3);
  };

  return g;
}
