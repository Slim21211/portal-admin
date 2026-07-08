import { ImportantPreset } from './types'

export const ACCENT_COLORS = [
  { value: '#FE5000', label: 'КСЭ оранжевый' },
  { value: '#3b5bdb', label: 'Синий' },
  { value: '#2e7d32', label: 'Зелёный' },
  { value: '#7B2D8B', label: 'Фиолетовый' },
  { value: '#e63946', label: 'Красный' },
  { value: '#111111', label: 'Тёмный' },
]

export const IMPORTANT_PRESETS: Record<
  ImportantPreset,
  { bg: string; border: string; label: string }
> = {
  warning: { bg: '#fff8f0', border: '#FE5000', label: '🟠 Предупреждение' },
  info:    { bg: '#f0f4ff', border: '#3b5bdb', label: '🔵 Информация' },
  success: { bg: '#f0fff4', border: '#2e7d32', label: '🟢 Успех' },
  neutral: { bg: '#f9f9f9', border: '#999999', label: '⚪ Нейтральный' },
}

export const MAX_BUTTON_TEXT = 24
export const MAX_BUTTONS = 3
