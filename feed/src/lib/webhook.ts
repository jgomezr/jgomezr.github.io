import { getWebhookBase } from './settings'
import type { Category, CitationSource, FeedItem, NewCard, SourceType, WebhookItem } from '../types'

const ALLOWED_CATS: Category[] = ['ciencia', 'filosofia', 'tecnologia', 'web', 'podcast']

function toNewCard(e: Record<string, unknown>): NewCard {
  const cat = e.category as Category
  return {
    title: String(e.title ?? 'Sin título'),
    summary: String(e.summary ?? ''),
    category: ALLOWED_CATS.includes(cat) ? cat : 'web',
    estReadMin: Number.isFinite(e.estReadMin as number) ? (e.estReadMin as number) : 2,
    originalUrl: (e.originalUrl as string) ?? null,
    citation: (e.citation as string) ?? null,
    citationSource: (e.citationSource as CitationSource) ?? null,
    sourceType: (e.sourceType as SourceType) ?? 'rss',
    publishedAt: (e.publishedAt as string) ?? null,
  }
}

export interface SummarizeResult {
  cards: NewCard[]
  failed: Array<Record<string, unknown>>
}

function endpoint(path: string): string {
  const base = getWebhookBase()
  if (!base) throw new Error('Webhook no configurado')
  return `${base}/${path}`
}

async function postJson(url: string, body: unknown, timeoutMs: number): Promise<Record<string, unknown>> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    })
    return (await res.json()) as Record<string, unknown>
  } finally {
    clearTimeout(timer)
  }
}

/** Llama a fetch-feeds: la app no lee RSS (CORS); n8n lo hace y devuelve items normalizados. */
export async function fetchFeeds(
  feeds: Array<{ url: string; type: 'rss' | 'scientific'; categoryHint?: string | null }>,
): Promise<FeedItem[]> {
  if (!feeds.length) return []
  const body = await postJson(endpoint('fetch-feeds'), { feeds }, 60_000)
  if (body.ok !== true) throw new Error(String(body.error ?? 'Error en fetch-feeds'))
  return (body.items as FeedItem[]) ?? []
}

/** Llama a summarize-batch con items genéricos (§6 del PRD). */
export async function summarizeBatch(items: WebhookItem[]): Promise<SummarizeResult> {
  const body = await postJson(endpoint('summarize-batch'), { items }, 90_000)
  if (body.ok !== true) throw new Error(String(body.error ?? 'Error en summarize-batch'))
  return {
    cards: ((body.cards as Record<string, unknown>[]) ?? []).map(toNewCard),
    failed: (body.failed as Array<Record<string, unknown>>) ?? [],
  }
}

/** Prueba de conexión (§10): payload de ejemplo, valida el shape esperado. */
export async function testConnection(): Promise<{ ok: boolean; detail: string }> {
  try {
    const body = await postJson(endpoint('summarize-batch'), { items: [] }, 20_000)
    const shapeOk = 'ok' in body && 'cards' in body && 'failed' in body
    return shapeOk
      ? { ok: true, detail: 'Conexión correcta. El webhook respondió con el formato esperado.' }
      : { ok: false, detail: 'Respondió, pero sin los campos ok/cards/failed.' }
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : 'No se pudo conectar.' }
  }
}
