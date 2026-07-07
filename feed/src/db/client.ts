import type { DBLike, SqlValue } from './dbi'

interface Pending {
  resolve: (rows: unknown) => void
  reject: (err: Error) => void
}

const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
const pending = new Map<number, Pending>()
let seq = 0

worker.onmessage = (ev: MessageEvent<{ id: number; ok: boolean; rows?: unknown[]; error?: string }>) => {
  const { id, ok, rows, error } = ev.data
  const p = pending.get(id)
  if (!p) return
  pending.delete(id)
  if (ok) p.resolve(rows)
  else p.reject(new Error(error ?? 'Error de BD'))
}

function post(method: 'select' | 'run', sql: string, params?: SqlValue[]): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const id = ++seq
    pending.set(id, { resolve, reject })
    worker.postMessage({ id, method, sql, params })
  })
}

export const dbClient: DBLike = {
  select: <T>(sql: string, params?: SqlValue[]) => post('select', sql, params) as Promise<T[]>,
  run: async (sql: string, params?: SqlValue[]) => {
    await post('run', sql, params)
  },
}
