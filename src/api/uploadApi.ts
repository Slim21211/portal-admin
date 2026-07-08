import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { supabase, BUCKET, BIRTHDAY_PATH } from './supabaseClient';

export const uploadApi = createApi({
  reducerPath: 'uploadApi',
  baseQuery: fakeBaseQuery(),
  endpoints: (builder) => ({
    uploadBirthdayImage: builder.mutation<string, File>({
      queryFn: async (file) => {
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(BIRTHDAY_PATH, file, {
            upsert: true,
            contentType: file.type,
          });

        if (error) return { error: error.message };

        const { data } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(BIRTHDAY_PATH);

        return { data: data.publicUrl };
      },
    }),
  }),
});

export const { useUploadBirthdayImageMutation } = uploadApi;
