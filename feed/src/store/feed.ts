import { create } from 'zustand'
import { repo } from '../db'
import { refreshFromSources } from '../lib/ingest'
import type { Card } from '../types'

interface FeedState {
  cards: Card[]
  currentIndex: number
  isLoading: boolean
  exhaustedUntil: number | null
  atEnd: boolean
  init: () => Promise<void>
  onPageChange: (index: number) => void
  refresh: () => Promise<void>
}

const PREFETCH_THRESHOLD = 3
const COOLDOWN_MS = 10 * 60 * 1000

export const useFeed = create<FeedState>((set, get) => ({
  cards: [],
  currentIndex: 0,
  isLoading: false,
  exhaustedUntil: null,
  atEnd: false,

  async init() {
    const cards = await repo.loadFeed()
    set({ cards })
  },

  onPageChange(index) {
    set({ currentIndex: index })
    const { cards } = get()
    const remaining = cards.length - 1 - index
    if (remaining <= PREFETCH_THRESHOLD) void prefetch(set, get)
  },

  // Pull-to-refresh / manual: ignora el guard de cooldown.
  async refresh() {
    if (get().isLoading) return
    set({ isLoading: true, exhaustedUntil: null })
    await runIngest(set, get)
  },
}))

type Set = (partial: Partial<FeedState>) => void
type Get = () => FeedState

async function prefetch(set: Set, get: Get) {
  const s = get()
  if (s.isLoading) return
  if (s.exhaustedUntil && Date.now() < s.exhaustedUntil) {
    set({ atEnd: true })
    return
  }
  set({ isLoading: true })
  await runIngest(set, get)
}

async function runIngest(set: Set, get: Get) {
  try {
    await refreshFromSources()
    const existing = new Set(get().cards.map((c) => c.contentHash))
    const all = await repo.loadFeed()
    const fresh = all.filter((c) => !existing.has(c.contentHash))

    if (fresh.length === 0) {
      set({ isLoading: false, exhaustedUntil: Date.now() + COOLDOWN_MS, atEnd: true })
    } else {
      set({ cards: [...get().cards, ...fresh], isLoading: false, exhaustedUntil: null, atEnd: false })
    }
  } catch {
    // Sin red u otro error: liberar el guard, reintento en el próximo umbral.
    set({ isLoading: false })
  }
}
