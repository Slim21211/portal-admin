export interface ModalButton {
  text: string
  url: string
  style: 'primary' | 'outline'
}

export type ImportantPreset = 'warning' | 'info' | 'success' | 'neutral'
export type HeaderType = 'image' | 'color'

// Запись в БД
export interface Modal {
  id: string
  created_at: string
  name: string
  header_type: HeaderType
  header_image_url: string | null
  header_bg_color: string
  header_title: string
  body_title: string
  body_text: string
  important_enabled: boolean
  important_title: string
  important_text: string
  important_preset: ImportantPreset
  buttons: ModalButton[]
  accent_color: string
  is_active: boolean
}

// Данные формы (header_image_file — только во время заполнения, не идёт в БД напрямую)
export interface ModalFormData {
  name: string
  header_type: HeaderType
  header_image_file: File | null
  header_image_url: string
  header_bg_color: string
  header_title: string
  body_title: string
  body_text: string
  important_enabled: boolean
  important_title: string
  important_text: string
  important_preset: ImportantPreset
  buttons: ModalButton[]
  accent_color: string
}
