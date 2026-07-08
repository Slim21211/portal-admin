import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const BUCKET = 'portal-assets';
export const BIRTHDAY_PATH = 'birthday/daily_birthday.png';
export const MODAL_IMAGES_FOLDER = 'modal-headers';

export function getBirthdayPublicUrl(): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(BIRTHDAY_PATH);
  return data.publicUrl;
}

export function getStoragePublicUrl(path: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
