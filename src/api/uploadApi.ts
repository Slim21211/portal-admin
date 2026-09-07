import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import { githubPutBinary, githubPutText, GITHUB_PAGES_URL } from './githubClient'

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
          const url = await githubPutBinary(BIRTHDAY_PATH, file, 'update daily birthday image')
          // Пишем дату загрузки (МСК) — по ней портал решает, актуальна ли картинка
          const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Moscow' }) // YYYY-MM-DD
          await githubPutText(BIRTHDAY_META, JSON.stringify({ date: today }), 'update birthday meta')
          return { data: url }
        } catch (e: any) {
          return { error: e.message }
        }
      },
    }),
    uploadBranchAnniversaryImage: builder.mutation<string, File>({
      queryFn: async (file) => {
        try {
          const url = await githubPutBinary(BRANCH_ANNIVERSARY_PATH, file, 'update branch anniversary image')
          return { data: url }
        } catch (e: any) {
          return { error: e.message }
        }
      },
    }),
  }),
})

export function getBirthdayPublicUrl(): string {
  return `${GITHUB_PAGES_URL}/${BIRTHDAY_PATH}`
}

export function getBranchAnniversaryPublicUrl(): string {
  return `${GITHUB_PAGES_URL}/${BRANCH_ANNIVERSARY_PATH}`
}

export const {
  useUploadBirthdayImageMutation,
  useUploadBranchAnniversaryImageMutation,
} = uploadApi
