// Mini-juego 3: descenso estilo Alto's Adventure.
// Deslizamiento cuesta abajo: A salta; mantener A en el aire hace un giro.
// El cóndor planea (menos gravedad). Aterrizar mal el giro termina la partida.

import * as R from './render.js';
import { foodIcon, ICONS } from './pet.js';
import { rand, drawHUD, stageFactor } from './minigame.js';

const TWO_PI = Math.PI * 2;

// El que baja la montaña es un humano en tabla, no la mascota
const HUMAN = [
  '................',
  '......1111......',
  '.....133331.....',
  '.....131331.....',
  '......1331......',
  '.....122221.....',
  '....12222221....',
  '....12222221....',
  '....12222221....',
  '.....122221.....',
  '......1111......',
  '.....11..11.....',
  '.....11..11.....',
  '..111111111111..',
  '................',
  '................',
];
HUMAN.pal = ['#20242c', '#c43a2e', '#e8b48a'];   // tabla/pantalón, chaqueta, piel

export function createDescent(state) {
  const itemIcon = foodIcon(state.species);
  const gravity = state.species === 'condor' ? 300 : 420;
  const factor = stageFactor(state.stage);

  const p1 = rand(0, 9), p2 = rand(0, 9), p3 = rand(0, 9), p4 = rand(0, 9);
  const BASE = Math.round(R.H * 0.55);
  const terrain = (x) =>
    BASE + 30 * Math.sin(x * 0.013 + p1) + 12 * Math.sin(x * 0.034 + p2) + 5 * Math.sin(x * 0.08 + p3);
  const slope = (x) => (terrain(x + 3) - terrain(x - 3)) / 6;

  const g = {
    over: false, won: false, score: 0, msg: '', t: 0,
    worldX: 0, vx: 65 * factor, cy: 0, vy: 0,
    grounded: true, rot: 0, flips: 0,
    rocks: [], items: [], spawnedTo: 200,
  };
  g.cy = terrain(40) - 8;

  function spawnAhead() {
    while (g.spawnedTo < g.worldX + R.W + 120) {
      g.spawnedTo += rand(200, 420);
      if (Math.random() < 0.55) g.rocks.push({ x: g.spawnedTo });
      else g.items.push({ x: g.spawnedTo, got: false });
    }
  }

  g.update = (dt, input) => {
    if (g.over) return;
    g.t += dt;
    if (g.t > 90) { g.over = true; g.won = true; g.msg = 'BUEN VIAJE!'; return; }

    g.worldX += g.vx * dt;
    const px = g.worldX + 40;
    spawnAhead();

    if (g.grounded) {
      const s = slope(px);
      g.cy = terrain(px) - 8;
      g.vx += (s * 42 - (g.vx - 65 * factor) * 0.35) * dt;
      g.vx = Math.max(45, Math.min(175, g.vx));
      g.rot = 0;
      if (input.just.has('a')) {
        g.vy = -115 - g.vx * 0.25;
        g.grounded = false;
      }
    } else {
      g.vy += gravity * dt;
      g.cy += g.vy * dt;
      if (input.held.a) g.rot -= 6.2 * dt;    // backflip
      const ty = terrain(px) - 8;
      if (g.vy > 0 && g.cy >= ty) {
        const norm = ((g.rot % TWO_PI) + TWO_PI) % TWO_PI;
        const ok = norm < 0.75 || norm > TWO_PI - 0.75;
        if (!ok) { g.over = true; g.msg = 'DE CABEZA!'; return; }
        const flips = Math.round(Math.abs(g.rot) / TWO_PI);
        if (flips > 0) {
          g.flips += flips;
          g.score += flips * 15;
          g.vx = Math.min(175, g.vx + flips * 14);
        }
        g.cy = ty;
        g.vy = 0;
        g.grounded = true;
      }
    }

    // rocas: solo peligrosas si vas por el suelo
    for (const r of g.rocks) {
      if (g.grounded && Math.abs(px - r.x) < 6) { g.over = true; g.msg = 'ROCA!'; return; }
    }
    // comida flotando
    for (const it of g.items) {
      if (it.got) continue;
      const iy = terrain(it.x) - 30;
      const dx = px - it.x, dy = g.cy - iy;
      if (dx * dx + dy * dy < 110) { it.got = true; g.score += 10; }
    }

    g.score += g.vx * dt * 0.04;   // distancia
  };

  g.draw = () => {
    R.clear('#cfe8f8');
    // montañas lejanas (parallax)
    const farBase = Math.round(R.H * 0.3);
    for (let x = 0; x < R.W; x += 2) {
      const yh = farBase + 18 * Math.sin((g.worldX * 0.35 + x) * 0.012 + p4);
      R.rect(x, yh, 2, R.H - yh, '#cfc8e8');
    }
    // terreno nevado
    for (let x = 0; x < R.W; x++) {
      const ty = terrain(g.worldX + x);
      R.rect(x, ty, 1, R.H - ty, '#eef4f8');
      R.px(x, ty, '#8aa8bc');
    }

    const toScreen = (wx) => wx - g.worldX;
    for (const r of g.rocks) {
      const sx = toScreen(r.x);
      if (sx > -8 && sx < R.W) R.sprite(ICONS.rock, sx - 4, terrain(r.x) - 7);
    }
    for (const it of g.items) {
      const sx = toScreen(it.x);
      if (!it.got && sx > -8 && sx < R.W) R.sprite(itemIcon, sx - 4, terrain(it.x) - 34);
    }

    // esquiador rotado (snap a pasos de 30° para look pixel)
    const px = g.worldX + 40;
    let ang;
    if (g.grounded) ang = Math.atan(slope(px)) * 0.8;
    else ang = Math.round(g.rot / (Math.PI / 6)) * (Math.PI / 6);
    R.spriteRot(HUMAN, 40, g.cy, ang);

    drawHUD(Math.floor(g.score), `${Math.max(0, Math.ceil(90 - g.t))}S`);
    if (g.flips > 0) R.text(`GIROS ${g.flips}`, 2, 12, 3);
  };

  g.score = 0;
  return g;
}
