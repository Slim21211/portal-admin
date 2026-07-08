import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import { supabase, BUCKET, MODAL_IMAGES_FOLDER, getStoragePublicUrl } from './supabaseClient'
import { Modal, ModalFormData } from '../features/modal-builder/types'

const TABLE = 'modals'

export const modalApi = createApi({
  reducerPath: 'modalApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Modal'],
  endpoints: (builder) => ({

    listModals: builder.query<Modal[], void>({
      queryFn: async () => {
        const { data, error } = await supabase
          .from(TABLE)
          .select('*')
          .order('created_at', { ascending: false })
        if (error) return { error: error.message }
        return { data: data as Modal[] }
      },
      providesTags: ['Modal'],
    }),

    createModal: builder.mutation<Modal, ModalFormData>({
      queryFn: async (formData) => {
        // Загружаем картинку в Storage если выбран файл
        let header_image_url: string | null = null

        if (formData.header_type === 'image') {
          if (formData.header_image_file) {
            const ext = formData.header_image_file.name.split('.').pop()
            const path = `${MODAL_IMAGES_FOLDER}/${Date.now()}.${ext}`
            const { error: uploadError } = await supabase.storage
              .from(BUCKET)
              .upload(path, formData.header_image_file, {
                upsert: false,
                contentType: formData.header_image_file.type,
              })
            if (uploadError) return { error: uploadError.message }
            header_image_url = getStoragePublicUrl(path)
          } else if (formData.header_image_url) {
            // Внешний URL — сохраняем как есть
            header_image_url = formData.header_image_url
          }
        }

        const { header_image_file, header_image_url: _ignored, ...rest } = formData
        const record = { ...rest, header_image_url, is_active: false }

        const { data, error } = await supabase
          .from(TABLE)
          .insert(record)
          .select()
          .single()

        if (error) return { error: error.message }
        return { data: data as Modal }
      },
      invalidatesTags: ['Modal'],
    }),

    setActiveModal: builder.mutation<void, string | null>({
      queryFn: async (id) => {
        // Сначала деактивируем все
        const { error: e1 } = await supabase
          .from(TABLE)
          .update({ is_active: false })
          .not('id', 'eq', id ?? 'none')

        if (e1) return { error: e1.message }

        // Активируем нужную (если id передан)
        if (id) {
          const { error: e2 } = await supabase
            .from(TABLE)
            .update({ is_active: true })
            .eq('id', id)
          if (e2) return { error: e2.message }
        }

        return { data: undefined }
      },
      invalidatesTags: ['Modal'],
    }),

    deleteModal: builder.mutation<void, Modal>({
      queryFn: async (modal) => {
        // Удаляем картинку из Storage если она наша (не внешняя)
        if (
          modal.header_image_url &&
          modal.header_image_url.includes(MODAL_IMAGES_FOLDER)
        ) {
          const path = modal.header_image_url.split('/').slice(-2).join('/')
          await supabase.storage.from(BUCKET).remove([path])
        }

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
