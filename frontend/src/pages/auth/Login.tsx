import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import styles from './Auth.module.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [form, setForm] = useState({
    email: '',
    password: '',
    tenantSlug: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', form);
      setAuth(data.data);
      
      const onboardingCompleted = data.data.tenant?.settings?.onboarding?.completed;
      if (!onboardingCompleted) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>Войти в систему</h1>
          <p>Введите свои данные, чтобы продолжить</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Пароль
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              required
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
            {loading ? 'Входим...' : 'Войти'}
          </button>
        </form>

        <div className={styles.footer}>
          <Link to="/forgot-password">Забыли пароль?</Link>
          <span>
            Нет аккаунта? <Link to="/register">Создать</Link>
          </span>
        </div>
      </div>
      <div className={styles.sidebarInfo}>
        <h2>Экосистема заявок</h2>
        <p>Универсальная CRM, которая адаптируется под ваш бизнес за пару минут.</p>
        <ul>
          <li>🌍 Мультитенантная архитектура</li>
          <li>🔐 JWT аутентификация</li>
          <li>🧩 Модули включаются/выключаются под нишу</li>
        </ul>
      </div>
    </div>
  );
};

export default Login;
