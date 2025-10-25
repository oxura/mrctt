import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import styles from './Auth.module.css';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const Register: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    companyName: '',
    companySlug: '',
    country: '',
    city: '',
    industry: '',
    acceptTerms: false,
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'companyName' &&
        !prev.companySlug && {
          companySlug: slugify(value),
        }),
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.acceptTerms) {
      setError('Для регистрации необходимо согласиться с офертой');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const payload = {
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        companyName: form.companyName,
        companySlug: form.companySlug || slugify(form.companyName),
        country: form.country,
        city: form.city,
        industry: form.industry,
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
            Email
            <input
              type="email"
              name="email"
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
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
            />
          </label>

          <label>
            Имя
            <input
              type="text"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
            />
          </label>

          <label>
            Фамилия
            <input
              type="text"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
            />
          </label>

          <label>
            Название компании
            <input
              type="text"
              name="companyName"
              value={form.companyName}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Адрес рабочей области
            <div className={styles.slugField}>
              <input
                type="text"
                name="companySlug"
                placeholder="company"
                value={form.companySlug}
                onChange={handleChange}
                required
              />
              <span>.ecosystem.app</span>
            </div>
          </label>

          <label>
            Страна
            <input
              type="text"
              name="country"
              value={form.country}
              onChange={handleChange}
            />
          </label>

          <label>
            Город
            <input
              type="text"
              name="city"
              value={form.city}
              onChange={handleChange}
            />
          </label>

          <label>
            Ниша
            <select name="industry" value={form.industry} onChange={handleChange}>
              <option value="">Выберите нишу</option>
              <option value="courses">Онлайн-школа / курсы</option>
              <option value="services">Услуги / фриланс</option>
              <option value="medicine">Медицина / клиника</option>
              <option value="tourism">Туризм / мероприятия</option>
              <option value="other">Другое</option>
            </select>
          </label>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="acceptTerms"
              checked={form.acceptTerms}
              onChange={handleChange}
            />
            <span>Я согласен с офертой и политикой конфиденциальности</span>
          </label>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'Создаём...' : 'Создать аккаунт'}
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
