import { useState } from 'react'
import { repo } from '../db'
import { useLive } from '../store/useLive'
import { ingestManual } from '../lib/ingest'
import type { Card, WebhookItem } from '../types'

type Mode = 'book' | 'paper' | 'text'

export function Library({ online }: { online: boolean }) {
  const items = useLive(() => repo.loadProtected(), ['cards'], [] as Card[])
  const [mode, setMode] = useState<Mode>('book')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null)

  // Campos
  const [title, setTitle] = useState('')
  const [rawText, setRawText] = useState('')
  const [isbn, setIsbn] = useState('')
  const [chapterTitle, setChapterTitle] = useState('')
  const [pages, setPages] = useState('')
  const [doi, setDoi] = useState('')
  const [arxivId, setArxivId] = useState('')
  const [url, setUrl] = useState('')

  const [editing, setEditing] = useState<Card | null>(null)
  const [citationDraft, setCitationDraft] = useState('')

  const reset = () => {
    setTitle('')
    setRawText('')
    setIsbn('')
    setChapterTitle('')
    setPages('')
    setDoi('')
    setArxivId('')
    setUrl('')
  }

  const submit = async () => {
    setStatus(null)
    let item: WebhookItem
    if (mode === 'book') {
      if (!rawText.trim() || !title.trim()) return setStatus({ ok: false, msg: 'Título y texto son obligatorios.' })
      item = {
        sourceType: 'book',
        rawText,
        title,
        isbn: isbn.trim() || undefined,
        chapterTitle: chapterTitle.trim() || undefined,
        pages: pages.trim() || undefined,
      }
    } else if (mode === 'paper') {
      if (!doi.trim() && !arxivId.trim() && !url.trim())
        return setStatus({ ok: false, msg: 'Indica DOI, arXiv ID o URL.' })
      item = {
        sourceType: 'scientific',
        doi: doi.trim() || undefined,
        arxivId: arxivId.trim() || undefined,
        url: url.trim() || undefined,
      }
    } else {
      if (!rawText.trim() || !title.trim()) return setStatus({ ok: false, msg: 'Título y texto son obligatorios.' })
      item = { sourceType: 'manual', rawText, title }
    }

    setBusy(true)
    const res = await ingestManual(item)
    setBusy(false)
    if (res.ok) {
      setStatus({ ok: true, msg: 'Añadido a tu biblioteca.' })
      reset()
    } else {
      setStatus({ ok: false, msg: res.error ?? 'No se pudo añadir.' })
    }
  }

  const saveCitation = async () => {
    if (!editing) return
    await repo.updateCitation(editing.id, citationDraft)
    setEditing(null)
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1>Biblioteca</h1>
        <p>Añade capítulos, papers o notas. Nacen protegidos: nunca se purgan.</p>
      </div>

      {!online && <div className="status err">Sin conexión: para añadir contenido necesitas red (el resumen lo hace el webhook).</div>}

      <div className="seg">
        <button className={mode === 'book' ? 'active' : ''} onClick={() => setMode('book')}>Libro</button>
        <button className={mode === 'paper' ? 'active' : ''} onClick={() => setMode('paper')}>Paper</button>
        <button className={mode === 'text' ? 'active' : ''} onClick={() => setMode('text')}>Texto</button>
      </div>

      {mode === 'book' && (
        <>
          <div className="field">
            <label>Título</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Cap. 3 — Anclajes" />
          </div>
          <div className="field">
            <label>Texto del capítulo (de tu copia legítima)</label>
            <textarea value={rawText} onChange={(e) => setRawText(e.target.value)} placeholder="Pega aquí el extracto a resumir…" />
          </div>
          <div className="field-row">
            <div className="field" style={{ flex: 2 }}>
              <label>ISBN (autocompleta la cita)</label>
              <input value={isbn} onChange={(e) => setIsbn(e.target.value)} placeholder="9780374533557" />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Páginas</label>
              <input value={pages} onChange={(e) => setPages(e.target.value)} placeholder="119-128" />
            </div>
          </div>
          <div className="field">
            <label>Capítulo</label>
            <input value={chapterTitle} onChange={(e) => setChapterTitle(e.target.value)} placeholder="Anchors" />
          </div>
        </>
      )}

      {mode === 'paper' && (
        <>
          <div className="field">
            <label>DOI</label>
            <input value={doi} onChange={(e) => setDoi(e.target.value)} placeholder="10.1038/s41586-…" />
          </div>
          <div className="field">
            <label>o arXiv ID</label>
            <input value={arxivId} onChange={(e) => setArxivId(e.target.value)} placeholder="2402.01234" />
          </div>
          <div className="field">
            <label>o URL</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
          </div>
        </>
      )}

      {mode === 'text' && (
        <>
          <div className="field">
            <label>Título</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nota sobre…" />
          </div>
          <div className="field">
            <label>Texto</label>
            <textarea value={rawText} onChange={(e) => setRawText(e.target.value)} />
          </div>
        </>
      )}

      <button className="btn btn-full" onClick={submit} disabled={busy || !online}>
        {busy ? 'Resumiendo…' : 'Añadir a biblioteca'}
      </button>
      {status && <div className={`status ${status.ok ? 'ok' : 'err'}`}>{status.msg}</div>}

      <div className="page-head" style={{ marginTop: 32 }}>
        <h1 style={{ fontSize: 22 }}>Contenido curado</h1>
      </div>
      <div className="list">
        {items.map((c) => (
          <div className="row" key={c.id} style={{ display: 'block' }}>
            <div className="row-title" style={{ whiteSpace: 'normal' }}>{c.title}</div>
            {c.citation && <div className="citation" style={{ marginTop: 8 }}>{c.citation}</div>}
            {editing?.id === c.id ? (
              <div style={{ marginTop: 10 }}>
                <textarea value={citationDraft} onChange={(e) => setCitationDraft(e.target.value)} style={{ minHeight: 80 }} />
                <div className="field-row" style={{ marginTop: 8 }}>
                  <button className="btn btn-full" onClick={saveCitation}>Guardar cita</button>
                  <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancelar</button>
                </div>
              </div>
            ) : (
              <button
                className="btn btn-ghost"
                style={{ marginTop: 10, fontSize: 13, padding: '6px 12px' }}
                onClick={() => {
                  setEditing(c)
                  setCitationDraft(c.citation ?? '')
                }}
              >
                Editar cita
              </button>
            )}
          </div>
        ))}
        {items.length === 0 && <div className="note">Todavía no hay contenido en tu biblioteca.</div>}
      </div>
    </div>
  )
}
