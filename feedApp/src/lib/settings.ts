const K_WEBHOOK_BASE = 'n8n_webhook_base'
const K_LAST_PURGE = 'last_purge_date'
const K_THEME = 'theme'
const K_SEEDED = 'seeded_v1'

/**
 * URL base de los webhooks n8n, p. ej. https://n8n.juliangomez.me/webhook
 * De ahí se derivan /summarize-batch y /fetch-feeds.
 */
export function getWebhookBase(): string | null {
  const v = localStorage.getItem(K_WEBHOOK_BASE)
  return v ? v.replace(/\/+$/, '') : null
}
export function setWebhookBase(url: string) {
  localStorage.setItem(K_WEBHOOK_BASE, url.trim())
}

export function getLastPurgeDate(): string | null {
  return localStorage.getItem(K_LAST_PURGE)
}
export function setLastPurgeDate(isoDate: string) {
  localStorage.setItem(K_LAST_PURGE, isoDate)
}

export type Theme = 'dark' | 'light'
export function getTheme(): Theme {
  return localStorage.getItem(K_THEME) === 'light' ? 'light' : 'dark'
}
export function setTheme(t: Theme) {
  localStorage.setItem(K_THEME, t)
  document.documentElement.dataset.theme = t
}

export function wasSeeded(): boolean {
  return localStorage.getItem(K_SEEDED) === '1'
}
export function markSeeded() {
  localStorage.setItem(K_SEEDED, '1')
}
