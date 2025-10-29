import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './Auth.module.css';
import api from '../../utils/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const AcceptInvite: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState<{
    email: string;
    role: string;
    companyName: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrors({ general: 'Недействительная ссылка-приглашение' });
      setLoading(false);
      return;
    }

    const verifyInvite = async () => {
      try {
        const response = await api.get(`/api/v1/users/team/invite/${token}`);
        setInviteData(response.data.data);
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'response' in err) {
          const response = (err as { response?: { data?: { message?: string } } }).response;
          setErrors({
            general: response?.data?.message || 'Приглашение недействительно или истекло',
          });
        } else {
          setErrors({ general: 'Приглашение недействительно или истекло' });
        }
      } finally {
        setLoading(false);
      }
    };

    verifyInvite();
  }, [token]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Имя обязательно';
    }

    if (!formData.password) {
      newErrors.password = 'Пароль обязателен';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Пароль должен содержать минимум 8 символов';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validate()) {
      return;
    }

    if (!token) {
      setErrors({ general: 'Недействительный токен' });
      return;
    }

    setProcessing(true);

    try {
      await api.post('/api/v1/users/team/accept-invite', {
        token,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName || undefined,
      });

      navigate('/login', {
        state: {
          message:
            'Приглашение принято! Теперь вы можете войти в систему с использованием своего email и пароля.',
        },
      });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { data?: { message?: string } } }).response;
        setErrors({ general: response?.data?.message || 'Не удалось принять приглашение' });
      } else {
        setErrors({ general: 'Не удалось принять приглашение' });
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (loading) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <p>Проверка приглашения...</p>
        </div>
      </div>
    );
  }

  if (!inviteData) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <h1>Недействительное приглашение</h1>
          {errors.general && <div className={styles.error}>{errors.general}</div>}
          <Button onClick={() => navigate('/login')} fullWidth>
            Перейти к входу
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <h1>Принять приглашение</h1>
        <p className={styles.description}>
          Вы приглашены присоединиться к команде <strong>{inviteData.companyName}</strong> в
          качестве <strong>{inviteData.role === 'admin' ? 'Администратора' : 'Менеджера'}</strong>.
        </p>
        <p className={styles.description}>Email: <strong>{inviteData.email}</strong></p>

        {errors.general && <div className={styles.error}>{errors.general}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Имя"
            type="text"
            value={formData.firstName}
            onChange={handleChange('firstName')}
            error={errors.firstName}
            placeholder="Иван"
            required
          />

          <Input
            label="Фамилия (необязательно)"
            type="text"
            value={formData.lastName}
            onChange={handleChange('lastName')}
            placeholder="Иванов"
          />

          <Input
            label="Пароль"
            type="password"
            value={formData.password}
            onChange={handleChange('password')}
            error={errors.password}
            placeholder="Минимум 8 символов"
            required
          />

          <Input
            label="Подтвердите пароль"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange('confirmPassword')}
            error={errors.confirmPassword}
            placeholder="Повторите пароль"
            required
          />

          <Button type="submit" fullWidth disabled={processing}>
            {processing ? 'Создание аккаунта...' : 'Принять приглашение'}
          </Button>
        </form>

        <div className={styles.footer}>
          <p>
            Уже есть аккаунт?{' '}
            <a href="/login" onClick={(e) => {
              e.preventDefault();
              navigate('/login');
            }}>
              Войти
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvite;
