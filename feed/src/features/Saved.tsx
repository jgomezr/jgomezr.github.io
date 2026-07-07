import { useState } from 'react'
import { repo } from '../db'
import { useLive } from '../store/useLive'
import { CardView } from './CardView'
import type { Card } from '../types'

export function Saved() {
  const cards = useLive(() => repo.loadSaved(), ['cards', 'interactions'], [] as Card[])
  const interactions = useLive(() => repo.interactionMap(), ['interactions'], {})
  const [open, setOpen] = useState<Card | null>(null)

  if (open) {
    return (
      <div className="page">
        <button className="btn btn-ghost" onClick={() => setOpen(null)} style={{ marginBottom: 16 }}>
          ← Volver
        </button>
        <div style={{ height: 'calc(100dvh - 200px)', display: 'flex' }}>
          <CardView card={open} state={interactions[open.id] ?? { like: false, save: false }} />
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1>Guardados</h1>
        <p>Lo que marcaste con me gusta o guardar. Disponible sin conexión.</p>
      </div>
      {cards.length === 0 ? (
        <div className="note">Aún no has guardado nada. En el feed, toca el corazón o «Guardar».</div>
      ) : (
        <div className="saved-grid">
          {cards.map((c) => (
            <button className="mini" data-cat={c.category} key={c.id} onClick={() => setOpen(c)}>
              <span className="mini-cat">{c.category}</span>
              <span className="mini-title">{c.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
