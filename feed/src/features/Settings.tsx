import { useState } from 'react'
import { getTheme, getWebhookBase, setTheme, setWebhookBase, type Theme } from '../lib/settings'
import { testConnection } from '../lib/webhook'
import { purgeNow } from '../lib/purge'

export function Settings() {
  const [base, setBase] = useState(getWebhookBase() ?? '')
  const [theme, setTh] = useState<Theme>(getTheme())
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; detail: string } | null>(null)
  const [purged, setPurged] = useState<number | null>(null)

  const save = () => {
    setWebhookBase(base)
    setResult({ ok: true, detail: 'URL guardada.' })
  }

  const test = async () => {
    setWebhookBase(base)
    setTesting(true)
    setResult(null)
    setResult(await testConnection())
    setTesting(false)
  }

  const switchTheme = (t: Theme) => {
    setTh(t)
    setTheme(t)
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1>Ajustes</h1>
        <p>Webhook de n8n, tema y mantenimiento.</p>
      </div>

      <div className="field">
        <label>URL base del webhook n8n</label>
        <input
          value={base}
          onChange={(e) => setBase(e.target.value)}
          placeholder="https://n8n.juliangomez.me/webhook"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>
      <div className="note">
        Se le añaden <code>/fetch-feeds</code> y <code>/summarize-batch</code>. No incluyas la barra final.
      </div>
      <div className="field-row">
        <button className="btn btn-full" onClick={save}>Guardar</button>
        <button className="btn btn-ghost" onClick={test} disabled={testing || !base}>
          {testing ? 'Probando…' : 'Probar conexión'}
        </button>
      </div>
      {result && <div className={`status ${result.ok ? 'ok' : 'err'}`}>{result.detail}</div>}

      <div className="page-head" style={{ marginTop: 32 }}>
        <h1 style={{ fontSize: 22 }}>Tema</h1>
      </div>
      <div className="seg">
        <button className={theme === 'dark' ? 'active' : ''} onClick={() => switchTheme('dark')}>Oscuro</button>
        <button className={theme === 'light' ? 'active' : ''} onClick={() => switchTheme('light')}>Claro</button>
      </div>

      <div className="page-head" style={{ marginTop: 32 }}>
        <h1 style={{ fontSize: 22 }}>Mantenimiento</h1>
      </div>
      <div className="note">
        La limpieza diaria borra las tarjetas del feed sin me gusta ni guardar. La biblioteca y los favoritos nunca se tocan.
      </div>
      <button
        className="btn btn-ghost btn-full"
        onClick={async () => setPurged(await purgeNow())}
      >
        Ejecutar limpieza ahora
      </button>
      {purged !== null && (
        <div className="status ok">Se eliminaron {purged} tarjeta{purged === 1 ? '' : 's'} del feed.</div>
      )}
    </div>
  )
}
