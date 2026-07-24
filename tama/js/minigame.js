// Utilidades compartidas por los mini-juegos.

import * as R from './render.js';

export function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export function rand(min, max) {
  return min + Math.random() * (max - min);
}

export function drawHUD(score, right = '') {
  R.rect(0, 0, R.W, 9, 0);
  R.rect(0, 9, R.W, 1, 3);
  R.text(`PTS ${score}`, 2, 2, 3);
  if (right) R.text(right, R.W - R.textWidth(right) - 2, 2, 3);
}

// Velocidad de los mini-juegos según la etapa de la mascota
export function stageFactor(stage) {
  return { baby: 0.75, child: 1, adult: 1.2 }[stage] || 1;
}
