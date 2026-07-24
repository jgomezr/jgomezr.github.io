// Pantallas y navegación: hogar, menú, stats, selección de huevo,
// mini-juegos, evolución y muerte. Todo se dibuja dentro del LCD.

import * as R from './render.js';
import { SPECIES, SPECIES_KEYS, SPECIES_PAL, spriteFor, eggSprite, foodIcon, ICONS } from './pet.js';
import { act } from './engine.js';
import { saveState, freshState, newPet } from './state.js';
import { createRunner } from './runner.js';
import { createShooter } from './shooter.js';
import { createDescent } from './descent.js';

const MENU_ITEMS = ['COMIDA', 'LUZ', 'JUGAR', 'LIMPIAR', 'MEDICINA', 'ESTADO'];
const STAGE_NAMES = { egg: 'HUEVO', baby: 'BEBE', child: 'NIÑO', adult: 'ADULTO' };

let state = null;
const ui = {
  screen: 'home',        // eggselect|home|menu|stats|gameselect|game|gameover|dead|evolve
  cursor: 0,
  toast: null,           // {msg, t}
  fx: null,              // {type:'eat'|'clean', t}
  walkT: 0,
  animT: 0,
  game: null,
  gameReward: 0,
  gameOverDelay: 0,
  evolve: null,          // {label, t}
  petTouch: 0,
};

export function initUI(s) {
  state = s;
  ui.screen = state.species ? (state.dead ? 'dead' : 'home') : 'eggselect';
}

function toast(msg, t = 1.4) { ui.toast = { msg, t }; }

export function notify(events) {
  for (const e of events) {
    if (e.type === 'hatch') ui.evolve = { label: 'NACIO!', t: 2.4 };
    else if (e.type === 'evolve') ui.evolve = { label: e.stage === 'adult' ? 'EVOLUCIONO!' : 'CRECIO!', t: 2.4 };
    else if (e.type === 'sick') toast('ESTA ENFERMO!', 2);
    else if (e.type === 'died') { ui.screen = 'dead'; ui.game = null; }
  }
  if (ui.evolve && ui.screen === 'home') ui.screen = 'evolve';
}

function startGame(name) {
  ui.game = name === 'runner' ? createRunner(state)
    : name === 'shooter' ? createShooter(state)
    : createDescent(state);
  ui.gameOverDelay = 0.9;
  ui.screen = 'game';
}

// solo para pruebas desde la consola
export function _debugStart(name) { startGame(name); }
export function _debugScreen(name) { ui.screen = name; }

// ---------- update ----------

export function update(dt, input) {
  ui.animT += dt;
  if (ui.toast) { ui.toast.t -= dt; if (ui.toast.t <= 0) ui.toast = null; }
  if (ui.fx) { ui.fx.t -= dt; if (ui.fx.t <= 0) ui.fx = null; }
  ui.petTouch = Math.max(0, ui.petTouch - dt);

  const just = input.just;
  switch (ui.screen) {
    case 'eggselect': {
      if (just.has('left')) ui.cursor = (ui.cursor + SPECIES_KEYS.length - 1) % SPECIES_KEYS.length;
      if (just.has('right')) ui.cursor = (ui.cursor + 1) % SPECIES_KEYS.length;
      if (just.has('a') || just.has('start')) {
        newPet(state, SPECIES_KEYS[ui.cursor], Date.now());
        ui.screen = 'home';
        toast('CUIDALO BIEN!', 2);
      }
      break;
    }
    case 'home': {
      if (!state.flags.sleeping && !state.dead && state.stage !== 'egg') ui.walkT += dt;
      if (just.has('start')) { ui.screen = 'menu'; ui.cursor = 0; }
      else if (just.has('select')) ui.screen = 'stats';
      else if (just.has('a')) ui.petTouch = 1;
      break;
    }
    case 'menu': {
      if (just.has('up')) ui.cursor = (ui.cursor + MENU_ITEMS.length - 1) % MENU_ITEMS.length;
      if (just.has('down')) ui.cursor = (ui.cursor + 1) % MENU_ITEMS.length;
      if (just.has('b') || just.has('start')) ui.screen = 'home';
      else if (just.has('a')) menuAction(MENU_ITEMS[ui.cursor]);
      break;
    }
    case 'stats': {
      if (just.has('b') || just.has('a') || just.has('start') || just.has('select')) ui.screen = 'home';
      break;
    }
    case 'gameselect': {
      const n = 3;
      if (just.has('up')) ui.cursor = (ui.cursor + n - 1) % n;
      if (just.has('down')) ui.cursor = (ui.cursor + 1) % n;
      if (just.has('b')) ui.screen = 'home';
      else if (just.has('a')) startGame(['runner', 'shooter', 'descent'][ui.cursor]);
      break;
    }
    case 'game': {
      if (just.has('start') && ui.game && !ui.game.over) {
        // salir del juego con Start (cuenta el puntaje que lleve)
        ui.game.over = true;
        ui.game.msg = 'SALISTE';
      }
      if (ui.game) {
        ui.game.update(dt, input);
        if (ui.game.over) {
          ui.gameOverDelay -= dt;
          if (ui.gameOverDelay <= 0) {
            ui.gameReward = act.gameReward(state, Math.floor(ui.game.score));
            saveState(state);
            ui.screen = 'gameover';
          }
        }
      }
      break;
    }
    case 'gameover': {
      if (just.has('a') || just.has('start')) { ui.game = null; ui.screen = 'home'; }
      break;
    }
    case 'evolve': {
      ui.evolve.t -= dt;
      if (ui.evolve.t <= 0 || just.has('a')) { ui.evolve = null; ui.screen = 'home'; }
      break;
    }
    case 'dead': {
      if (just.has('start') || just.has('a')) {
        const gen = state.generation + 1;
        Object.assign(state, freshState(Date.now(), gen));
        saveState(state);
        ui.screen = 'eggselect';
        ui.cursor = 0;
      }
      break;
    }
  }
}

function menuAction(item) {
  switch (item) {
    case 'COMIDA':
      if (act.feed(state)) { ui.fx = { type: 'eat', t: 1.5 }; ui.screen = 'home'; saveState(state); }
      else toast(state.stats.hunger >= 98 ? 'NO TIENE HAMBRE' : 'AHORA NO');
      break;
    case 'LUZ':
      if (act.light(state)) { ui.screen = 'home'; saveState(state); }
      else toast('AHORA NO');
      break;
    case 'JUGAR':
      if (act.canPlay(state)) { ui.screen = 'gameselect'; ui.cursor = 0; }
      else toast(state.flags.sick ? 'ESTA ENFERMO' : state.stats.energy <= 15 ? 'SIN ENERGIA' : 'AHORA NO');
      break;
    case 'LIMPIAR':
      if (act.clean(state)) { ui.fx = { type: 'clean', t: 1.2 }; ui.screen = 'home'; saveState(state); }
      else toast('AHORA NO');
      break;
    case 'MEDICINA':
      if (act.medicine(state)) { toast('CURADO!'); ui.screen = 'home'; saveState(state); }
      else toast('NO ESTA ENFERMO');
      break;
    case 'ESTADO':
      ui.screen = 'stats';
      break;
  }
}

// ---------- draw ----------

export function draw() {
  switch (ui.screen) {
    case 'eggselect': drawEggSelect(); break;
    case 'home': drawHome(); break;
    case 'menu': drawHome(); drawMenu(); break;
    case 'stats': drawStats(); break;
    case 'gameselect': drawGameSelect(); break;
    case 'game': if (ui.game) ui.game.draw(); break;
    case 'gameover': if (ui.game) ui.game.draw(); drawGameOver(); break;
    case 'evolve': drawEvolve(); break;
    case 'dead': drawDead(); break;
  }
  if (ui.toast) {
    const w = R.textWidth(ui.toast.msg) + 10;
    R.box((R.W - w) / 2, R.H - 24, w, 15);
    R.textC(ui.toast.msg, R.H - 19);
  }
}

function drawEggSelect() {
  R.clear(0);
  const ey = Math.round(R.H / 2) - 36;
  R.textC('ELIGE TU HUEVO', ey - 44);
  const xs = [16, 64, 112];
  for (let i = 0; i < 3; i++) {
    const sel = i === ui.cursor;
    const bob = sel ? Math.floor(ui.animT * 3) % 2 : 0;
    R.sprite(eggSprite(), xs[i], ey - bob, { scale: 2, palette: SPECIES_PAL[SPECIES_KEYS[i]] });
    if (sel) {
      R.text('>', xs[i] - 8, ey + 12);
      R.text('<', xs[i] + 34, ey + 12);
    }
  }
  R.textC(SPECIES[SPECIES_KEYS[ui.cursor]].label, ey + 48, 3);
  R.textC('< > ELEGIR  A: OK', R.H - 22, 2);
}

function drawHome() {
  R.clear('#c8e8f8');
  const floorY = R.H - 26;
  R.rect(120, 12, 14, 5, '#ffffff');
  R.rect(30, 24, 18, 5, '#ffffff');
  R.rect(0, floorY, R.W, 1, '#4e7a2e');
  R.rect(0, floorY + 1, R.W, R.H - floorY - 1, '#7cba4e');

  const sleeping = state.flags.sleeping;
  const isEgg = state.stage === 'egg';

  // posición de la mascota
  let petX = 64;
  let flip = false;
  if (!sleeping && !isEgg) {
    petX = 64 + Math.sin(ui.walkT * 0.7) * 24;
    flip = Math.cos(ui.walkT * 0.7) < 0;
  }
  const bob = sleeping ? 0 : Math.floor(ui.animT * 2) % 2;
  const wobble = isEgg ? Math.round(Math.sin(ui.animT * 4)) : 0;

  R.sprite(spriteFor(state), Math.round(petX) + wobble, floorY - 32 + bob * 2, { scale: 2, flipX: flip });

  // cacas
  for (let i = 0; i < state.flags.poops; i++) {
    R.sprite(ICONS.poop, 138 - i * 11, floorY - 8);
  }

  // efectos de acción
  if (ui.fx?.type === 'eat') {
    R.sprite(foodIcon(state.species), Math.round(petX) - 10, floorY - 20);
  }
  if (ui.fx?.type === 'clean') {
    const spots = [[-12, 40], [34, 34], [-6, 46], [30, 26]];
    for (const [ox, oy] of spots) {
      R.text('*', Math.round(petX) + ox, floorY - oy, 2);
    }
  }
  if (ui.petTouch > 0 && !isEgg && !sleeping) {
    R.sprite(ICONS.heart, Math.round(petX) + 26, floorY - 42);
  }

  // dormido
  if (sleeping) {
    R.dim();
    R.sprite(ICONS.moon, R.W - 14, 6);
    const zx = Math.round(petX) + 28;
    R.text('Z', zx, floorY - 46 - (Math.floor(ui.animT * 2) % 3) * 3, '#f8e88a');
    R.text('Z', zx + 6, floorY - 54, '#e0c050');
  }

  // avisos arriba (parpadean)
  if (Math.floor(ui.animT * 2) % 2 === 0 && !isEgg) {
    let ax = 4;
    const alert = (icon) => { R.sprite(icon, ax, 4); ax += 11; };
    if (state.flags.sick) alert(ICONS.skull);
    if (state.stats.hunger < 25) alert(foodIcon(state.species));
    if (state.stats.energy < 25 && !sleeping) alert(ICONS.moon);
    if (state.stats.hygiene < 25) alert(ICONS.drop);
    if (state.stats.happiness < 25) alert(ICONS.heart);
  }

  if (isEgg) R.textC('INCUBANDO...', 10, 2);
}

function drawMenu() {
  const y0 = Math.round((R.H - 112) / 2);
  R.box(30, y0, 100, 112);
  for (let i = 0; i < MENU_ITEMS.length; i++) {
    const y = y0 + 10 + i * 16;
    let label = MENU_ITEMS[i];
    if (label === 'LUZ') label = state.flags.sleeping ? 'DESPERTAR' : 'LUZ';
    R.text(label, 52, y, 3);
    if (i === ui.cursor) R.text('>', 42, y, 3);
  }
}

function drawStats() {
  R.clear(0);
  R.box(4, 4, 152, R.H - 8);
  const y0 = Math.round((R.H - 160) / 2);
  R.textC('ESTADO', y0);
  const rows = [
    ['COMIDA', state.stats.hunger],
    ['ENERGIA', state.stats.energy],
    ['HIGIENE', state.stats.hygiene],
    ['ANIMO', state.stats.happiness],
  ];
  let y = y0 + 16;
  for (const [label, v] of rows) {
    R.text(label, 14, y, 3);
    R.bar(60, y, 86, 7, v / 100);
    y += 16;
  }
  y += 4;
  const days = Math.floor(state.ageMs / 86400e3);
  R.text(`EDAD: ${days} DIAS`, 14, y, 3); y += 12;
  R.text(`ETAPA: ${STAGE_NAMES[state.stage]}`, 14, y, 3); y += 12;
  R.text(`GEN: ${state.generation}  ${state.flags.sick ? 'ENFERMO!' : 'SANO'}`, 14, y, 3);
  R.textC('B: VOLVER', R.H - 16, 2);
}

function drawGameSelect() {
  R.clear(0);
  const gy = Math.round((R.H - 96) / 2);
  R.box(20, gy, 120, 96);
  R.textC('JUGAR A...', gy + 8);
  const names = ['CARRERA', 'PUNTERIA', state.species === 'condor' ? 'PLANEO' : 'DESCENSO'];
  for (let i = 0; i < names.length; i++) {
    const y = gy + 28 + i * 16;
    R.text(names[i], 56, y, 3);
    if (i === ui.cursor) R.text('>', 46, y, 3);
  }
  R.textC('B: VOLVER', gy + 84, 2);
}

function drawGameOver() {
  const gy = Math.round((R.H - 64) / 2);
  R.box(20, gy, 120, 64);
  R.textC(ui.game.msg || 'FIN!', gy + 8);
  R.textC(`PUNTOS: ${Math.floor(ui.game.score)}`, gy + 22);
  R.textC(`ANIMO +${ui.gameReward}`, gy + 34);
  R.textC('A: SEGUIR', gy + 50, 2);
}

function drawEvolve() {
  R.clear(0);
  const sy = Math.round(R.H / 2) - 40;
  const show = Math.floor(ui.animT * 6) % 2 === 0;
  if (show) R.sprite(spriteFor(state), 64, sy, { scale: 2 });
  R.textC(ui.evolve?.label || '', sy - 24, 3);
  R.textC(SPECIES[state.species].label, sy + 52, 3);
  R.textC(STAGE_NAMES[state.stage], sy + 64, 2);
}

function drawDead() {
  R.clear(0);
  R.dim();
  const mid = Math.round(R.H / 2);
  R.rect(56, mid - 56, 48, 48, 0);
  R.sprite(ICONS.skull, 68, mid - 44, { scale: 3 });
  R.box(24, mid, 112, 56);
  R.textC('SE FUE...', mid + 8);
  R.textC(`GEN ${state.generation} - ${Math.floor(state.ageMs / 86400e3)} DIAS`, mid + 22, 2);
  R.textC('START:', mid + 34, 3);
  R.textC('NUEVO HUEVO', mid + 44, 3);
}
