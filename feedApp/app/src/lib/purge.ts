import { repo } from '../db'
import { getLastPurgeDate, setLastPurgeDate } from './settings'

const todayKey = () => new Date().toISOString().slice(0, 10)

/** Fallback de arranque (§12): si la última purga no fue hoy, corre la limpieza diaria. */
export async function purgeIfDue(): Promise<number> {
  if (getLastPurgeDate() === todayKey()) return 0
  const n = await repo.purgeUnsaved()
  setLastPurgeDate(todayKey())
  return n
}

/** Purga manual (botón de Ajustes para pruebas). */
export async function purgeNow(): Promise<number> {
  const n = await repo.purgeUnsaved()
  setLastPurgeDate(todayKey())
  return n
}
