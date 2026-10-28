// Запись в репозиторий cse-portal-assets от имени админки.
// Токен GitHub хранится только здесь (секрет функции), в браузер не попадает.
//
// POST body:
//   message  — текст коммита
//   files    — [{ path, content, encoding: 'base64' | 'utf-8' }] (только пути из ALLOWED_PATH)
//   publish  — ['cities' | 'active-modal'] — пересобрать JSON из БД
// Всё попадает в один коммит; если содержимое не изменилось — коммита нет.
// npm: с точной версией — сборщик Supabase не ходит за манифестом в jsr.io (там бывают таймауты)
import { createClient } from 'npm:@supabase/supabase-js@2.110.0'

type Encoding = 'base64' | 'utf-8'
type PublishTarget = 'cities' | 'active-modal'

interface FileInput {
  path: string
  content: string
  encoding: Encoding
}

interface RequestBody {
  message?: string
  files?: FileInput[]
  publish?: PublishTarget[]
}

const GH_TOKEN = Deno.env.get('GH_ASSETS_TOKEN')!
const GH_OWNER = Deno.env.get('GH_OWNER') ?? 'Slim21211'
const GH_REPO = Deno.env.get('GH_REPO') ?? 'cse-portal-assets'
const GH_BRANCH = Deno.env.get('GH_BRANCH') ?? 'main'
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? 'https://admin.cse-hr.ru,http://localhost:5173')
  .split(',')
  .map((s) => s.trim())

const ALLOWED_PATH =
  /^(birthday\/(daily_birthday\.png|branch_anniversary\.png|daily-birthday-meta\.json)|modal-headers\/[\w-]+\.(png|jpe?g|webp|gif))$/
const MAX_FILE_BYTES = 10 * 1024 * 1024

const GH_API = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}`
const GH_HEADERS = {
  Authorization: `Bearer ${GH_TOKEN}`,
  Accept: 'application/vnd.github+json',
  'Content-Type': 'application/json',
}

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

async function gh<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${GH_API}${path}`, {
    method,
    headers: GH_HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new HttpError(res.status, `GitHub ${method} ${path} (${res.status}): ${err.message ?? ''}`)
  }
  return res.json()
}

// Один коммит с набором файлов через Git Data API
async function commitFiles(files: FileInput[], message: string): Promise<string | null> {
  const blobs = await Promise.all(
    files.map(async (f) => {
      const blob = await gh<{ sha: string }>('POST', '/git/blobs', { content: f.content, encoding: f.encoding })
      return { path: f.path, mode: '100644', type: 'blob', sha: blob.sha }
    })
  )

  for (let attempt = 0; attempt < 3; attempt++) {
    const ref = await gh<{ object: { sha: string } }>('GET', `/git/ref/heads/${GH_BRANCH}`)
    const parent = await gh<{ tree: { sha: string } }>('GET', `/git/commits/${ref.object.sha}`)
    const tree = await gh<{ sha: string }>('POST', '/git/trees', { base_tree: parent.tree.sha, tree: blobs })
    if (tree.sha === parent.tree.sha) return null

    const commit = await gh<{ sha: string }>('POST', '/git/commits', {
      message,
      tree: tree.sha,
      parents: [ref.object.sha],
    })
    try {
      await gh('PATCH', `/git/refs/heads/${GH_BRANCH}`, { sha: commit.sha })
      return commit.sha
    } catch (e) {
      // 422 — ветку успели сдвинуть параллельным коммитом, пробуем заново
      if (!(e instanceof HttpError && e.status === 422)) throw e
    }
  }
  throw new HttpError(409, 'Не удалось записать коммит: ветка постоянно меняется')
}

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req.headers.get('Origin'))
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

  try {
    if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed')

    // Клиент с JWT пользователя: RLS и is_admin() проверяются на стороне Postgres
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      req.headers.get('apikey') ?? Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    )
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin')
    if (adminError || !isAdmin) throw new HttpError(403, 'Нет доступа')

    const body = (await req.json()) as RequestBody
    const files: FileInput[] = []

    for (const f of body.files ?? []) {
      if (!ALLOWED_PATH.test(f.path)) throw new HttpError(400, `Путь не разрешён: ${f.path}`)
      if (f.encoding !== 'base64' && f.encoding !== 'utf-8') throw new HttpError(400, 'Неверная кодировка')
      if (f.content.length * 0.75 > MAX_FILE_BYTES) throw new HttpError(413, `Файл слишком большой: ${f.path}`)
      files.push(f)
    }

    const publish = new Set(body.publish ?? [])
    if (publish.has('cities')) {
      const { data, error } = await supabase.from('cities').select('*').order('created_at')
      if (error) throw new HttpError(500, error.message)
      files.push({ path: 'cities.json', content: JSON.stringify(data), encoding: 'utf-8' })
    }
    if (publish.has('active-modal')) {
      const { data, error } = await supabase.from('modals').select('*').eq('is_active', true).maybeSingle()
      if (error) throw new HttpError(500, error.message)
      files.push({ path: 'active-modal.json', content: JSON.stringify(data ?? {}), encoding: 'utf-8' })
    }

    if (files.length === 0) throw new HttpError(400, 'Нечего записывать')

    const commit = await commitFiles(files, body.message?.slice(0, 200) || 'update from admin')
    return json({ commit })
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500
    console.error(e)
    return json({ error: e instanceof Error ? e.message : String(e) }, status)
  }
})
