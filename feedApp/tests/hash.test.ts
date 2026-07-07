import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { hashContent, hashUrl } from '../src/lib/hash'

const sha1 = (s: string) => createHash('sha1').update(s, 'utf8').digest('hex')

describe('hash de dedupe', () => {
  it('hashUrl recorta espacios y coincide con SHA-1 de referencia', async () => {
    const url = 'https://example.com/articulo'
    expect(await hashUrl(`  ${url} `)).toBe(sha1(url))
  })

  it('hashContent usa título + primeros 200 caracteres', async () => {
    const title = 'Cap. 3 — Anclajes'
    const text = 'x'.repeat(500)
    expect(await hashContent(title, text)).toBe(sha1(`${title}|${'x'.repeat(200)}`))
  })

  it('hashContent con texto corto no falla', async () => {
    expect(await hashContent('t', 'corto')).toBe(sha1('t|corto'))
  })
})
