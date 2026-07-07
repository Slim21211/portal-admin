import { configureStore } from '@reduxjs/toolkit'
import { uploadApi } from '../api/uploadApi'

export const store = configureStore({
  reducer: {
    [uploadApi.reducerPath]: uploadApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(uploadApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
