import { repo } from '../db'
import { hashUrl } from './hash'
import { fetchFeeds, summarizeBatch } from './webhook'
import type { FeedItem, WebhookItem } from '../types'

const BATCH_SIZE = 6

function slices<T>(arr: T[], n: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}

/** Hash de dedupe de un item de feed: por su URL de artículo. */
async function itemHash(item: FeedItem): Promise<string | null> {
  if (item.url) return hashUrl(item.url)
  if (item.arxivId) return hashUrl(`https://arxiv.org/abs/${item.arxivId}`)
  if (item.doi) return hashUrl(`https://doi.org/${item.doi}`)
  return null
}

export interface IngestReport {
  fetched: number
  inserted: number
  failed: number
}

/**
 * Ciclo completo camino A (§5): fuentes activas → fetch-feeds → dedupe local
 * → lotes de 6 en secuencia → summarize-batch → insertCards. Devuelve cuánto entró.
 */
export async function refreshFromSources(): Promise<IngestReport> {
  const sources = await repo.listSources(true)
  if (!sources.length) return { fetched: 0, inserted: 0, failed: 0 }

  const items = await fetchFeeds(
    sources.map((s) => ({ url: s.url, type: s.type, categoryHint: s.categoryHint })),
  )

  // Dedupe local contra SQLite (por content_hash).
  const withHash = await Promise.all(items.map(async (it) => ({ it, hash: await itemHash(it) })))
  const candidateHashes = withHash.map((x) => x.hash).filter((h): h is string => !!h)
  const existing = await repo.existingHashes(candidateHashes)
  const fresh = withHash.filter((x) => x.hash && !existing.has(x.hash))

  // Mapa feedUrl → source.id, para actualizar last_fetched.
  const byUrl = new Map(sources.map((s) => [s.url, s.id]))
  const touchedSources = new Set<number>()

  let inserted = 0
  let failed = 0

  for (const batch of slices(fresh, BATCH_SIZE)) {
    const payload: WebhookItem[] = batch.map(({ it }) => {
      const { feedUrl: _feedUrl, ...rest } = it
      return rest
    })
    try {
      const res = await summarizeBatch(payload)
      // Adjuntar hash precalculado para que insertCards no re-derive (y respetar dedupe de ingesta).
      const cards = res.cards.map((c, i) => ({ ...c, contentHash: batch[i]?.hash ?? undefined }))
      await repo.insertCards(cards)
      inserted += res.cards.length
      failed += res.failed.length
      for (const { it } of batch) {
        const sid = byUrl.get(it.feedUrl)
        if (sid) touchedSources.add(sid)
      }
    } catch {
      // Lote fallido: se reintenta en el próximo refresh, sin abortar el resto.
      failed += batch.length
    }
  }

  await repo.touchFetched([...touchedSources])
  return { fetched: items.length, inserted, failed }
}

/** Camino B (§6.2): ingesta manual desde Biblioteca. Nace protegida. */
export async function ingestManual(item: WebhookItem): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await summarizeBatch([item])
    if (!res.cards.length) {
      return { ok: false, error: res.failed[0]?.error ? String(res.failed[0].error) : 'No se pudo resumir' }
    }
    await repo.insertCards(res.cards, { protected: true })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error de red' }
  }
}
