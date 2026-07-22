import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  useListCitiesQuery,
  useDeleteCityMutation,
  useImportCitiesMutation,
  City,
} from '../../api/citiesApi';
import { EditCityModal } from './EditCityModal';
import styles from './CitiesPage.module.css';

export function CitiesPage() {
  const { data: cities, isLoading, isError } = useListCitiesQuery();
  const [deleteCity] = useDeleteCityMutation();
  const [importCities, { isLoading: isImporting }] = useImportCitiesMutation();

  const [editingCity, setEditingCity] = useState<City | 'new' | null>(null);
  const [importResult, setImportResult] = useState<{
    added: number;
    updated: number;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleDelete(city: City) {
    if (!confirm(`Удалить «${city.name}»?`)) return;
    await deleteCity(city.id);
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws);

    const parsed = rows.flatMap((row) => {
      const keys = Object.keys(row);
      const nameKey = keys.find((k) => /город|назван|city|name/i.test(k));
      const urlKey = keys.find((k) => /ссылк|url|link/i.test(k));
      if (!nameKey || !urlKey) return [];
      const name = String(row[nameKey]).trim();
      const url = String(row[urlKey]).trim();
      if (!name || !url) return [];
      return [{ name, url, is_pinned: false }];
    });

    if (parsed.length === 0) {
      alert(
        'Не найдены нужные колонки.\nОжидаемые заголовки: «Город» и «Ссылка»'
      );
      return;
    }

    const result = await importCities(parsed);
    if ('data' in result && result.data) {
      setImportResult(result.data);
      setTimeout(() => setImportResult(null), 4000);
    }
  }

  if (isLoading) return <p className={styles.status}>Загружаем...</p>;
  if (isError) return <p className={styles.statusError}>Ошибка загрузки</p>;

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <h3 className={styles.title}>
          Города и ссылки
          <span className={styles.count}>{cities?.length ?? 0}</span>
        </h3>
        <div className={styles.actions}>
          {importResult && (
            <span className={styles.importResult}>
              ✓ Добавлено: {importResult.added}, обновлено:{' '}
              {importResult.updated}
            </span>
          )}

          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImportFile}
            className={styles.hiddenInput}
          />
          <button
            className={styles.btnSecondary}
            onClick={() => fileRef.current?.click()}
            disabled={isImporting}
          >
            {isImporting ? 'Импортируем...' : '📥 Импорт из Excel'}
          </button>
          <button
            className={styles.btnPrimary}
            onClick={() => setEditingCity('new')}
          >
            + Добавить город
          </button>
        </div>
      </div>

      <p className={styles.hint}>
        Колонки в Excel: <strong>Город</strong> и <strong>Ссылка</strong>.<br />
        При совпадении названия — ссылка обновится, новые города добавятся.
      </p>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thName}>Город</th>
              <th className={styles.thUrl}>Ссылка</th>
              <th className={styles.thPin}>📍</th>
              <th className={styles.thActions}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {cities?.map((city) => (
              <tr key={city.id} className={styles.row}>
                <td className={styles.tdName}>{city.name}</td>
                <td className={styles.tdUrl}>
                  <a
                    href={city.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.link}
                  >
                    {city.url}
                  </a>
                </td>
                <td className={styles.tdPin}>{city.is_pinned && '📍'}</td>
                <td className={styles.tdActions}>
                  <button
                    className={styles.btnEdit}
                    onClick={() => setEditingCity(city)}
                  >
                    Изменить
                  </button>
                  <button
                    className={styles.btnDelete}
                    onClick={() => handleDelete(city)}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.cardList}>
        {cities?.map((city) => (
          <div key={city.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardName}>{city.name}</span>
              {city.is_pinned && <span className={styles.cardPin}>📍</span>}
            </div>
            <a
              href={city.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.cardUrl}
            >
              {city.url}
            </a>
            <div className={styles.cardActions}>
              <button
                className={styles.btnEdit}
                onClick={() => setEditingCity(city)}
              >
                Изменить
              </button>
              <button
                className={styles.btnDelete}
                onClick={() => handleDelete(city)}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {editingCity && (
        <EditCityModal
          city={editingCity === 'new' ? null : editingCity}
          onClose={() => setEditingCity(null)}
        />
      )}
    </div>
  );
}
