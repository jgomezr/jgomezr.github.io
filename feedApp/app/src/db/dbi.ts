/**
 * Interfaz mínima de acceso a la BD. La implementan:
 *  - el cliente del worker sqlite-wasm (app)
 *  - un adaptador node:sqlite en memoria (tests)
 */
export type SqlValue = string | number | null

export interface DBLike {
  select<T = Record<string, unknown>>(sql: string, params?: SqlValue[]): Promise<T[]>
  run(sql: string, params?: SqlValue[]): Promise<void>
}
