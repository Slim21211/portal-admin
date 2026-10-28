import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'

export const ASSETS_URL = import.meta.env.VITE_GITHUB_PAGES_URL as string

export type PublishTarget = 'cities' | 'active-modal'

export interface AssetFile {
  path: string
  content: string
  encoding: 'base64' | 'utf-8'
}

interface CommitRequest {
  message: string
  files?: AssetFile[]
  publish?: PublishTarget[]
}

// Все записи в cse-portal-assets идут через Edge Function `assets` одним коммитом
export async function commitAssets(request: CommitRequest): Promise<void> {
  const { error } = await supabase.functions.invoke('assets', { body: request })
  if (!error) return
  if (error instanceof FunctionsHttpError) {
    const body = await error.context.json().catch(() => ({}))
    throw new Error(body.error ?? error.message)
  }
  throw error
}

export function publishJson(target: PublishTarget, message: string): Promise<void> {
  return commitAssets({ message, publish: [target] })
}

export async function fileToAsset(path: string, file: File): Promise<AssetFile> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
  return { path, content: dataUrl.slice(dataUrl.indexOf(',') + 1), encoding: 'base64' }
}

export function assetUrl(path: string): string {
  return `${ASSETS_URL}/${path}`
}
