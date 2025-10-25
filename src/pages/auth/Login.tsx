import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { isValidEmail, sanitizeString } from '../../utils/validation';
import { rateLimiter, RATE_LIMITS, generateBrowserFingerprint } from '../../utils/security';
import type { User } from '../../types';

const SUPERADMIN_EMAIL = (import.meta.env.VITE_SUPERADMIN_EMAIL || 'superadmin@ecosystem.app').toLowerCase();
const DEMO_OWNER_EMAIL = 'owner@example.com';
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuthStore();
  const { user: ownerUser, team } = useAppStore();

  const fingerprint = useMemo(() => generateBrowserFingerprint(), []);
  const rateLimitKey = useMemo(() => `login-${fingerprint}`, [fingerprint]);

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (searchParams.get('expired') === '1') {
      setInfo('Ваша сессия истекла. Пожалуйста, войдите снова.');
    }
  }, [searchParams]);

  const superAdminDemoUser: User = useMemo(
    () => ({
      id: 'platform-owner',
      name: 'Platform Owner',
      email: SUPERADMIN_EMAIL,
      role: 'superadmin',
      onboardingCompleted: true,
    }),
    []
  );

  const adminDemoUser = useMemo(
    () => team.find((member) => member.id === 'user-admin-1') ?? null,
    [team]
  );

  const managerDemoUser = useMemo(
    () => team.find((member) => member.id === 'user-manager-1') ?? null,
    [team]
  );

  const performLogin = (user: User, redirect?: string) => {
    login({ ...user });
    rateLimiter.reset(rateLimitKey);
    const destination = redirect ?? (user.role === 'superadmin' ? '/superadmin' : '/');
    navigate(destination, { replace: true });
  };

  const handleDemoQuickLogin = (user: User | null) => {
    if (!DEMO_MODE) {
      setError('Демо-режим отключен. Обратитесь к администратору.');
      return;
    }

    if (!rateLimiter.isAllowed(rateLimitKey, RATE_LIMITS.login)) {
      setError('Слишком много попыток входа. Попробуйте через 15 минут.');
      return;
    }

    if (!user) {
      setError('Demo аккаунт не найден.');
      return;
    }

    setError('');
    setInfo('');
    setFormData({ email: user.email, password: 'demo' });
    setIsSubmitting(true);
    performLogin(user);
    setIsSubmitting(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!rateLimiter.isAllowed(rateLimitKey, RATE_LIMITS.login)) {
      setError('Слишком много попыток входа. Попробуйте через 15 минут.');
      return;
    }

    setError('');
    setInfo('');

    const trimmedEmail = formData.email.trim();
    const trimmedPassword = formData.password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError('Введите email и пароль');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError('Введите корректный email адрес');
      return;
    }

    const sanitizedEmail = sanitizeString(trimmedEmail.toLowerCase());
    const isDemoSuperAdmin = DEMO_MODE && sanitizedEmail === SUPERADMIN_EMAIL;
    const isDemoOwner = DEMO_MODE && sanitizedEmail === DEMO_OWNER_EMAIL;

    if (trimmedPassword.length < 8 && !isDemoSuperAdmin && !isDemoOwner) {
      setError('Неверный email или пароль');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isDemoSuperAdmin) {
        performLogin(superAdminDemoUser, '/superadmin');
        return;
      }

      if (isDemoOwner && ownerUser) {
        performLogin(ownerUser);
        return;
      }

      if (DEMO_MODE) {
        const teamDemoUser = team.find(
          (member) => sanitizeString(member.email.toLowerCase()) === sanitizedEmail
        );
        if (teamDemoUser) {
          performLogin(teamDemoUser);
          return;
        }
      }

      setError('Неверный email или пароль');
    } catch (err) {
      console.error('Login error:', err);
      setError('Произошла ошибка при входе. Попробуйте снова.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900">Добро пожаловать</h1>
            <p className="mt-2 text-gray-600">Авторизуйтесь, чтобы продолжить работу</p>
          </div>

          {info && (
            <div className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700" role="status">
              {info}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              autoComplete="email"
              required
            />

            <Input
              label="Пароль"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              autoComplete="current-password"
              required
            />

            {(error || info) && (
              <div className="space-y-2">
                {error && (
                  <p className="text-sm text-red-600" role="alert">
                    {error}
                  </p>
                )}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Вход...' : 'Войти'}
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
            <Link to="/signup" className="text-primary-600 hover:underline">
              Создать аккаунт
            </Link>
            <Link to="/recover" className="text-primary-600 hover:underline">
              Забыли пароль?
            </Link>
          </div>

          {DEMO_MODE && (
            <div className="mt-8 border-t border-gray-200 pt-6">
              <p className="mb-3 text-center text-sm font-medium text-gray-700">
                Попробуйте демо-версию
              </p>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="w-full"
                  onClick={() => handleDemoQuickLogin(ownerUser)}
                >
                  Войти как Владелец
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="w-full"
                  onClick={() => handleDemoQuickLogin(adminDemoUser)}
                >
                  Войти как Администратор
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="w-full"
                  onClick={() => handleDemoQuickLogin(managerDemoUser)}
                >
                  Войти как Менеджер
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="w-full"
                  onClick={() => handleDemoQuickLogin(superAdminDemoUser)}
                >
                  Войти как Суперадмин
                </Button>
              </div>
              <p className="mt-3 text-center text-xs text-gray-500">
                Демо-аккаунты: заполните форму или используйте кнопки. В демо-режиме подойдет любой пароль.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
