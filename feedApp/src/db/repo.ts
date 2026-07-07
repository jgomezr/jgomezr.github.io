import type { DBLike, SqlValue } from './dbi'
import { touch } from './events'
import { hashContent, hashUrl } from '../lib/hash'
import type { Card, InteractionType, NewCard, Source } from '../types'

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToCard(r: any): Card {
  return {
    id: r.id,
    sourceId: r.source_id,
    contentHash: r.content_hash,
    originalUrl: r.original_url,
    title: r.title,
    summary: r.summary,
    category: r.category,
    sourceType: r.source_type,
    citation: r.citation,
    citationSource: r.citation_source,
    protected: !!r.protected,
    estReadMin: r.est_read_min,
    publishedAt: r.published_at,
    createdAt: r.created_at,
  }
}

function rowToSource(r: any): Source {
  return {
    id: r.id,
    type: r.type,
    url: r.url,
    title: r.title,
    categoryHint: r.category_hint,
    active: !!r.active,
    lastFetched: r.last_fetched,
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function placeholders(n: number): string {
  return Array(n).fill('?').join(',')
}

export function makeRepo(db: DBLike) {
  return {
    // ---- Cards ----

    /** Inserta con INSERT OR IGNORE: un content_hash repetido nunca duplica (§5 del PRD). */
    async insertCards(cards: NewCard[], opts: { sourceId?: number | null; protected?: boolean } = {}) {
      for (const c of cards) {
        const hash =
          c.contentHash ??
          (c.originalUrl ? await hashUrl(c.originalUrl) : await hashContent(c.title, c.summary))
        await db.run(
          `INSERT OR IGNORE INTO cards
             (source_id, content_hash, original_url, title, summary, category,
              source_type, citation, citation_source, protected, est_read_min, published_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
          [
            opts.sourceId ?? null,
            hash,
            c.originalUrl ?? null,
            c.title,
            c.summary,
            c.category,
            c.sourceType,
            c.citation ?? null,
            c.citationSource ?? null,
            opts.protected ? 1 : 0,
            c.estReadMin ?? 2,
            c.publishedAt ?? null,
          ],
        )
      }
      if (cards.length) touch('cards')
    },

    /** De una lista de hashes, devuelve los que YA existen (para filtrar nuevas). */
    async existingHashes(hashes: string[]): Promise<Set<string>> {
      if (!hashes.length) return new Set()
      const rows = await db.select<{ content_hash: string }>(
        `SELECT content_hash FROM cards WHERE content_hash IN (${placeholders(hashes.length)})`,
        hashes,
      )
      return new Set(rows.map((r) => r.content_hash))
    },

    async loadFeed(): Promise<Card[]> {
      const rows = await db.select(`SELECT * FROM cards ORDER BY created_at DESC, id DESC`)
      return rows.map(rowToCard)
    },

    /** Tarjetas con like o save: lo que sobrevive offline y a la purga. */
    async loadSaved(): Promise<Card[]> {
      const rows = await db.select(
        `SELECT DISTINCT c.* FROM cards c
           JOIN interactions i ON i.card_id = c.id
          WHERE i.type IN ('like','save')
          ORDER BY c.created_at DESC, c.id DESC`,
      )
      return rows.map(rowToCard)
    },

    /** Contenido curado de Biblioteca (protegido). */
    async loadProtected(): Promise<Card[]> {
      const rows = await db.select(
        `SELECT * FROM cards WHERE protected = 1 ORDER BY created_at DESC, id DESC`,
      )
      return rows.map(rowToCard)
    },

    async updateCitation(cardId: number, citation: string) {
      await db.run(`UPDATE cards SET citation = ?, citation_source = 'user' WHERE id = ?`, [
        citation,
        cardId,
      ])
      touch('cards')
    },

    /**
     * Limpieza diaria (§12): borra tarjetas sin like/save y no protegidas.
     * Devuelve cuántas se borraron. Limpia también interacciones huérfanas (skip).
     */
    async purgeUnsaved(): Promise<number> {
      // Primero las interacciones (skip) de las tarjetas purgables, para respetar la FK.
      await db.run(
        `DELETE FROM interactions
          WHERE card_id IN (
            SELECT id FROM cards
             WHERE protected = 0
               AND id NOT IN (SELECT card_id FROM interactions WHERE type IN ('like','save')))`,
      )
      await db.run(
        `DELETE FROM cards
          WHERE protected = 0
            AND id NOT IN (SELECT DISTINCT card_id FROM interactions WHERE type IN ('like','save'))`,
      )
      const [{ n }] = await db.select<{ n: number }>(`SELECT changes() AS n`)
      if (n > 0) touch('cards', 'interactions')
      return n
    },

    // ---- Interactions ----

    async addInteraction(cardId: number, type: InteractionType) {
      await db.run(`INSERT INTO interactions (card_id, type) VALUES (?,?)`, [cardId, type])
      touch('interactions')
    },

    /** Alterna like/save. Devuelve el estado final (true = activo). */
    async toggleInteraction(cardId: number, type: 'like' | 'save'): Promise<boolean> {
      const rows = await db.select<{ id: number }>(
        `SELECT id FROM interactions WHERE card_id = ? AND type = ?`,
        [cardId, type],
      )
      if (rows.length) {
        await db.run(`DELETE FROM interactions WHERE card_id = ? AND type = ?`, [cardId, type])
        touch('interactions')
        return false
      }
      await db.run(`INSERT INTO interactions (card_id, type) VALUES (?,?)`, [cardId, type])
      touch('interactions')
      return true
    },

    /** Mapa cardId → {like, save} para pintar el estado de los botones. */
    async interactionMap(): Promise<Record<number, { like: boolean; save: boolean }>> {
      const rows = await db.select<{ card_id: number; type: string }>(
        `SELECT card_id, type FROM interactions WHERE type IN ('like','save')`,
      )
      const map: Record<number, { like: boolean; save: boolean }> = {}
      for (const r of rows) {
        map[r.card_id] ??= { like: false, save: false }
        map[r.card_id][r.type as 'like' | 'save'] = true
      }
      return map
    },

    // ---- Sources ----

    async listSources(onlyActive = false): Promise<Source[]> {
      const rows = await db.select(
        `SELECT * FROM sources ${onlyActive ? 'WHERE active = 1' : ''} ORDER BY id`,
      )
      return rows.map(rowToSource)
    },

    async addSource(s: { url: string; type: 'rss' | 'scientific'; title?: string; categoryHint?: string }) {
      await db.run(
        `INSERT OR IGNORE INTO sources (url, type, title, category_hint) VALUES (?,?,?,?)`,
        [s.url.trim(), s.type, s.title ?? null, s.categoryHint ?? null],
      )
      touch('sources')
    },

    async setSourceActive(id: number, active: boolean) {
      await db.run(`UPDATE sources SET active = ? WHERE id = ?`, [active ? 1 : 0, id])
      touch('sources')
    },

    async deleteSource(id: number) {
      await db.run(`DELETE FROM sources WHERE id = ?`, [id])
      touch('sources')
    },

    async touchFetched(sourceIds: number[]) {
      if (!sourceIds.length) return
      await db.run(
        `UPDATE sources SET last_fetched = datetime('now') WHERE id IN (${placeholders(sourceIds.length)})`,
        sourceIds as SqlValue[],
      )
      touch('sources')
    },
  }
}

export type Repo = ReturnType<typeof makeRepo>
