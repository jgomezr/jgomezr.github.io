export type Category = 'ciencia' | 'filosofia' | 'tecnologia' | 'web' | 'podcast'
export type SourceType = 'rss' | 'scientific' | 'book' | 'manual'
export type CitationSource = 'crossref' | 'arxiv' | 'isbn' | 'user' | null

export interface Card {
  id: number
  sourceId: number | null
  contentHash: string
  originalUrl: string | null
  title: string
  summary: string
  category: Category
  sourceType: SourceType
  citation: string | null
  citationSource: CitationSource
  protected: boolean
  estReadMin: number
  publishedAt: string | null
  createdAt: string
}

/** Card tal como llega del webhook summarize-batch, antes de insertarse. */
export interface NewCard {
  title: string
  summary: string
  category: Category
  estReadMin: number
  originalUrl: string | null
  citation: string | null
  citationSource: CitationSource
  sourceType: SourceType
  publishedAt: string | null
  /** hash precalculado (dedupe de ingesta); si falta se deriva de originalUrl o título+resumen */
  contentHash?: string
}

export interface Source {
  id: number
  type: 'rss' | 'scientific'
  url: string
  title: string | null
  categoryHint: string | null
  active: boolean
  lastFetched: string | null
}

/** Item del contrato del webhook (§6 del PRD): url/rawText/doi/arxivId/isbn + sourceType. */
export interface WebhookItem {
  url?: string
  rawText?: string
  title?: string
  doi?: string
  arxivId?: string
  isbn?: string
  chapterTitle?: string
  pages?: string
  sourceType: SourceType
  category_hint?: string
  publishedAt?: string
}

/** Item que devuelve fetch-feeds. */
export interface FeedItem extends WebhookItem {
  feedUrl: string
}

export type InteractionType = 'like' | 'save' | 'skip'
