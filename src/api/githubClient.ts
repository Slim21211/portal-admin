const TOKEN = import.meta.env.VITE_GITHUB_TOKEN as string
const OWNER = import.meta.env.VITE_GITHUB_OWNER as string
const REPO  = import.meta.env.VITE_GITHUB_REPO  as string
export const GITHUB_PAGES_URL = import.meta.env.VITE_GITHUB_PAGES_URL as string

const API = `https://api.github.com/repos/${OWNER}/${REPO}/contents`

const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: 'application/vnd.github+json',
  'Content-Type': 'application/json',
}

async function getSha(path: string): Promise<string | null> {
  const res = await fetch(`${API}/${path}`, { headers: HEADERS })
  if (!res.ok) return null
  const data = await res.json()
  return data.sha ?? null
}

export async function githubPutText(path: string, content: string, message = `update ${path}`): Promise<void> {
  const sha = await getSha(path)
  const encoded = btoa(unescape(encodeURIComponent(content)))
  const body: Record<string, string> = { message, content: encoded }
  if (sha) body.sha = sha
  const res = await fetch(`${API}/${path}`, { method: 'PUT', headers: HEADERS, body: JSON.stringify(body) })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`GitHub put failed (${res.status}): ${err.message ?? ''}`)
  }
}

export async function githubPutBinary(path: string, file: File, message = `upload ${path}`): Promise<string> {
  const sha = await getSha(path)
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  const encoded = btoa(binary)
  const body: Record<string, string> = { message, content: encoded }
  if (sha) body.sha = sha
  const res = await fetch(`${API}/${path}`, { method: 'PUT', headers: HEADERS, body: JSON.stringify(body) })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`GitHub put failed (${res.status}): ${err.message ?? ''}`)
  }
  return `${GITHUB_PAGES_URL}/${path}`
}
