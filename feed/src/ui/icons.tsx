import type { ReactNode } from 'react'

const svg = (path: ReactNode, fill = false) => (props: { className?: string }) => (
  <svg
    className={props.className}
    viewBox="0 0 24 24"
    fill={fill ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {path}
  </svg>
)

export const IconFeed = svg(<><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h10" /></>)
export const IconSaved = svg(<path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" />)
export const IconLibrary = svg(<><path d="M4 5v14" /><path d="M8 4v16" /><path d="m13 5 5 14" /><path d="M4 19h9" /></>)
export const IconSources = svg(<><path d="M4 11a9 9 0 0 1 9 9" /><path d="M4 4a16 16 0 0 1 16 16" /><circle cx="5" cy="19" r="1.5" fill="currentColor" stroke="none" /></>)
export const IconSettings = svg(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 2.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 7 2.6h.2A1.6 1.6 0 0 0 9 1.1V1a2 2 0 1 1 4 0v.1A1.6 1.6 0 0 0 15 2.6a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.2a1.6 1.6 0 0 0 1.5 1H23a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" transform="translate(0.5 0.5) scale(0.92)" /></>)
export const IconHeart = (p: { className?: string; filled?: boolean }) =>
  svg(<path d="M12 21s-8-4.5-8-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 11c0 5.5-8 10-8 10Z" />, p.filled)(p)
export const IconBookmark = (p: { className?: string; filled?: boolean }) =>
  svg(<path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" />, p.filled)(p)
export const IconSkip = svg(<><path d="M6 6l12 12" /><path d="M18 6 6 18" /></>)
export const IconLink = svg(<><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></>)
export const IconTrash = svg(<><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M6 6l1 14h10l1-14" /></>)
export const IconAdd = svg(<><path d="M12 5v14" /><path d="M5 12h14" /></>)
export const IconRefresh = svg(<><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></>)
