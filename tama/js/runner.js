// Mini-juego 1: runner de plataformas estilo Mario.
// La mascota corre sola; A salta (mantener = salto más alto), abajo agacha.

import * as R from './render.js';
import { spriteFor, foodIcon, ICONS } from './pet.js';
import { aabb, rand, drawHUD, stageFactor } from './minigame.js';

const TILE = 8;
const GROUND = 3;               // altura del suelo en tiles
const GRAVITY = 500;
const JUMP_V = -165;

export function createRunner(state) {
  const petMap = spriteFor(state);
  const itemIcon = foodIcon(state.species);
  const vx = 60 * stageFactor(state.stage);
  const targetDist = vx * 42;   // ~42 s de carrera

  const g = {
    over: false, won: false, score: 0, msg: '',
    worldX: 0,
    y: 0, vy: 0, grounded: false, ducking: false,
    cols: [], enemies: [], items: [], bees: [], flagX: null,
    genX: 0, t: 0,
  };

  const groundTop = () => R.H - GROUND * TILE;

  function pushCol(spec) { g.cols.push(spec); g.genX += TILE; }
  const flatCol = () => ({ top: groundTop(), pit: false, pipe: false });

  function flat(n) { for (let i = 0; i < n; i++) pushCol(flatCol()); }

  function genChunk() {
    if (g.flagX !== null) { flat(8); return; }
    if (g.genX >= targetDist) {
      flat(4);
      g.flagX = g.genX;
      flat(10);
      return;
    }
    const r = Math.random();
    if (r < 0.2) {                                   // hueco
      flat(2);
      const w = Math.random() < 0.5 ? 2 : 3;
      for (let i = 0; i < w; i++) pushCol({ top: null, pit: true, pipe: false });
      flat(3);
    } else if (r < 0.38) {                           // tubería
      flat(3);
      pushCol({ top: groundTop() - 16, pit: false, pipe: true });
      pushCol({ top: groundTop() - 16, pit: false, pipe: true });
      flat(3);
    } else if (r < 0.56) {                           // enemigo
      flat(3);
      g.enemies.push({ x: g.genX + 16, y: groundTop() - 8, dir: -1, dead: false });
      flat(6);
    } else if (r < 0.7) {                            // abeja (agacharse)
      flat(2);
      g.bees.push({ x: g.genX + 12, y: groundTop() - 13 });
      flat(6);
    } else {                                         // fila de comida
      flat(2);
      const high = Math.random() < 0.4;
      const iy = groundTop() - (high ? 30 : 14);
      for (let i = 0; i < 3; i++) g.items.push({ x: g.genX + i * 10, y: iy, got: false });
      flat(5);
    }
  }

  // arranque seguro
  flat(10);
  g.y = groundTop() - 14;
  g.grounded = true;
  while (g.genX < g.worldX + R.W + 80) genChunk();

  function colAt(worldPx) {
    const i = Math.floor(worldPx / TILE);
    return g.cols[i] || flatCol();
  }

  function die(msg) {
    g.over = true;
    g.msg = msg;
  }

  g.update = (dt, input) => {
    if (g.over) return;
    g.t += dt;
    g.worldX += vx * dt;
    while (g.genX < g.worldX + R.W + 80) genChunk();

    const px = g.worldX + 32;          // borde izquierdo del jugador (mundo)
    const pw = 10;
    g.ducking = g.grounded && input.held.down;
    const ph = g.ducking ? 8 : 14;
    const pyTop = () => g.y + (g.ducking ? 6 : 0);

    // salto
    if (g.grounded && input.just.has('a')) {
      g.vy = JUMP_V;
      g.grounded = false;
    }

    // física vertical
    if (!g.grounded) {
      const grav = (input.held.a && g.vy < 0) ? GRAVITY * 0.55 : GRAVITY;
      const prevBottom = g.y + 14;
      g.vy += grav * dt;
      g.y += g.vy * dt;
      // aterrizar
      const c1 = colAt(px + 2), c2 = colAt(px + pw - 2);
      const tops = [c1, c2].filter((c) => !c.pit).map((c) => c.top);
      if (tops.length && g.vy >= 0) {
        const top = Math.min(...tops);
        if (g.y + 14 >= top && prevBottom <= top + 5) {
          g.y = top - 14;
          g.vy = 0;
          g.grounded = true;
        }
      }
    } else {
      // ¿sigue habiendo suelo debajo?
      const c1 = colAt(px + 2), c2 = colAt(px + pw - 2);
      if (c1.pit && c2.pit) g.grounded = false;
      else {
        const top = Math.min(...[c1, c2].filter((c) => !c.pit).map((c) => c.top));
        if (g.y + 14 < top - 1) g.grounded = false;   // se acabó la tubería
        else g.y = top - 14;
      }
    }

    // caer al vacío
    if (g.y > R.H + 4) { die('AL HUECO!'); return; }

    // pared de frente (tubería más alta que los pies)
    const front = colAt(px + pw + 1);
    if (!front.pit && front.top < g.y + 14 - 3 && px + pw + 1 >= 0) {
      die('CHOQUE!');
      return;
    }

    // enemigos
    for (const e of g.enemies) {
      if (e.dead) continue;
      e.x += e.dir * 8 * dt;
      if (aabb(px, pyTop(), pw, ph, e.x, e.y, 8, 8)) {
        if (g.vy > 40 && g.y + 14 < e.y + 6) {
          e.dead = true;
          g.vy = -110;
          g.score += 20;
        } else { die('OUCH!'); return; }
      }
    }

    // abejas: se esquivan agachándose
    for (const b of g.bees) {
      b.y = groundTop() - 13 + Math.sin(g.t * 6 + b.x) * 2;
      if (aabb(px, pyTop(), pw, ph, b.x, b.y, 8, 6)) { die('BZZZ!'); return; }
    }

    // comida
    for (const it of g.items) {
      if (!it.got && aabb(px, pyTop(), pw, ph, it.x, it.y, 8, 8)) {
        it.got = true;
        g.score += 10;
      }
    }

    // meta
    if (g.flagX !== null && px > g.flagX + 4) {
      g.score += 30;
      g.won = true;
      g.over = true;
      g.msg = 'META!';
    }
  };

  g.draw = () => {
    R.clear('#b8e0f4');
    // nubes
    R.rect(20 - (g.worldX * 0.2) % 200, 20, 18, 5, '#ffffff');
    R.rect(120 - (g.worldX * 0.2) % 200, 34, 22, 5, '#ffffff');

    const offset = g.worldX % TILE;
    const first = Math.floor(g.worldX / TILE);
    for (let i = -1; i < R.W / TILE + 2; i++) {
      const c = g.cols[first + i];
      if (!c || c.pit) continue;
      const sx = i * TILE - offset;
      if (c.pipe) {
        R.rect(sx, c.top, TILE, R.H - c.top, '#2e9e4a');
        R.rect(sx, c.top, TILE, 2, '#1a5e2c');
        R.rect(sx, c.top, 1, R.H - c.top, '#1a5e2c');
        R.rect(sx + TILE - 1, c.top, 1, R.H - c.top, '#1a5e2c');
      } else {
        R.rect(sx, c.top, TILE, 2, '#4e9a3a');
        R.rect(sx, c.top + 2, TILE, R.H - c.top - 2, '#8a5a2e');
        R.px(sx + 2, c.top + 5, '#6a4226');
        R.px(sx + 5, c.top + 10, '#6a4226');
      }
    }

    const toScreen = (wx) => wx - g.worldX;
    for (const it of g.items) {
      if (!it.got) R.sprite(itemIcon, toScreen(it.x), it.y);
    }
    for (const e of g.enemies) {
      if (!e.dead && toScreen(e.x) > -8 && toScreen(e.x) < R.W) {
        R.sprite(ICONS.enemy, toScreen(e.x), e.y);
      }
    }
    for (const b of g.bees) {
      if (toScreen(b.x) > -8 && toScreen(b.x) < R.W) {
        R.sprite(ICONS.bee, toScreen(b.x), b.y);
      }
    }
    if (g.flagX !== null) R.sprite(ICONS.flag, toScreen(g.flagX), groundTop() - 8);

    // mascota (16px, con rebote al correr)
    const bob = g.grounded && !g.ducking ? Math.floor(g.t * 10) % 2 : 0;
    const drawY = g.ducking ? g.y + 4 : g.y - 2 + bob;
    R.sprite(petMap, 32 - 3, drawY);

    drawHUD(g.score, `${Math.min(100, Math.floor((g.worldX / targetDist) * 100))}%`);
  };

  return g;
}
