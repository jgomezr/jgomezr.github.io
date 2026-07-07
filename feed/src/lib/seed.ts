import { repo } from '../db'
import { markSeeded, wasSeeded } from './settings'
import type { NewCard } from '../types'

const SEED_CARDS: NewCard[] = [
  {
    title: 'El cerebro predice antes de percibir',
    summary:
      'La neurociencia del procesamiento predictivo sostiene que el cerebro no recibe pasivamente el mundo, sino que genera hipótesis constantes sobre lo que va a percibir y solo corrige cuando hay error. Percibir sería, entonces, adivinar bien. El modelo explica desde ilusiones ópticas hasta por qué la atención cuesta energía: mantener predicciones vivas es caro.',
    category: 'ciencia',
    estReadMin: 4,
    originalUrl: 'https://example.com/prediccion',
    citation: null,
    citationSource: null,
    sourceType: 'rss',
    publishedAt: '2026-06-30T09:00:00Z',
  },
  {
    title: 'Contra la nostalgia como brújula moral',
    summary:
      'Recordar un pasado mejor casi siempre es recordar un pasado editado. La nostalgia recorta la fricción y conserva el brillo, y por eso es una guía traicionera para decidir cómo debería ser el presente. El ensayo propone tratarla como una emoción legítima pero no como argumento: sentir que algo se perdió no prueba que existiera.',
    category: 'filosofia',
    estReadMin: 6,
    originalUrl: 'https://example.com/nostalgia',
    citation: null,
    citationSource: null,
    sourceType: 'rss',
    publishedAt: '2026-06-28T12:00:00Z',
  },
  {
    title: 'Attention Is Still All You Need',
    summary:
      'El trabajo revisa por qué la arquitectura transformer sigue dominando pese a años de alternativas propuestas. Los autores muestran que las mejoras reales vinieron de escala, datos y detalles de entrenamiento más que de reemplazar la atención. Concluyen que buena parte de la innovación arquitectónica reciente rinde menos de lo anunciado cuando se controla el presupuesto de cómputo.',
    category: 'tecnologia',
    estReadMin: 8,
    originalUrl: 'https://arxiv.org/abs/2506.09876',
    citation:
      'Doe, J. A., & Ruiz, C. (2026). Attention Is Still All You Need [Preprint]. arXiv. https://arxiv.org/abs/2506.09876',
    citationSource: 'arxiv',
    sourceType: 'scientific',
    publishedAt: '2026-06-25T18:00:00Z',
  },
  {
    title: 'Anclajes: por qué el primer número manda',
    summary:
      'El capítulo desarrolla el efecto ancla: la primera cifra que entra en una negociación reconfigura todo el rango de lo que después parece razonable. Kahneman muestra con experimentos que el ancla opera incluso cuando es absurda o aleatoria, y que saber que existe casi no protege de ella. La conclusión práctica es incómoda: quien pone el primer número suele fijar el terreno.',
    category: 'filosofia',
    estReadMin: 5,
    originalUrl: null,
    citation:
      'Kahneman, D. (2011). Pensar rápido, pensar despacio. Debate. [Cap.: Anchors, pp. 119-128]',
    citationSource: 'isbn',
    sourceType: 'book',
    publishedAt: null,
  },
  {
    title: 'OPFS: el disco duro silencioso del navegador',
    summary:
      'El Origin Private File System permite a una web guardar archivos reales, rápidos y privados, sin pedir permisos ni exponer rutas al usuario. Combinado con SQLite compilado a WebAssembly, una PWA puede correr una base de datos completa on-device, offline y persistente. El artículo explica el modo SyncAccessHandle y por qué cambia lo que una app web puede prometer.',
    category: 'tecnologia',
    estReadMin: 3,
    originalUrl: 'https://example.com/opfs',
    citation: null,
    citationSource: null,
    sourceType: 'rss',
    publishedAt: '2026-07-01T08:00:00Z',
  },
]

/** Siembra tarjetas de ejemplo la primera vez, para ver el feed sin webhook. */
export async function seedIfEmpty() {
  if (wasSeeded()) return
  // El capítulo de libro nace protegido (como en Biblioteca): así puebla el
  // contenido curado y sobrevive a la purga, igual que el contenido real.
  const book = SEED_CARDS.filter((c) => c.sourceType === 'book')
  const rest = SEED_CARDS.filter((c) => c.sourceType !== 'book')
  await repo.insertCards(rest)
  await repo.insertCards(book, { protected: true })
  await repo.addSource({ url: 'http://export.arxiv.org/rss/cs.AI', type: 'scientific', title: 'arXiv · cs.AI', categoryHint: 'ciencia' })
  markSeeded()
}
