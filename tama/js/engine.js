// Motor de simulación: decaimiento de stats en tiempo real, catch-up al abrir,
// sueño, cacas, enfermedad, evolución y acciones de cuidado.

import { DUR } from './pet.js';

// ?speed=N acelera el tiempo simulado (para pruebas). ?speed=60 → 1h por minuto.
const params = new URLSearchParams(location.search);
export const SPEED = Math.max(0.1, parseFloat(params.get('speed')) || 1);

const HOUR = 3600e3;
const CATCHUP_CAP = 48 * HOUR;     // máximo de tiempo real a simular de una vez
const STEP = 60e3;                 // paso interno del catch-up: 1 min real

// Tasas por hora simulada
const RATE = {
  hunger: 4, energy: 3, hygiene: 2, happiness: 3,
  energyRegen: 12, sickHappiness: 3,
};

const ZERO_SICK_MS = 4 * HOUR;     // stat en 0 durante 4h → enfermo
const SICK_DEATH_MS = 24 * HOUR;   // enfermo 24h sin medicina → se va
const POOP_EVERY_MS = 4 * HOUR;    // promedio entre cacas

function isNight(wallTime) {
  const h = new Date(wallTime).getHours();
  return h >= 22 || h < 7;
}

function clampStat(v) { return Math.max(0, Math.min(100, v)); }

// Un paso de simulación. dtMs es tiempo REAL; internamente se multiplica por SPEED.
function step(state, dtMs, wallTime, events) {
  if (!state.species || state.dead) return;

  const sim = dtMs * SPEED;
  const h = sim / HOUR;
  state.ageMs += sim;
  state.stageMs += sim;

  // ---- huevo: solo incuba ----
  if (state.stage === 'egg') {
    if (state.stageMs >= DUR.egg) {
      state.stage = 'baby';
      state.stageMs = 0;
      events.push({ type: 'hatch' });
    }
    return;
  }

  const f = state.flags;
  const st = state.stats;
  const night = isNight(wallTime);

  // ---- sueño automático ----
  if (night && !f.sleeping) {
    f.sleeping = true;
    f.autoSleep = true;
  } else if (!night && f.sleeping && f.autoSleep) {
    f.sleeping = false;
    f.autoSleep = false;
  }

  // ---- decaimiento / regeneración ----
  const slow = f.sleeping ? 0.5 : 1;
  st.hunger -= RATE.hunger * h * slow;
  st.hygiene -= (RATE.hygiene + f.poops * 1.5) * h * slow;
  st.happiness -= RATE.happiness * h * (f.sleeping ? 0.35 : 1) * (f.sick ? 2 : 1);
  if (f.sleeping) {
    st.energy += RATE.energyRegen * h;
    if (st.energy >= 100 && !night && !f.autoSleep) f.sleeping = false;
  } else {
    st.energy -= RATE.energy * h;
  }
  for (const k of Object.keys(st)) st[k] = clampStat(st[k]);

  // ---- cacas ----
  if (!f.sleeping && f.poops < 4 && Math.random() < sim / POOP_EVERY_MS) {
    f.poops++;
    st.hygiene = clampStat(st.hygiene - 10);
  }

  // ---- descuido: stats en cero ----
  for (const k of Object.keys(st)) {
    if (st[k] <= 0.5) {
      if (state.zt[k] === 0) state.neglectCount++;
      state.zt[k] += sim;
    } else {
      state.zt[k] = 0;
    }
  }

  // ---- enfermedad y muerte ----
  const neglected = Object.values(state.zt).some((t) => t > ZERO_SICK_MS);
  if (!f.sick && neglected) {
    f.sick = true;
    state.sickMs = 0;
    events.push({ type: 'sick' });
  }
  if (f.sick) {
    state.sickMs += sim;
    if (state.sickMs >= SICK_DEATH_MS) {
      state.dead = true;
      f.sleeping = false;
      events.push({ type: 'died' });
      return;
    }
  }

  // ---- puntaje de cuidado (promedio móvil ~24h) ----
  const mean = (st.hunger + st.energy + st.hygiene + st.happiness) / 4;
  state.careScore += (mean - state.careScore) * Math.min(1, sim / (24 * HOUR));

  // ---- evolución ----
  if (state.stage === 'baby' && state.stageMs >= DUR.baby) {
    state.stage = 'child';
    state.stageMs = 0;
    events.push({ type: 'evolve', stage: 'child' });
  } else if (state.stage === 'child' && state.stageMs >= DUR.child) {
    state.stage = 'adult';
    state.stageMs = 0;
    state.form = state.careScore >= 65 ? 'good' : 'rowdy';
    events.push({ type: 'evolve', stage: 'adult', form: state.form });
  }
}

// Catch-up al abrir la app o volver de segundo plano.
export function simulate(state, now) {
  const events = [];
  let dt = now - state.lastTick;
  if (dt < 0) dt = 0;                       // reloj hacia atrás
  if (dt > CATCHUP_CAP) dt = CATCHUP_CAP;   // tope de simulación
  let t = now - dt;
  while (dt > 0 && !state.dead) {
    const d = Math.min(dt, STEP);
    step(state, d, t, events);
    t += d;
    dt -= d;
  }
  state.lastTick = now;
  return events;
}

// Tick por frame con la app abierta.
export function tick(state, dtMs, now) {
  const events = [];
  step(state, dtMs, now, events);
  state.lastTick = now;
  return events;
}

// ---- acciones de cuidado ----
export const act = {
  feed(state) {
    const s = state.stats;
    if (state.dead || state.stage === 'egg' || state.flags.sleeping) return false;
    if (s.hunger >= 98) return false;
    s.hunger = clampStat(s.hunger + 30);
    s.happiness = clampStat(s.happiness + 4);
    return true;
  },
  light(state) {
    if (state.dead || state.stage === 'egg') return false;
    state.flags.sleeping = !state.flags.sleeping;
    state.flags.autoSleep = false;
    return true;
  },
  clean(state) {
    if (state.dead || state.stage === 'egg') return false;
    state.stats.hygiene = clampStat(state.stats.hygiene + 60);
    state.flags.poops = 0;
    return true;
  },
  medicine(state) {
    if (state.dead || !state.flags.sick) return false;
    state.flags.sick = false;
    state.sickMs = 0;
    for (const k of Object.keys(state.zt)) state.zt[k] = 0;
    return true;
  },
  canPlay(state) {
    return !state.dead && state.stage !== 'egg' && !state.flags.sleeping &&
      !state.flags.sick && state.stats.energy > 15;
  },
  gameReward(state, score) {
    const s = state.stats;
    s.happiness = clampStat(s.happiness + Math.min(40, Math.round(score / 4)));
    s.energy = clampStat(s.energy - 8);
    s.hunger = clampStat(s.hunger - 6);
    return Math.min(40, Math.round(score / 4));
  },
};
