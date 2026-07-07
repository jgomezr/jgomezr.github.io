import { useEffect, useRef } from 'react'
import { useFeed } from '../store/feed'
import { useLive } from '../store/useLive'
import { repo } from '../db'
import { CardView } from './CardView'

export function Feed({ online }: { online: boolean }) {
  const { cards, init, onPageChange, atEnd, isLoading } = useFeed()
  const containerRef = useRef<HTMLDivElement>(null)
  const inited = useRef(false)

  const interactions = useLive(() => repo.interactionMap(), ['interactions'], {})

  useEffect(() => {
    if (inited.current) return
    inited.current = true
    void init()
  }, [init])

  // Detecta la tarjeta visible por scroll-snap y avisa al controlador (prefetch).
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const idx = Math.round(el.scrollTop / el.clientHeight)
        onPageChange(idx)
      })
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [onPageChange, cards.length])

  if (cards.length === 0) {
    return (
      <div className="empty">
        <h3>Tu feed está en blanco</h3>
        <p>
          Añade fuentes RSS y configura el webhook en Ajustes para empezar a recibir tarjetas de
          conocimiento.
        </p>
      </div>
    )
  }

  return (
    <div className="feed" ref={containerRef}>
      {cards.map((card) => (
        <div className="feed-card" key={card.id}>
          <CardView card={card} state={interactions[card.id] ?? { like: false, save: false }} />
        </div>
      ))}
      <div className="feed-end">
        {isLoading ? (
          <p>Buscando contenido nuevo…</p>
        ) : atEnd || !online ? (
          <>
            <h3>Estás al día</h3>
            <p>
              {online
                ? 'No hay nada nuevo por ahora. Desliza hacia abajo para refrescar más tarde.'
                : 'Sin conexión: estás viendo lo que ya tenías guardado.'}
            </p>
          </>
        ) : (
          <p>Desliza para buscar más</p>
        )}
      </div>
    </div>
  )
}
