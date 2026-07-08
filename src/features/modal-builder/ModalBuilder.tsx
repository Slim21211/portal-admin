import { useRef, useState } from 'react'
import { ModalFormData, ModalButton } from './types'
import { ACCENT_COLORS, IMPORTANT_PRESETS, MAX_BUTTON_TEXT, MAX_BUTTONS } from './constants'
import { ModalPreview } from './ModalPreview'
import { useCreateModalMutation } from '../../api/modalApi'
import styles from './ModalBuilder.module.css'

const emptyForm: ModalFormData = {
  name: '',
  header_type: 'color',
  header_image_file: null,
  header_image_url: '',
  header_bg_color: '#FE5000',
  header_title: '',
  body_title: '',
  body_text: '',
  important_enabled: false,
  important_title: 'Важно',
  important_text: '',
  important_preset: 'warning',
  buttons: [],
  accent_color: '#FE5000',
}

export function ModalBuilder() {
  const [form, setForm] = useState<ModalFormData>(emptyForm)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [imageSource, setImageSource] = useState<'file' | 'url'>('file')
  const fileRef = useRef<HTMLInputElement>(null)

  const [createModal, { isLoading, isSuccess, isError, error, reset }] =
    useCreateModalMutation()

  function set<K extends keyof ModalFormData>(key: K, value: ModalFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function addButton() {
    if (form.buttons.length >= MAX_BUTTONS) return
    const btn: ModalButton = { text: 'Перейти', url: '', style: 'outline' }
    set('buttons', [...form.buttons, btn])
  }

  function updateButton(i: number, field: keyof ModalButton, value: string) {
    set(
      'buttons',
      form.buttons.map((b, idx) => (idx === i ? { ...b, [field]: value } : b)),
    )
  }

  function removeButton(i: number) {
    set('buttons', form.buttons.filter((_, idx) => idx !== i))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    set('header_image_file', file)
    if (file) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl('')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    reset()
    await createModal(form)
    setForm(emptyForm)
    setPreviewUrl('')
    if (fileRef.current) fileRef.current.value = ''
  }

  // Для превью строим временный объект с нужными полями
  const previewConfig = {
    ...form,
    header_image_url: imageSource === 'file' ? previewUrl : form.header_image_url,
  }

  const presetEntries = Object.entries(IMPORTANT_PRESETS) as [
    ModalFormData['important_preset'],
    (typeof IMPORTANT_PRESETS)[ModalFormData['important_preset']],
  ][]

  return (
    <div className={styles.root}>
      {/* ─── ФОРМА ─── */}
      <form className={styles.form} onSubmit={handleSubmit} noValidate>

        {/* Название */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Название модалки</h3>
          <label className={styles.field}>
            <span>Внутреннее название <span className={styles.optional}>только для вас, не показывается пользователям</span></span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Например: iSpring — новости июля 2026"
              required
            />
          </label>
        </section>

        {/* Шапка */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Шапка</h3>

          <div className={styles.toggleRow}>
            <button
              type="button"
              className={`${styles.typeBtn} ${form.header_type === 'color' ? styles.typeBtnActive : ''}`}
              onClick={() => set('header_type', 'color')}
            >Цвет + текст</button>
            <button
              type="button"
              className={`${styles.typeBtn} ${form.header_type === 'image' ? styles.typeBtnActive : ''}`}
              onClick={() => set('header_type', 'image')}
            >Картинка</button>
          </div>

          {form.header_type === 'image' ? (
            <>
              <div className={styles.toggleRow}>
                <button
                  type="button"
                  className={`${styles.typeBtn} ${imageSource === 'file' ? styles.typeBtnActive : ''}`}
                  onClick={() => setImageSource('file')}
                >Загрузить файл</button>
                <button
                  type="button"
                  className={`${styles.typeBtn} ${imageSource === 'url' ? styles.typeBtnActive : ''}`}
                  onClick={() => setImageSource('url')}
                >Внешний URL</button>
              </div>

              {imageSource === 'file' ? (
                <label className={styles.field}>
                  <span>Файл картинки</span>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleFileChange}
                    className={styles.fileInput}
                  />
                </label>
              ) : (
                <label className={styles.field}>
                  <span>URL картинки</span>
                  <input
                    type="url"
                    value={form.header_image_url}
                    onChange={(e) => set('header_image_url', e.target.value)}
                    placeholder="https://in.cse.ru/..."
                  />
                </label>
              )}
            </>
          ) : (
            <>
              <label className={styles.field}>
                <span>Текст заголовка</span>
                <input
                  type="text"
                  value={form.header_title}
                  onChange={(e) => set('header_title', e.target.value)}
                  required={form.header_type === 'color'}
                />
              </label>
              <div className={styles.field}>
                <span>Цвет фона</span>
                <div className={styles.colorPalette}>
                  {ACCENT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      className={`${styles.colorDot} ${form.header_bg_color === c.value ? styles.colorDotActive : ''}`}
                      style={{ background: c.value }}
                      title={c.label}
                      onClick={() => set('header_bg_color', c.value)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </section>

        {/* Контент */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Контент</h3>

          <label className={styles.field}>
            <span>Заголовок <span className={styles.optional}>необязательно</span></span>
            <input
              type="text"
              value={form.body_title}
              onChange={(e) => set('body_title', e.target.value)}
              placeholder="Оставь пустым если не нужен"
            />
          </label>

          <label className={styles.field}>
            <span>Основной текст</span>
            <textarea
              value={form.body_text}
              onChange={(e) => set('body_text', e.target.value)}
              rows={4}
            />
          </label>
        </section>

        {/* Важный блок */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Важный блок</h3>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={form.important_enabled}
                onChange={(e) => set('important_enabled', e.target.checked)}
              />
              Включить
            </label>
          </div>

          {form.important_enabled && (
            <>
              <label className={styles.field}>
                <span>Заголовок блока <span className={styles.optional}>необязательно</span></span>
                <input
                  type="text"
                  value={form.important_title}
                  onChange={(e) => set('important_title', e.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span>Текст блока</span>
                <textarea
                  value={form.important_text}
                  onChange={(e) => set('important_text', e.target.value)}
                  rows={3}
                />
              </label>
              <div className={styles.field}>
                <span>Стиль</span>
                <div className={styles.presetRow}>
                  {presetEntries.map(([key, preset]) => (
                    <button
                      key={key}
                      type="button"
                      className={`${styles.presetBtn} ${form.important_preset === key ? styles.presetBtnActive : ''}`}
                      style={form.important_preset === key ? { borderColor: preset.border, background: preset.bg } : {}}
                      onClick={() => set('important_preset', key)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>

        {/* Кнопки */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Кнопки</h3>
            {form.buttons.length < MAX_BUTTONS && (
              <button type="button" className={styles.addBtn} onClick={addButton}>
                + Добавить
              </button>
            )}
          </div>

          {form.buttons.length === 0 && (
            <p className={styles.hint}>Кнопки не добавлены — кнопка «Понятно» будет добавлена автоматически.</p>
          )}

          {form.buttons.map((btn, i) => (
            <div key={i} className={styles.buttonCard}>
              <div className={styles.buttonCardHeader}>
                <span>Кнопка {i + 1}</span>
                <button type="button" className={styles.removeBtn} onClick={() => removeButton(i)}>✕</button>
              </div>

              <label className={styles.field}>
                <span>Текст <span className={styles.charCount}>{btn.text.length}/{MAX_BUTTON_TEXT}</span></span>
                <input
                  type="text"
                  value={btn.text}
                  maxLength={MAX_BUTTON_TEXT}
                  onChange={(e) => updateButton(i, 'text', e.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span>Ссылка</span>
                <input
                  type="url"
                  value={btn.url}
                  onChange={(e) => updateButton(i, 'url', e.target.value)}
                  placeholder="https://..."
                />
              </label>

              <div className={styles.field}>
                <span>Стиль</span>
                <div className={styles.toggleRow}>
                  <button
                    type="button"
                    className={`${styles.typeBtn} ${btn.style === 'primary' ? styles.typeBtnActive : ''}`}
                    onClick={() => updateButton(i, 'style', 'primary')}
                  >Заливка</button>
                  <button
                    type="button"
                    className={`${styles.typeBtn} ${btn.style === 'outline' ? styles.typeBtnActive : ''}`}
                    onClick={() => updateButton(i, 'style', 'outline')}
                  >Контур</button>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Настройки */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Настройки</h3>
          <div className={styles.field}>
            <span>Акцентный цвет <span className={styles.optional}>кнопка «Понятно» и контур кнопок</span></span>
            <div className={styles.colorPalette}>
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`${styles.colorDot} ${form.accent_color === c.value ? styles.colorDotActive : ''}`}
                  style={{ background: c.value }}
                  title={c.label}
                  onClick={() => set('accent_color', c.value)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Submit */}
        {isError && (
          <p className={styles.errorMsg}>
            Ошибка: {typeof error === 'string' ? error : 'Что-то пошло не так'}
          </p>
        )}
        {isSuccess && (
          <p className={styles.successMsg}>✓ Модалка сохранена! Активируй её в списке ниже.</p>
        )}

        <button type="submit" className={styles.submitBtn} disabled={isLoading}>
          {isLoading ? 'Сохраняем...' : 'Сохранить модалку'}
        </button>
      </form>

      {/* ─── ПРЕВЬЮ ─── */}
      <div className={styles.previewCol}>
        <p className={styles.previewLabel}>Предпросмотр</p>
        <ModalPreview config={previewConfig} />
      </div>
    </div>
  )
}
