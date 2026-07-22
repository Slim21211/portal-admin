import { useState } from 'react';
import { UploadForm } from './features/upload/UploadForm';
import { ModalBuilder } from './features/modal-builder/ModalBuilder';
import { ModalList } from './features/modal-builder/ModalList';
import { CitiesPage } from './features/cities/CitiesPage';
import { BranchAnniversaryForm } from './features/upload/BranchAnniversaryForm';

import styles from './App.module.css';

type Tab = 'birthday' | 'modals' | 'cities';
type ModalSubTab = 'create' | 'list';

export function App() {
  const [tab, setTab] = useState<Tab>('birthday');
  const [subTab, setSubTab] = useState<ModalSubTab>('create');

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
          className={`${styles.tab} ${tab === 'modals' ? styles.tabActive : ''}`}
          onClick={() => setTab('modals')}
        >
          🪟 Модальные окна
        </button>
        <button
          className={`${styles.tab} ${tab === 'cities' ? styles.tabActive : ''}`}
          onClick={() => setTab('cities')}
        >
          🗺️ Города
        </button>
      </nav>

      <main className={styles.main}>
        {tab === 'birthday' && (
          <div className={styles.birthdayPage}>
            <UploadForm />
            <BranchAnniversaryForm />
          </div>
        )}

        {tab === 'modals' && (
          <div className={styles.modalsPage}>
            <nav className={styles.subTabs}>
              <button
                className={`${styles.subTab} ${subTab === 'create' ? styles.subTabActive : ''}`}
                onClick={() => setSubTab('create')}
              >
                ✏️ Создать
              </button>
              <button
                className={`${styles.subTab} ${subTab === 'list' ? styles.subTabActive : ''}`}
                onClick={() => setSubTab('list')}
              >
                📋 Список модалок
              </button>
            </nav>
            {subTab === 'create' && (
              <ModalBuilder onSaved={() => setSubTab('list')} />
            )}
            {subTab === 'list' && <ModalList />}
          </div>
        )}

        {tab === 'cities' && <CitiesPage />}
      </main>
    </div>
  );
}
