import { configureStore } from '@reduxjs/toolkit';
import { uploadApi } from '../api/uploadApi';
import { modalApi } from '../api/modalApi';
import { citiesApi } from '../api/citiesApi';

export const store = configureStore({
  reducer: {
    [uploadApi.reducerPath]: uploadApi.reducer,
    [modalApi.reducerPath]: modalApi.reducer,
    [citiesApi.reducerPath]: citiesApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(uploadApi.middleware)
      .concat(modalApi.middleware)
      .concat(citiesApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
