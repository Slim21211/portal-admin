import { useState } from 'react';
import {
  City,
  CityInput,
  useAddCityMutation,
  useUpdateCityMutation,
} from '../../api/citiesApi';
import styles from './EditCityModal.module.css';

interface Props {
  city: City | null;
  onClose: () => void;
}

export function EditCityModal({ city, onClose }: Props) {
  const [name, setName] = useState(city?.name ?? '');
  const [url, setUrl] = useState(city?.url ?? '');
  const [isPinned, setIsPinned] = useState(city?.is_pinned ?? false);

  const [addCity, { isLoading: isAdding }] = useAddCityMutation();
  const [updateCity, { isLoading: isUpdating }] = useUpdateCityMutation();
  const isLoading = isAdding || isUpdating;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input: CityInput = {
      name: name.trim(),
      url: url.trim(),
      is_pinned: isPinned,
    };
    const result = city
      ? await updateCity({ id: city.id, ...input })
      : await addCity(input);
    if ('data' in result) onClose();
  }

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modal}>
        <h3 className={styles.title}>
          {city ? 'Редактировать город' : 'Добавить город'}
        </h3>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.field}>
            <span>Название города</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Сургут"
              required
              autoFocus
            />
          </label>

          <label className={styles.field}>
            <span>Ссылка на регистрацию</span>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://cse.ispring.ru/..."
              required
            />
          </label>

          <label className={styles.checkboxField}>
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
            />
            Закреплён вверху (Москва, МО)
          </label>

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.btnCancel}
              onClick={onClose}
            >
              Отмена
            </button>
            <button
              type="submit"
              className={styles.btnSave}
              disabled={isLoading}
            >
              {isLoading ? 'Сохраняем...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
