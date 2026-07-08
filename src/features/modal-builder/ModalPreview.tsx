import { ModalFormData } from './types'
import { IMPORTANT_PRESETS } from './constants'
import styles from './ModalPreview.module.css'

interface Props {
  config: ModalFormData & { header_image_url?: string | null }
}

export function ModalPreview({ config }: Props) {
  const preset = IMPORTANT_PRESETS[config.important_preset]
  const imageUrl = config.header_image_url || ''

  return (
    <div className={styles.container}>
      <div className={styles.modal}>

        {config.header_type === 'image' && imageUrl ? (
          <img src={imageUrl} className={styles.headerImg} alt="" />
        ) : (
          <div className={styles.headerColor} style={{ background: config.header_bg_color }}>
            <p className={styles.headerTitle}>{config.header_title || 'Заголовок'}</p>
          </div>
        )}

        <div className={styles.body}>
          {config.body_title && <p className={styles.bodyTitle}>{config.body_title}</p>}
          {config.body_text && <p className={styles.bodyText}>{config.body_text}</p>}

          {config.important_enabled && (
            <div className={styles.important} style={{ background: preset.bg, borderLeftColor: preset.border }}>
              {config.important_title && (
                <p className={styles.importantTitle} style={{ color: preset.border }}>{config.important_title}</p>
              )}
              <p className={styles.importantText}>{config.important_text || 'Текст важного блока'}</p>
            </div>
          )}

          {config.buttons.length > 0 && (
            <div className={styles.buttons}>
              {config.buttons.map((btn, i) => (
                <span
                  key={i}
                  className={styles.button}
                  style={
                    btn.style === 'primary'
                      ? { background: config.accent_color, color: '#fff', border: 'none' }
                      : { background: '#fff', color: config.accent_color, border: `1.5px solid ${config.accent_color}` }
                  }
                >
                  {btn.text || 'Кнопка'}
                </span>
              ))}
            </div>
          )}

          <div className={styles.footer}>
            <span className={styles.closeBtn} style={{ background: config.accent_color }}>Понятно</span>
          </div>
        </div>
      </div>
    </div>
  )
}
