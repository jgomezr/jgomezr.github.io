// IndexedDB — wrapper mínimo de promesas. Una base local, cero servidores.

const DB_NAME = 'brasa';
const DB_VERSION = 1;
let dbPromise = null;

function open() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      db.createObjectStore('kv');                                          // settings, alterEgo, program
      db.createObjectStore('tests', { keyPath: 'id', autoIncrement: true });
      db.createObjectStore('checkins', { keyPath: 'key' });                // `${date}:${am|pm}`
      db.createObjectStore('habits', { keyPath: 'id', autoIncrement: true });
      db.createObjectStore('habit_logs', { keyPath: 'key' });              // `${date}:${habitId}`
      db.createObjectStore('progress', { keyPath: 'id' });                 // ejercicios del programa
      db.createObjectStore('deliverables', { keyPath: 'week' });
      db.createObjectStore('thoughts', { keyPath: 'id', autoIncrement: true });
      db.createObjectStore('invocations', { keyPath: 'id', autoIncrement: true });
      db.createObjectStore('ring', { keyPath: 'date' });
      db.createObjectStore('chats', { keyPath: 'id', autoIncrement: true });
      db.createObjectStore('focus', { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

const REQ = Symbol('req');

function tx(store, mode, fn) {
  return open().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(store, mode);
        const s = t.objectStore(store);
        const out = fn(s);
        t.oncomplete = () => resolve(out && out[REQ] ? out.value : out);
        t.onerror = () => reject(t.error);
      })
  );
}

function reqVal(request) {
  const box = { [REQ]: true, value: undefined };
  request.onsuccess = () => { box.value = request.result; };
  return box;
}

export const db = {
  get: (store, key) => tx(store, 'readonly', (s) => reqVal(s.get(key))),
  all: (store) => tx(store, 'readonly', (s) => reqVal(s.getAll())),
  put: (store, value) => tx(store, 'readwrite', (s) => reqVal(s.put(value))),
  del: (store, key) => tx(store, 'readwrite', (s) => s.delete(key)),
  clear: (store) => tx(store, 'readwrite', (s) => s.clear()),

  // kv
  kvGet: (key) => tx('kv', 'readonly', (s) => reqVal(s.get(key))),
  kvSet: (key, value) => tx('kv', 'readwrite', (s) => s.put(value, key)),
  kvDel: (key) => tx('kv', 'readwrite', (s) => s.delete(key)),
};

const STORES = ['kv', 'tests', 'checkins', 'habits', 'habit_logs', 'progress',
  'deliverables', 'thoughts', 'invocations', 'ring', 'chats', 'focus'];

export async function exportAll() {
  const out = { app: 'brasa', version: DB_VERSION, exportedAt: new Date().toISOString(), data: {} };
  for (const st of STORES) {
    if (st === 'kv') {
      const d = await open();
      out.data.kv = await new Promise((res, rej) => {
        const t = d.transaction('kv', 'readonly').objectStore('kv');
        const kv = {};
        const cur = t.openCursor();
        cur.onsuccess = () => {
          const c = cur.result;
          if (c) { kv[c.key] = c.value; c.continue(); } else res(kv);
        };
        cur.onerror = () => rej(cur.error);
      });
    } else {
      out.data[st] = await db.all(st);
    }
  }
  return out;
}

export async function importAll(dump) {
  if (!dump || dump.app !== 'brasa' || !dump.data) throw new Error('Archivo no reconocido');
  for (const st of STORES) {
    if (!(st in dump.data)) continue;
    await db.clear(st);
    if (st === 'kv') {
      for (const [k, v] of Object.entries(dump.data.kv)) await db.kvSet(k, v);
    } else {
      for (const row of dump.data[st]) await db.put(st, row);
    }
  }
}
