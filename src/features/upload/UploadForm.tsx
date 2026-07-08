import { useRef, useState } from 'react';
import { useUploadBirthdayImageMutation } from '../../api/uploadApi';
import { getBirthdayPublicUrl } from '../../api/supabaseClient';
import styles from './UploadForm.module.css';

const ACCEPTED = ['image/png', 'image/jpeg', 'image/jpg'];

export function UploadForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const [upload, { isLoading, isError, error }] =
    useUploadBirthdayImageMutation();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!ACCEPTED.includes(selected.type)) {
      alert('Поддерживаются только PNG и JPG');
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setUploadedUrl(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (!dropped) return;

    if (!ACCEPTED.includes(dropped.type)) {
      alert('Поддерживаются только PNG и JPG');
      return;
    }

    setFile(dropped);
    setPreview(URL.createObjectURL(dropped));
    setUploadedUrl(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    const result = await upload(file);

    if ('data' in result) {
      const today = new Date().toISOString().split('T')[0];
      setUploadedUrl(getBirthdayPublicUrl() + '?v=' + today);
      setFile(null);
      setPreview(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <form className={styles.card} onSubmit={handleSubmit} noValidate>
      <h2 className={styles.title}>Картинка с днём рождения сотрудников</h2>
      <p className={styles.subtitle}>
        Загрузи картинку для отображения на&nbsp;портале, название файла должно
        быть&nbsp;— daily_birthday
      </p>

      <div
        className={styles.dropzone}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="Предпросмотр" className={styles.preview} />
        ) : (
          <div className={styles.placeholder}>
            <span className={styles.icon}>🖼</span>
            <span>Перетащи файл сюда или нажми для выбора</span>
            <span className={styles.hint}>PNG, JPG</span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        onChange={handleFileChange}
        className={styles.hiddenInput}
      />

      {file && (
        <p className={styles.fileName}>
          Выбран файл: <strong>{file.name}</strong>
        </p>
      )}

      <button
        type="submit"
        className={styles.button}
        disabled={!file || isLoading}
      >
        {isLoading ? 'Загружаем...' : 'Загрузить на портал'}
      </button>

      {isError && (
        <p className={styles.error}>
          Ошибка: {typeof error === 'string' ? error : 'Что-то пошло не так'}
        </p>
      )}

      {uploadedUrl && (
        <div className={styles.success}>
          <span>✓ Загружено успешно</span>
          <img
            src={uploadedUrl}
            alt="Загруженная картинка"
            className={styles.uploaded}
          />
        </div>
      )}
    </form>
  );
}
