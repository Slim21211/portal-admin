import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { supabase } from './supabaseClient';

export interface City {
  id: string;
  name: string;
  url: string;
  is_pinned: boolean;
  created_at: string;
}

export interface CityInput {
  name: string;
  url: string;
  is_pinned: boolean;
}

const TABLE = 'cities';

export const citiesApi = createApi({
  reducerPath: 'citiesApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['City'],
  endpoints: (builder) => ({
    listCities: builder.query<City[], void>({
      queryFn: async () => {
        const { data, error } = await supabase.from(TABLE).select('*');
        if (error) return { error: error.message };
        const sorted = (data as City[]).sort((a, b) =>
          a.name.localeCompare(b.name, 'ru')
        );
        return { data: sorted };
      },
      providesTags: ['City'],
    }),

    addCity: builder.mutation<City, CityInput>({
      queryFn: async (input) => {
        const { data, error } = await supabase
          .from(TABLE)
          .insert(input)
          .select()
          .single();
        if (error) return { error: error.message };
        return { data: data as City };
      },
      invalidatesTags: ['City'],
    }),

    updateCity: builder.mutation<City, { id: string } & CityInput>({
      queryFn: async ({ id, ...input }) => {
        const { data, error } = await supabase
          .from(TABLE)
          .update(input)
          .eq('id', id)
          .select()
          .single();
        if (error) return { error: error.message };
        return { data: data as City };
      },
      invalidatesTags: ['City'],
    }),

    deleteCity: builder.mutation<void, string>({
      queryFn: async (id) => {
        const { error } = await supabase.from(TABLE).delete().eq('id', id);
        if (error) return { error: error.message };
        return { data: undefined };
      },
      invalidatesTags: ['City'],
    }),

    importCities: builder.mutation<
      { added: number; updated: number },
      CityInput[]
    >({
      queryFn: async (rows) => {
        const { data: existing, error: fetchError } = await supabase
          .from(TABLE)
          .select('id, name');
        if (fetchError) return { error: fetchError.message };

        const existingMap = new Map(
          (existing as { id: string; name: string }[]).map((c) => [
            c.name.toLowerCase(),
            c.id,
          ])
        );

        const toInsert: CityInput[] = [];
        const toUpdate: { id: string; url: string }[] = [];

        for (const row of rows) {
          const existingId = existingMap.get(row.name.toLowerCase());
          if (existingId) {
            toUpdate.push({ id: existingId, url: row.url });
          } else {
            toInsert.push(row);
          }
        }

        if (toInsert.length > 0) {
          const { error } = await supabase.from(TABLE).insert(toInsert);
          if (error) return { error: error.message };
        }

        for (const { id, url } of toUpdate) {
          const { error } = await supabase
            .from(TABLE)
            .update({ url })
            .eq('id', id);
          if (error) return { error: error.message };
        }

        return { data: { added: toInsert.length, updated: toUpdate.length } };
      },
      invalidatesTags: ['City'],
    }),
  }),
});

export const {
  useListCitiesQuery,
  useAddCityMutation,
  useUpdateCityMutation,
  useDeleteCityMutation,
  useImportCitiesMutation,
} = citiesApi;
