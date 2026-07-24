// Estado del juego + persistencia en localStorage.

const KEY = 'tama-save-v1';

export function freshState(now, generation = 1) {
  return {
    version: 1,
    species: null,          // capybara | puma | condor
    stage: 'egg',           // egg | baby | child | adult
    form: 'base',           // base | good | rowdy
    createdAt: now,
    lastTick: now,
    ageMs: 0,
    stageMs: 0,
    stats: { hunger: 100, energy: 100, hygiene: 100, happiness: 100 },
    careScore: 80,
    neglectCount: 0,
    sickMs: 0,
    flags: { sleeping: false, sick: false, autoSleep: false, poops: 0 },
    zt: { hunger: 0, energy: 0, hygiene: 0, happiness: 0 },
    generation,
    dead: false,
  };
}

export function newPet(state, species, now) {
  const s = freshState(now, state.generation);
  s.species = species;
  Object.assign(state, s);
  saveState(state);
  return state;
}

export function loadState(now) {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return freshState(now);
    const s = JSON.parse(raw);
    if (!s || s.version !== 1 || !s.stats) return freshState(now);
    // merge sobre fresh para tolerar campos nuevos en versiones futuras
    const base = freshState(now, s.generation || 1);
    const merged = { ...base, ...s };
    merged.stats = { ...base.stats, ...s.stats };
    merged.flags = { ...base.flags, ...s.flags };
    merged.zt = { ...base.zt, ...s.zt };
    return merged;
  } catch {
    return freshState(now);
  }
}

export function saveState(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* sin espacio */ }
}

export function wipeSave() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
