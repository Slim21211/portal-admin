import { UploadForm } from './features/upload/UploadForm'
import styles from './App.module.css'

export function App() {
  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <span className={styles.logo}>КСЭ</span>
        <span className={styles.headerTitle}>Портал — Панель управления</span>
      </header>

      <main className={styles.main}>
        <UploadForm />
      </main>
    </div>
  )
}
