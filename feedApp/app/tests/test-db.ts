import { DatabaseSync } from 'node:sqlite'
import type { DBLike, SqlValue } from '../src/db/dbi'
import { SCHEMA } from '../src/db/schema'

/** Adaptador de DBLike sobre node:sqlite (en memoria) — mismas semánticas SQLite que la app. */
export function makeTestDb(): DBLike {
  const d = new DatabaseSync(':memory:')
  d.exec(SCHEMA)
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select: async <T>(sql: string, params: SqlValue[] = []) =>
      d.prepare(sql).all(...params) as T[],
    run: async (sql: string, params: SqlValue[] = []) => {
      d.prepare(sql).run(...params)
    },
  }
}
