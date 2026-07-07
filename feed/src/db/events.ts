/** Emisor mínimo para reactividad: los writes del repo tocan tablas, las vistas se re-consultan. */
type Listener = () => void

const listeners = new Map<string, Set<Listener>>()

export function onTables(tables: string[], fn: Listener): () => void {
  for (const t of tables) {
    if (!listeners.has(t)) listeners.set(t, new Set())
    listeners.get(t)!.add(fn)
  }
  return () => {
    for (const t of tables) listeners.get(t)?.delete(fn)
  }
}

export function touch(...tables: string[]) {
  const fired = new Set<Listener>()
  for (const t of tables) {
    for (const fn of listeners.get(t) ?? []) {
      if (!fired.has(fn)) {
        fired.add(fn)
        fn()
      }
    }
  }
}
