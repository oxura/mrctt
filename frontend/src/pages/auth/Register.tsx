import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import styles from './Auth.module.css';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    acceptTerms: false,
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value, type } = event.target;
    const isCheckbox = type === 'checkbox';
    const checked = isCheckbox ? (event.target as HTMLInputElement).checked : undefined;
    setForm((prev) => ({
      ...prev,
      [name]: isCheckbox ? Boolean(checked) : value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.acceptTerms) {
      setError('Для регистрации необходимо согласиться с офертой');
      return;
    }

    const password = form.password;
    if (password.length < 10 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      setError('Пароль должен содержать минимум 10 символов, включая заглавную и строчную буквы, цифру и специальный символ');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const payload = {
        email: form.email,
        password: form.password,
        firstName: form.firstName,
      };

      const { data } = await api.post('/auth/register', payload);
      setAuth(data.data);
      navigate('/onboarding');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Не удалось создать аккаунт');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>Создать аккаунт</h1>
          <p>3 шага: регистрация → настройка → первый лид</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label>
            Email <span className={styles.required}>*</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
            />
          </label>

          <label>
            Пароль <span className={styles.required}>*</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Минимум 10 символов: A-Z, a-z, 0-9, спецсимвол"
              required
              minLength={10}
            />
            <small style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem', display: 'block' }}>
              Минимум 10 символов, включая заглавные, строчные буквы, цифру и спецсимвол
            </small>
          </label>

          <label>
            Имя <span className={styles.required}>*</span>
            <input
              type="text"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              placeholder="Ваше имя"
              required
            />
          </label>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="acceptTerms"
              checked={form.acceptTerms}
              onChange={handleChange}
            />
            <span>Я согласен с <a href="/terms" target="_blank">офертой</a> и <a href="/privacy" target="_blank">политикой конфиденциальности</a></span>
          </label>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" disabled={loading} className={styles.primary}>
            {loading ? 'Создаём аккаунт...' : 'Создать аккаунт'}
          </button>
        </form>

        <div className={styles.footer}>
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </div>
      </div>

      <div className={styles.sidebarInfo}>
        <h2>Онбординг за 2 минуты</h2>
        <p>Система сама настроит модули под вашу нишу и предложит готовые шаблоны.</p>
        <ul>
          <li>⚡ Быстрая настройка</li>
          <li>🧠 Готовые пресеты под индустрии</li>
          <li>📈 Дэшборд с первыми метриками</li>
        </ul>
      </div>
    </div>
  );
};

export default Register;
