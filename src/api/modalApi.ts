import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import { supabase, MODAL_IMAGES_FOLDER } from './supabaseClient'
import { assetUrl, commitAssets, fileToAsset, publishJson } from './assetsClient'
import { Modal, ModalFormData } from '../features/modal-builder/types'

const TABLE = 'modals'

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

// active-modal.json собирается из БД на стороне Edge Function; возвращает текст ошибки или null
async function publishActiveModal(): Promise<string | null> {
  try {
    await publishJson('active-modal', 'update active modal')
    return null
  } catch (e) {
    return `Сохранено в БД, но не опубликовано: ${errorMessage(e)}`
  }
}

export const modalApi = createApi({
  reducerPath: 'modalApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Modal'],
  endpoints: (builder) => ({
    listModals: builder.query<Modal[], void>({
      queryFn: async () => {
        const { data, error } = await supabase.from(TABLE).select('*').order('created_at', { ascending: false })
        if (error) return { error: error.message }
        return { data: data as Modal[] }
      },
      providesTags: ['Modal'],
    }),
    createModal: builder.mutation<Modal, ModalFormData>({
      queryFn: async (formData) => {
        let header_image_url: string | null = null
        if (formData.header_type === 'image') {
          if (formData.header_image_file) {
            const ext = formData.header_image_file.name.split('.').pop()?.toLowerCase()
            const path = `${MODAL_IMAGES_FOLDER}/${Date.now()}.${ext}`
            try {
              await commitAssets({
                message: 'upload modal image',
                files: [await fileToAsset(path, formData.header_image_file)],
              })
            } catch (e) {
              return { error: errorMessage(e) }
            }
            header_image_url = assetUrl(path)
          } else if (formData.header_image_url) {
            header_image_url = formData.header_image_url
          }
        }
        const { header_image_file, header_image_url: _ignored, ...rest } = formData
        const record = { ...rest, header_image_url, is_active: false }
        const { data, error } = await supabase.from(TABLE).insert(record).select().single()
        if (error) return { error: error.message }
        return { data: data as Modal }
      },
      invalidatesTags: ['Modal'],
    }),
    setActiveModal: builder.mutation<void, string | null>({
      queryFn: async (id) => {
        const { error } = await supabase.rpc('set_active_modal', { p_id: id })
        if (error) return { error: error.message }
        const publishError = await publishActiveModal()
        return publishError ? { error: publishError } : { data: undefined }
      },
      invalidatesTags: ['Modal'],
    }),
    deleteModal: builder.mutation<void, Modal>({
      queryFn: async (modal) => {
        const { error } = await supabase.from(TABLE).delete().eq('id', modal.id)
        if (error) return { error: error.message }
        if (modal.is_active) {
          const publishError = await publishActiveModal()
          if (publishError) return { error: publishError }
        }
        return { data: undefined }
      },
      invalidatesTags: ['Modal'],
    }),
  }),
})

export const {
  useListModalsQuery,
  useCreateModalMutation,
  useSetActiveModalMutation,
  useDeleteModalMutation,
} = modalApi
