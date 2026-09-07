import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import { supabase, MODAL_IMAGES_FOLDER } from './supabaseClient'
import { githubPutText, githubPutBinary } from './githubClient'
import { Modal, ModalFormData } from '../features/modal-builder/types'

const TABLE = 'modals'
const ACTIVE_MODAL_FILE = 'active-modal.json'

async function writeActiveModal(modal: Modal | null): Promise<void> {
  await githubPutText(ACTIVE_MODAL_FILE, JSON.stringify(modal ?? {}), 'update active modal')
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
            const ext = formData.header_image_file.name.split('.').pop()
            const path = `${MODAL_IMAGES_FOLDER}/${Date.now()}.${ext}`
            header_image_url = await githubPutBinary(path, formData.header_image_file, 'upload modal image')
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
        if (id) {
          const { error: e1 } = await supabase.from(TABLE).update({ is_active: false }).neq('id', id)
          if (e1) return { error: e1.message }
          const { error: e2 } = await supabase.from(TABLE).update({ is_active: true }).eq('id', id)
          if (e2) return { error: e2.message }
          const { data: modal, error: e3 } = await supabase.from(TABLE).select('*').eq('id', id).single()
          if (e3) return { error: e3.message }
          await writeActiveModal(modal as Modal)
        } else {
          const { error: e1 } = await supabase.from(TABLE).update({ is_active: false }).not('id', 'is', null)
          if (e1) return { error: e1.message }
          await writeActiveModal(null)
        }
        return { data: undefined }
      },
      invalidatesTags: ['Modal'],
    }),
    deleteModal: builder.mutation<void, Modal>({
      queryFn: async (modal) => {
        if (modal.is_active) await writeActiveModal(null)
        const { error } = await supabase.from(TABLE).delete().eq('id', modal.id)
        if (error) return { error: error.message }
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
