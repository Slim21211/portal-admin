import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import { assetUrl, commitAssets, fileToAsset } from './assetsClient'

const BIRTHDAY_PATH = 'birthday/daily_birthday.png'
const BIRTHDAY_META = 'birthday/daily-birthday-meta.json'
const BRANCH_ANNIVERSARY_PATH = 'birthday/branch_anniversary.png'

export const uploadApi = createApi({
  reducerPath: 'uploadApi',
  baseQuery: fakeBaseQuery(),
  endpoints: (builder) => ({
    uploadBirthdayImage: builder.mutation<string, File>({
      queryFn: async (file) => {
        try {
          // Пишем дату загрузки (МСК) — по ней портал решает, актуальна ли картинка
          const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Moscow' }) // YYYY-MM-DD
          await commitAssets({
            message: 'update daily birthday image',
            files: [
              await fileToAsset(BIRTHDAY_PATH, file),
              { path: BIRTHDAY_META, content: JSON.stringify({ date: today }), encoding: 'utf-8' },
            ],
          })
          return { data: assetUrl(BIRTHDAY_PATH) }
        } catch (e: any) {
          return { error: e.message }
        }
      },
    }),
    uploadBranchAnniversaryImage: builder.mutation<string, File>({
      queryFn: async (file) => {
        try {
          await commitAssets({
            message: 'update branch anniversary image',
            files: [await fileToAsset(BRANCH_ANNIVERSARY_PATH, file)],
          })
          return { data: assetUrl(BRANCH_ANNIVERSARY_PATH) }
        } catch (e: any) {
          return { error: e.message }
        }
      },
    }),
  }),
})

export function getBirthdayPublicUrl(): string {
  return assetUrl(BIRTHDAY_PATH)
}

export function getBranchAnniversaryPublicUrl(): string {
  return assetUrl(BRANCH_ANNIVERSARY_PATH)
}

export const {
  useUploadBirthdayImageMutation,
  useUploadBranchAnniversaryImageMutation,
} = uploadApi
