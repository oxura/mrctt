import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import styles from './Auth.module.css';

const ForgotPassword: React.FC = () => {
  const [form, setForm] = useState({
    email: '',
    tenantSlug: '',
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
    setSuccess(false);
    setLoading(true);

    try {
      await api.post('/auth/password/forgot', form);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка отправки письма');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1>Проверьте почту</h1>
            <p>
              Если аккаунт с email <strong>{form.email}</strong> существует, на него отправлено
              письмо с инструкциями по восстановлению пароля.
            </p>
          </div>

          <div className={styles.form}>
            <div className={styles.successMessage}>
              ✓ Письмо отправлено. Проверьте папку "Спам", если не видите его во входящих.
            </div>

            <Link to="/login" className={styles.backLink}>
              ← Вернуться к входу
            </Link>
          </div>
        </div>

        <div className={styles.sidebarInfo}>
          <h2>Безопасность данных</h2>
          <p>Ссылка для восстановления действительна в течение 1 часа.</p>
          <ul>
            <li>🔐 Защищенное соединение</li>
            <li>⏱️ Временная ссылка</li>
            <li>🔒 Одноразовый токен</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>Забыли пароль?</h1>
          <p>Введите email и адрес рабочей области для восстановления доступа</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
              placeholder="your.email@example.com"
            />
          </label>

          <label>
            Адрес рабочей области
            <div className={styles.slugField}>
              <input
                type="text"
                name="tenantSlug"
                placeholder="company"
                value={form.tenantSlug}
                onChange={handleChange}
                required
              />
              <span>.ecosystem.app</span>
            </div>
          </label>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'Отправляем...' : 'Отправить ссылку для восстановления'}
          </button>
        </form>

        <div className={styles.footer}>
          <Link to="/login">← Вернуться к входу</Link>
          <span>
            Нет аккаунта? <Link to="/register">Создать</Link>
          </span>
        </div>
      </div>

      <div className={styles.sidebarInfo}>
        <h2>Восстановление доступа</h2>
        <p>На указанный email будет отправлена ссылка для создания нового пароля.</p>
        <ul>
          <li>📧 Проверьте почту</li>
          <li>🔗 Перейдите по ссылке</li>
          <li>🔑 Создайте новый пароль</li>
        </ul>
      </div>
    </div>
  );
};

export default ForgotPassword;
