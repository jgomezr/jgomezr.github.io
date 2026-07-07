/// <reference lib="webworker" />
import sqlite3InitModule from '@sqlite.org/sqlite-wasm'
import { SCHEMA } from './schema'
import type { SqlValue } from './dbi'

interface Req {
  id: number
  method: 'select' | 'run'
  sql: string
  params?: SqlValue[]
}

// Los tipos de sqlite-wasm son incompletos; se accede vía any de forma controlada.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbPromise: Promise<any> = (async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sqlite3 = await (sqlite3InitModule as any)({
    print: () => {},
    printErr: (msg: string) => console.error('[sqlite]', msg),
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any
  try {
    // OPFS SAHPool: persistente y sin requerir cabeceras COOP/COEP
    const pool = await sqlite3.installOpfsSAHPoolVfs({ directory: '/feed-db' })
    db = new pool.OpfsSAHPoolDb('/feed.db')
  } catch (e) {
    console.warn('[db] OPFS no disponible; usando BD en memoria (no persistente)', e)
    db = new sqlite3.oo1.DB(':memory:', 'c')
  }
  db.exec(SCHEMA)
  return db
})()

self.onmessage = async (ev: MessageEvent<Req>) => {
  const { id, method, sql, params } = ev.data
  try {
    const db = await dbPromise
    if (method === 'select') {
      const rows: unknown[] = []
      db.exec({ sql, bind: params ?? [], rowMode: 'object', resultRows: rows })
      self.postMessage({ id, ok: true, rows })
    } else {
      db.exec({ sql, bind: params ?? [] })
      self.postMessage({ id, ok: true })
    }
  } catch (e) {
    self.postMessage({ id, ok: false, error: e instanceof Error ? e.message : String(e) })
  }
}
