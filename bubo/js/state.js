// Store reactivo con patrón pub/sub

const state = {
  user: null,       // { role: 'leader'|'rover', nombre, email, id, row }
  rovers: [],       // Array de objetos Rover
  headers: [],      // Encabezados del sheet
  loading: false,
  lastFetch: 0,
};

const listeners = new Map();

export function getState() {
  return state;
}

export function setState(partial) {
  Object.assign(state, partial);
  notify(Object.keys(partial));
}

export function subscribe(key, fn) {
  if (!listeners.has(key)) {
    listeners.set(key, new Set());
  }
  listeners.get(key).add(fn);
  return () => listeners.get(key).delete(fn);
}

function notify(keys) {
  for (const key of keys) {
    if (listeners.has(key)) {
      for (const fn of listeners.get(key)) {
        fn(state[key]);
      }
    }
  }
}
