import { useEffect, useState } from 'react'
import { onTables } from '../db/events'

/** Re-ejecuta una consulta cuando cambian las tablas indicadas (reactividad ligera). */
export function useLive<T>(query: () => Promise<T>, tables: string[], initial: T): T {
  const [data, setData] = useState<T>(initial)
  useEffect(() => {
    let alive = true
    const run = () => {
      void query().then((r) => {
        if (alive) setData(r)
      })
    }
    run()
    const off = onTables(tables, run)
    return () => {
      alive = false
      off()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return data
}
