import { useState } from 'react'
import { repo } from '../db'
import { IconBookmark, IconHeart, IconLink, IconSkip } from '../ui/icons'
import type { Card } from '../types'

const CAT_LABEL: Record<string, string> = {
  ciencia: 'Ciencia',
  filosofia: 'Filosofía',
  tecnologia: 'Tecnología',
  web: 'Web',
  podcast: 'Podcast',
}

const SOURCE_ICON: Record<string, string> = { scientific: '⬡', book: '❖', manual: '✎', rss: '' }

function Foot({ card }: { card: Card }) {
  if (card.citation) {
    const mine = card.citationSource === 'user'
    return (
      <div className="card-foot">
        <span className="citation-tag">{mine ? 'Tu cita' : `Cita · ${card.citationSource}`}</span>
        <div
          className="citation"
          title="Mantén pulsado para copiar"
          onClick={() => navigator.clipboard?.writeText(card.citation!)}
        >
          {card.citation}
        </div>
      </div>
    )
  }
  if (card.originalUrl) {
    let host = card.originalUrl
    try {
      host = new URL(card.originalUrl).hostname.replace(/^www\./, '')
    } catch {
      /* deja la URL cruda */
    }
    return (
      <div className="card-foot">
        <div className="source-line">
          {SOURCE_ICON[card.sourceType] && <span>{SOURCE_ICON[card.sourceType]}</span>}
          <span>{host}</span>
        </div>
      </div>
    )
  }
  return null
}

export function CardView({
  card,
  state,
}: {
  card: Card
  state: { like: boolean; save: boolean }
}) {
  const [popLike, setPopLike] = useState(false)
  const [popSave, setPopSave] = useState(false)
  const [skipped, setSkipped] = useState(false)

  const toggle = async (type: 'like' | 'save') => {
    const on = await repo.toggleInteraction(card.id, type)
    if (on) {
      navigator.vibrate?.(12)
      if (type === 'like') setPopLike(true)
      else setPopSave(true)
    }
  }

  const skip = async () => {
    await repo.addInteraction(card.id, 'skip')
    setSkipped(true)
  }

  return (
    <article className="card" data-cat={card.category}>
      <header className="card-top">
        <span className="chip">
          <span className="chip-dot" />
          {CAT_LABEL[card.category] ?? card.category}
        </span>
        <span className="meta-read">{card.estReadMin} min lectura</span>
      </header>

      <div className="card-body">
        <h2 className="card-title">{card.title}</h2>
        <p className="card-summary">{card.summary}</p>
        <Foot card={card} />
      </div>

      <div className="card-actions">
        <button
          className={`act ${state.like ? 'on' : ''} ${popLike ? 'pop' : ''}`}
          onClick={() => toggle('like')}
          onAnimationEnd={() => setPopLike(false)}
          aria-pressed={state.like}
          aria-label="Me gusta"
        >
          <IconHeart filled={state.like} />
        </button>
        <button
          className={`act ${state.save ? 'on' : ''} ${popSave ? 'pop' : ''}`}
          onClick={() => toggle('save')}
          onAnimationEnd={() => setPopSave(false)}
          aria-pressed={state.save}
          aria-label="Guardar"
        >
          <IconBookmark filled={state.save} />
          Guardar
        </button>
        <span className="act-spacer" />
        {!state.like && !state.save && (
          <button className="act" onClick={skip} disabled={skipped} aria-label="Saltar">
            <IconSkip />
          </button>
        )}
        {card.originalUrl && (
          <a
            className="act"
            href={card.originalUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={card.sourceType === 'scientific' ? 'Abrir DOI' : 'Leer original'}
          >
            <IconLink />
            {card.sourceType === 'scientific' ? 'DOI' : ''}
          </a>
        )}
      </div>
    </article>
  )
}
