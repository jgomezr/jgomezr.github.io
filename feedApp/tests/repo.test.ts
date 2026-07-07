import { beforeEach, describe, expect, it } from 'vitest'
import { makeTestDb } from './test-db'
import { makeRepo, type Repo } from '../src/db/repo'
import { hashUrl } from '../src/lib/hash'
import type { NewCard } from '../src/types'

function card(over: Partial<NewCard> = {}): NewCard {
  return {
    title: 'Título',
    summary: 'Resumen de prueba con varias frases.',
    category: 'web',
    estReadMin: 2,
    originalUrl: 'https://example.com/a',
    citation: null,
    citationSource: null,
    sourceType: 'rss',
    publishedAt: null,
    ...over,
  }
}

let repo: Repo

beforeEach(() => {
  repo = makeRepo(makeTestDb())
})

describe('dedupe por content_hash', () => {
  it('la misma URL insertada dos veces produce una sola tarjeta', async () => {
    await repo.insertCards([card()])
    await repo.insertCards([card({ summary: 'otro resumen' })])
    expect(await repo.loadFeed()).toHaveLength(1)
  })

  it('contenido sin URL deduplica por título+texto', async () => {
    const c = card({ originalUrl: null, sourceType: 'manual' })
    await repo.insertCards([c])
    await repo.insertCards([c])
    const feed = await repo.loadFeed()
    expect(feed).toHaveLength(1)
    expect(feed[0].originalUrl).toBeNull()
  })

  it('respeta un contentHash precalculado (dedupe de ingesta)', async () => {
    const h = await hashUrl('https://feed-item.example/x')
    await repo.insertCards([card({ contentHash: h })])
    expect(await repo.existingHashes([h, 'otro'])).toEqual(new Set([h]))
  })

  it('existingHashes con lista vacía devuelve set vacío', async () => {
    expect(await repo.existingHashes([])).toEqual(new Set())
  })
})

describe('purga diaria (§12)', () => {
  it('borra solo lo no guardado/likeado/protegido y limpia interacciones huérfanas', async () => {
    await repo.insertCards([
      card({ originalUrl: 'https://e.com/likeada' }),
      card({ originalUrl: 'https://e.com/guardada' }),
      card({ originalUrl: 'https://e.com/skipeada' }),
      card({ originalUrl: 'https://e.com/suelta' }),
    ])
    await repo.insertCards([card({ originalUrl: null, title: 'Libro', sourceType: 'book' })], {
      protected: true,
    })
    const feed = await repo.loadFeed()
    expect(feed).toHaveLength(5)
    const byUrl = (u: string) => feed.find((c) => c.originalUrl?.endsWith(u))!.id

    await repo.addInteraction(byUrl('likeada'), 'like')
    await repo.addInteraction(byUrl('guardada'), 'save')
    await repo.addInteraction(byUrl('skipeada'), 'skip')

    const purged = await repo.purgeUnsaved()
    expect(purged).toBe(2) // skipeada + suelta

    const remaining = await repo.loadFeed()
    expect(remaining.map((c) => c.title).sort()).toEqual(['Libro', 'Título', 'Título'].sort())
    // la interacción skip quedó huérfana y se limpió
    expect(await repo.interactionMap()).not.toHaveProperty(String(byUrl('skipeada')))
  })

  it('con BD vacía no falla y devuelve 0', async () => {
    expect(await repo.purgeUnsaved()).toBe(0)
  })
})

describe('interacciones', () => {
  it('toggle like añade y quita; loadSaved refleja like y save sin duplicar', async () => {
    await repo.insertCards([card()])
    const [c] = await repo.loadFeed()

    expect(await repo.toggleInteraction(c.id, 'like')).toBe(true)
    expect(await repo.toggleInteraction(c.id, 'save')).toBe(true)
    expect(await repo.loadSaved()).toHaveLength(1) // like+save, una sola fila

    expect(await repo.toggleInteraction(c.id, 'like')).toBe(false)
    expect(await repo.loadSaved()).toHaveLength(1) // sigue con save

    expect(await repo.toggleInteraction(c.id, 'save')).toBe(false)
    expect(await repo.loadSaved()).toHaveLength(0)
  })
})

describe('fuentes', () => {
  it('CRUD y URL única', async () => {
    await repo.addSource({ url: 'https://blog.example/rss', type: 'rss', categoryHint: 'tecnologia' })
    await repo.addSource({ url: 'https://blog.example/rss', type: 'rss' }) // duplicada: se ignora
    await repo.addSource({ url: 'http://export.arxiv.org/rss/cs.AI', type: 'scientific' })

    let sources = await repo.listSources()
    expect(sources).toHaveLength(2)

    await repo.setSourceActive(sources[0].id, false)
    expect(await repo.listSources(true)).toHaveLength(1)

    await repo.touchFetched([sources[1].id])
    sources = await repo.listSources()
    expect(sources.find((s) => s.type === 'scientific')!.lastFetched).toBeTruthy()

    await repo.deleteSource(sources[0].id)
    expect(await repo.listSources()).toHaveLength(1)
  })
})

describe('biblioteca', () => {
  it('loadProtected lista solo lo curado y updateCitation marca citation_source=user', async () => {
    await repo.insertCards([card()])
    await repo.insertCards(
      [card({ originalUrl: null, title: 'Paper', sourceType: 'scientific', citation: 'Doe (2026)...', citationSource: 'crossref' })],
      { protected: true },
    )
    const prot = await repo.loadProtected()
    expect(prot).toHaveLength(1)

    await repo.updateCitation(prot[0].id, 'Doe, J. (2026). Corregida.')
    const [after] = await repo.loadProtected()
    expect(after.citation).toBe('Doe, J. (2026). Corregida.')
    expect(after.citationSource).toBe('user')
  })
})
