import { useState } from 'react'
import { repo } from '../db'
import { useLive } from '../store/useLive'
import { IconAdd, IconTrash } from '../ui/icons'
import type { Source } from '../types'

export function Sources() {
  const sources = useLive(() => repo.listSources(), ['sources'], [] as Source[])
  const [adding, setAdding] = useState(false)
  const [url, setUrl] = useState('')
  const [type, setType] = useState<'rss' | 'scientific'>('rss')
  const [hint, setHint] = useState('')

  const add = async () => {
    if (!url.trim()) return
    await repo.addSource({ url, type, categoryHint: hint.trim() || undefined })
    setUrl('')
    setHint('')
    setAdding(false)
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1>Fuentes</h1>
        <p>Feeds RSS y científicos que alimentan tu feed.</p>
      </div>

      {adding ? (
        <div style={{ marginBottom: 20 }}>
          <div className="seg">
            <button className={type === 'rss' ? 'active' : ''} onClick={() => setType('rss')}>
              RSS / Web
            </button>
            <button className={type === 'scientific' ? 'active' : ''} onClick={() => setType('scientific')}>
              Científico
            </button>
          </div>
          <div className="field">
            <label>URL del feed</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…/rss" />
          </div>
          <div className="field">
            <label>Categoría sugerida (opcional)</label>
            <input value={hint} onChange={(e) => setHint(e.target.value)} placeholder="tecnologia" />
          </div>
          <div className="field-row">
            <button className="btn btn-full" onClick={add}>
              Añadir fuente
            </button>
            <button className="btn btn-ghost" onClick={() => setAdding(false)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button className="btn btn-ghost btn-full" onClick={() => setAdding(true)} style={{ marginBottom: 20 }}>
          <IconAdd className="nav-ico" /> Añadir fuente
        </button>
      )}

      <div className="list">
        {sources.map((s) => (
          <div className="row" key={s.id}>
            <div className="row-main">
              <div className="row-title">{s.title || s.url}</div>
              <div className="row-sub">{s.url}</div>
            </div>
            <span className="badge">{s.type === 'scientific' ? 'Ciencia' : 'RSS'}</span>
            <button
              className={`toggle ${s.active ? 'on' : ''}`}
              onClick={() => repo.setSourceActive(s.id, !s.active)}
              aria-label={s.active ? 'Desactivar' : 'Activar'}
            />
            <button className="icon-btn" onClick={() => repo.deleteSource(s.id)} aria-label="Eliminar">
              <IconTrash />
            </button>
          </div>
        ))}
        {sources.length === 0 && <div className="note">No hay fuentes todavía.</div>}
      </div>
    </div>
  )
}
