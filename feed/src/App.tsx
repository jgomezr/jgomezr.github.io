import { useEffect, useState, type JSX } from 'react'
import './App.css'
import { Feed } from './features/Feed'
import { Saved } from './features/Saved'
import { Library } from './features/Library'
import { Sources } from './features/Sources'
import { Settings } from './features/Settings'
import {
  IconFeed,
  IconLibrary,
  IconSaved,
  IconSettings,
  IconSources,
} from './ui/icons'

type Tab = 'feed' | 'saved' | 'library' | 'sources' | 'settings'

const TABS: Array<{ id: Tab; label: string; Icon: (p: { className?: string }) => JSX.Element }> = [
  { id: 'feed', label: 'Feed', Icon: IconFeed },
  { id: 'saved', label: 'Guardados', Icon: IconSaved },
  { id: 'library', label: 'Biblioteca', Icon: IconLibrary },
  { id: 'sources', label: 'Fuentes', Icon: IconSources },
  { id: 'settings', label: 'Ajustes', Icon: IconSettings },
]

function useOnline() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return online
}

export default function App() {
  const [tab, setTab] = useState<Tab>('feed')
  const online = useOnline()

  return (
    <div className="app">
      {!online && <div className="banner">Sin conexión · mostrando lo guardado en tu dispositivo</div>}

      <div className="screen">
        {tab === 'feed' && <Feed online={online} />}
        {tab === 'saved' && <Saved />}
        {tab === 'library' && <Library online={online} />}
        {tab === 'sources' && <Sources />}
        {tab === 'settings' && <Settings />}
      </div>

      <nav className="nav">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
            <Icon className="nav-ico" />
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
