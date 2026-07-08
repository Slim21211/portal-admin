import { useState } from 'react';
import { UploadForm } from './features/upload/UploadForm';
import { ModalBuilder } from './features/modal-builder/ModalBuilder';
import styles from './App.module.css';

type Tab = 'birthday' | 'modal-builder';

export function App() {
  const [tab, setTab] = useState<Tab>('birthday');

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <span className={styles.logo}>КСЭ</span>
        <span className={styles.headerTitle}>Портал — Панель управления</span>
      </header>

      <nav className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'birthday' ? styles.tabActive : ''}`}
          onClick={() => setTab('birthday')}
        >
          🎂 День рождения
        </button>
        <button
          className={`${styles.tab} ${tab === 'modal-builder' ? styles.tabActive : ''}`}
          onClick={() => setTab('modal-builder')}
        >
          🪟 Конструктор модалок
        </button>
      </nav>

      <main className={styles.main}>
        {tab === 'birthday' && <UploadForm />}
        {tab === 'modal-builder' && <ModalBuilder />}
      </main>
    </div>
  );
}
