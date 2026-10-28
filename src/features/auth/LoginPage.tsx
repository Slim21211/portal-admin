import { useState } from 'react';
import { supabase } from '../../api/supabaseClient';
import styles from './LoginPage.module.css';

interface Props {
  forbiddenEmail?: string | null;
}

export function LoginPage({ forbiddenEmail }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setIsLoading(false);
    if (error) setError('Неверная почта или пароль');
  }

  if (forbiddenEmail) {
    return (
      <div className={styles.root}>
        <div className={styles.card}>
          <h2 className={styles.title}>Нет доступа</h2>
          <p className={styles.text}>
            У <strong>{forbiddenEmail}</strong> нет прав администратора.
            Обратитесь к владельцу панели.
          </p>
          <button
            className={styles.button}
            onClick={() => supabase.auth.signOut()}
          >
            Выйти
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <span className={styles.logo}>КСЭ</span>
        <h2 className={styles.title}>Панель управления порталом</h2>

        <label className={styles.field}>
          <span>Почта</span>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </label>

        <label className={styles.field}>
          <span>Пароль</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <button
          type="submit"
          className={styles.button}
          disabled={isLoading || !email || !password}
        >
          {isLoading ? 'Входим...' : 'Войти'}
        </button>
      </form>
    </div>
  );
}
