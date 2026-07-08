import { useListModalsQuery, useSetActiveModalMutation, useDeleteModalMutation } from '../../api/modalApi'
import { Modal } from './types'
import styles from './ModalList.module.css'

export function ModalList() {
  const { data: modals, isLoading, isError } = useListModalsQuery()
  const [setActive, { isLoading: isSettingActive }] = useSetActiveModalMutation()
  const [deleteModal, { isLoading: isDeleting }] = useDeleteModalMutation()

  if (isLoading) return <p className={styles.status}>Загружаем...</p>
  if (isError) return <p className={styles.statusError}>Ошибка загрузки</p>
  if (!modals?.length) return <p className={styles.status}>Модалок пока нет — создай первую выше.</p>

  function handleActivate(modal: Modal) {
    setActive(modal.is_active ? null : modal.id)
  }

  function handleDelete(modal: Modal) {
    if (!confirm(`Удалить «${modal.name || 'Без названия'}»?`)) return
    deleteModal(modal)
  }

  return (
    <div className={styles.root}>
      <h3 className={styles.title}>Сохранённые модалки</h3>
      <p className={styles.subtitle}>Только одна может быть активной — именно её увидят сотрудники на портале.</p>

      <ul className={styles.list}>
        {modals.map((modal) => (
          <li key={modal.id} className={`${styles.item} ${modal.is_active ? styles.itemActive : ''}`}>
            <div className={styles.itemInfo}>
              <div className={styles.itemHeader}>
                <span className={styles.itemName}>{modal.name || 'Без названия'}</span>
                {modal.is_active && <span className={styles.activeBadge}>● Активна</span>}
              </div>
              <span className={styles.itemDate}>
                {new Date(modal.created_at).toLocaleDateString('ru-RU', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
              </span>
              {modal.header_title && (
                <span className={styles.itemDesc}>{modal.header_title}</span>
              )}
            </div>

            <div className={styles.itemActions}>
              <button
                className={`${styles.btn} ${modal.is_active ? styles.btnDeactivate : styles.btnActivate}`}
                onClick={() => handleActivate(modal)}
                disabled={isSettingActive}
              >
                {modal.is_active ? 'Деактивировать' : 'Сделать активной'}
              </button>
              <button
                className={`${styles.btn} ${styles.btnDelete}`}
                onClick={() => handleDelete(modal)}
                disabled={isDeleting}
              >
                Удалить
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
