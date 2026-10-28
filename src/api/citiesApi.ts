import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import { supabase } from './supabaseClient'
import { publishJson } from './assetsClient'

export interface City {
  id: string
  name: string
  url: string | null
  is_pinned: boolean
  parent_id: string | null
  created_at: string
}

export interface CityInput {
  name: string
  url: string | null
  is_pinned: boolean
  parent_id?: string | null
}

const TABLE = 'cities'

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

// cities.json собирается из БД на стороне Edge Function; возвращает текст ошибки или null
async function syncCitiesToGitHub(): Promise<string | null> {
  try {
    await publishJson('cities', 'sync cities')
    return null
  } catch (e) {
    return `Сохранено в БД, но не опубликовано: ${errorMessage(e)}`
  }
}

export const citiesApi = createApi({
  reducerPath: 'citiesApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['City'],
  endpoints: (builder) => ({
    listCities: builder.query<City[], void>({
      queryFn: async () => {
        const { data, error } = await supabase.from(TABLE).select('*')
        if (error) return { error: error.message }
        const sorted = (data as City[]).sort((a, b) => a.name.localeCompare(b.name, 'ru'))
        return { data: sorted }
      },
      providesTags: ['City'],
    }),
    addCity: builder.mutation<City, CityInput>({
      queryFn: async (input) => {
        const { data, error } = await supabase.from(TABLE).insert(input).select().single()
        if (error) return { error: error.message }
        const syncError = await syncCitiesToGitHub()
        if (syncError) return { error: syncError }
        return { data: data as City }
      },
      invalidatesTags: ['City'],
    }),
    updateCity: builder.mutation<City, { id: string } & CityInput>({
      queryFn: async ({ id, ...input }) => {
        const { data, error } = await supabase.from(TABLE).update(input).eq('id', id).select().single()
        if (error) return { error: error.message }
        const syncError = await syncCitiesToGitHub()
        if (syncError) return { error: syncError }
        return { data: data as City }
      },
      invalidatesTags: ['City'],
    }),
    deleteCity: builder.mutation<void, string>({
      queryFn: async (id) => {
        const { error } = await supabase.from(TABLE).delete().eq('id', id)
        if (error) return { error: error.message }
        const syncError = await syncCitiesToGitHub()
        if (syncError) return { error: syncError }
        return { data: undefined }
      },
      invalidatesTags: ['City'],
    }),
    importCities: builder.mutation<{ added: number; updated: number }, CityInput[]>({
      queryFn: async (rows) => {
        const { data: existing, error: fetchError } = await supabase.from(TABLE).select('*')
        if (fetchError) return { error: fetchError.message }
        const existingMap = new Map((existing as City[]).map((c) => [c.name.toLowerCase(), c]))
        const toInsert: CityInput[] = []
        const toUpdate: City[] = []
        for (const row of rows) {
          const current = existingMap.get(row.name.toLowerCase())
          if (current) toUpdate.push({ ...current, url: row.url })
          else toInsert.push(row)
        }
        if (toInsert.length > 0) {
          const { error } = await supabase.from(TABLE).insert(toInsert)
          if (error) return { error: error.message }
        }
        if (toUpdate.length > 0) {
          const { error } = await supabase.from(TABLE).upsert(toUpdate)
          if (error) return { error: error.message }
        }
        const syncError = await syncCitiesToGitHub()
        if (syncError) return { error: syncError }
        return { data: { added: toInsert.length, updated: toUpdate.length } }
      },
      invalidatesTags: ['City'],
    }),
    createPinnedCity: builder.mutation<City, { parent: CityInput; children: { name: string; url: string }[] }>({
      queryFn: async ({ parent, children }) => {
        const { data: parentData, error: parentError } = await supabase.from(TABLE).insert(parent).select().single()
        if (parentError) return { error: parentError.message }
        if (children.length > 0) {
          const rows = children
            .filter((c) => c.name.trim() && c.url.trim())
            .map((c) => ({ name: c.name.trim(), url: c.url.trim(), is_pinned: false, parent_id: parentData.id }))
          if (rows.length > 0) {
            const { error: childError } = await supabase.from(TABLE).insert(rows)
            if (childError) return { error: childError.message }
          }
        }
        const syncError = await syncCitiesToGitHub()
        if (syncError) return { error: syncError }
        return { data: parentData as City }
      },
      invalidatesTags: ['City'],
    }),
    syncToGitHub: builder.mutation<void, void>({
      queryFn: async () => {
        const syncError = await syncCitiesToGitHub()
        return syncError ? { error: syncError } : { data: undefined }
      },
    }),
  }),
})

export const {
  useListCitiesQuery,
  useAddCityMutation,
  useUpdateCityMutation,
  useDeleteCityMutation,
  useImportCitiesMutation,
  useCreatePinnedCityMutation,
  useSyncToGitHubMutation,
} = citiesApi
