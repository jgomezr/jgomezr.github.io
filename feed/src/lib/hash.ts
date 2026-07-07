async function sha1Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(input))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Hash de dedupe para contenido con URL (la URL del artículo, no la del feed). */
export const hashUrl = (url: string) => sha1Hex(url.trim())

/** Hash de dedupe para contenido manual sin URL: título + primeros 200 caracteres. */
export const hashContent = (title: string, text: string) =>
  sha1Hex(`${title.trim()}|${text.trim().slice(0, 200)}`)
