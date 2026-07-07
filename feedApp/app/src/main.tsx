import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { getTheme } from './lib/settings'
import { seedIfEmpty } from './lib/seed'
import { purgeIfDue } from './lib/purge'

// Tema antes del primer render, sin parpadeo.
document.documentElement.dataset.theme = getTheme()

// Persistencia del almacenamiento: protege OPFS/localStorage de la evicción del navegador.
void navigator.storage?.persist?.()

async function boot() {
  // Purga primero (feed transitorio del día anterior), luego siembra: así la
  // limpieza de arranque no borra las tarjetas de ejemplo recién sembradas.
  await purgeIfDue()
  await seedIfEmpty()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void boot()
