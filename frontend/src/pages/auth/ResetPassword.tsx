import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import styles from './Auth.module.css';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [form, setForm] = useState({
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError('Недействительная ссылка восстановления');
      return;
    }

    if (form.password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/password/reset', {
        token,
        password: form.password,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Не удалось обновить пароль');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1>Недействительная ссылка</h1>
            <p>Пожалуйста, запросите новую ссылку для восстановления пароля.</p>
          </div>
          <div className={styles.form}>
            <Link to="/forgot-password" className={styles.backLink}>
              Запросить новую ссылку →
            </Link>
          </div>
        </div>
        <div className={styles.sidebarInfo}>
          <h2>Восстановление доступа</h2>
          <p>Ссылка могла устареть или уже использована.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1>Пароль обновлен</h1>
            <p>Вы будете перенаправлены на страницу входа через несколько секунд.</p>
          </div>

          <div className={styles.form}>
            <div className={styles.successMessage}>✓ Пароль успешно обновлен.</div>
            <Link to="/login" className={styles.backLink}>
              Перейти к входу →
            </Link>
          </div>
        </div>

        <div className={styles.sidebarInfo}>
          <h2>Успешно</h2>
          <p>Теперь вы можете войти, используя новый пароль.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>Создайте новый пароль</h1>
          <p>Придумайте надежный пароль длиной минимум 8 символов.</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label>
            Новый пароль
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>

          <label>
            Повторите пароль
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'Сохраняем...' : 'Сохранить новый пароль'}
          </button>
        </form>

        <div className={styles.footer}>
          <Link to="/login">← Вернуться к входу</Link>
        </div>
      </div>

      <div className={styles.sidebarInfo}>
        <h2>Советы по безопасности</h2>
        <ul>
          <li>Используйте уникальный пароль</li>
          <li>Не делитесь паролем ни с кем</li>
          <li>Обновляйте пароли регулярно</li>
        </ul>
      </div>
    </div>
  );
};

export default ResetPassword;
