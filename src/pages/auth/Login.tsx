import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { isValidEmail, sanitizeString } from '../../utils/validation';
import { rateLimiter, RATE_LIMITS, generateBrowserFingerprint } from '../../utils/security';

const SUPERADMIN_EMAIL = (import.meta.env.VITE_SUPERADMIN_EMAIL || 'superadmin@ecosystem.app').toLowerCase();
const DEMO_OWNER_EMAIL = 'owner@example.com';
// Demo mode: allow any password for demo accounts (bypass password validation)
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false'; // enabled by default

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { user: demoUser } = useAppStore();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDemoLogin = (email: string) => {
    const sanitizedEmail = sanitizeString(email.trim().toLowerCase());
    setError('');
    setFormData({ email, password: 'demo12345' });

    if (!DEMO_MODE) {
      setError('Демо-режим отключен. Обратитесь к администратору.');
      return;
    }

    const resetRateLimit = () => {
      rateLimiter.reset(`login-${generateBrowserFingerprint()}`);
    };

    if (sanitizedEmail === SUPERADMIN_EMAIL) {
      login({
        id: 'platform-owner',
        name: 'Platform Owner',
        email: sanitizedEmail,
        role: 'superadmin',
        onboardingCompleted: true,
      });
      resetRateLimit();
      navigate('/superadmin');
      return;
    }

    if (demoUser && sanitizedEmail === demoUser.email.toLowerCase()) {
      login(demoUser);
      resetRateLimit();
      if (demoUser.onboardingCompleted) {
        navigate('/');
      } else {
        navigate('/onboarding');
      }
      return;
    }

    setError('Demo аккаунт не найден.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    // Rate limiting check
    const fingerprint = generateBrowserFingerprint();
    const rateLimitKey = `login-${fingerprint}`;
    
    if (!rateLimiter.isAllowed(rateLimitKey, RATE_LIMITS.login)) {
      setError('Слишком много попыток входа. Попробуйте через 15 минут.');
      return;
    }

    setError('');

    if (!formData.email.trim() || !formData.password) {
      setError('Введите email и пароль');
      return;
    }

    if (!isValidEmail(formData.email)) {
      setError('Введите корректный email адрес');
      return;
    }

    const sanitizedEmail = sanitizeString(formData.email.trim().toLowerCase());
    const isDemoSuperAdmin = DEMO_MODE && sanitizedEmail === SUPERADMIN_EMAIL;
    const isDemoOwner = DEMO_MODE && sanitizedEmail === DEMO_OWNER_EMAIL;
    const isDemoAccount = isDemoSuperAdmin || isDemoOwner;

    if (formData.password.length < 8 && !isDemoAccount) {
      setError('Неверный email или пароль');
      return;
    }

    setIsSubmitting(true);

    try {
      // Demo mode: bypass password validation for demo accounts

      // Super Admin Demo Login
      if (isDemoSuperAdmin) {
        login({
          id: 'platform-owner',
          name: 'Platform Owner',
          email: sanitizedEmail,
          role: 'superadmin',
          onboardingCompleted: true,
        });
        rateLimiter.reset(rateLimitKey);
        navigate('/superadmin');
        return;
      }

      // Owner Demo Login
      if (demoUser && isDemoOwner) {
        login(demoUser);
        rateLimiter.reset(rateLimitKey);
        if (demoUser.onboardingCompleted) {
          navigate('/');
        } else {
          navigate('/onboarding');
        }
        return;
      }

      // If demo mode is disabled or not a demo account, show error
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

            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Вход...' : 'Войти'}
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
            <Link to="/signup" className="text-primary-600 hover:underline">
              Создать аккаунт
            </Link>
            <a href="#" className="text-primary-600 hover:underline">
              Забыли пароль?
            </a>
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
                  onClick={() => handleDemoLogin(DEMO_OWNER_EMAIL)}
                >
                  Войти как Владелец
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="w-full"
                  onClick={() => handleDemoLogin(SUPERADMIN_EMAIL)}
                >
                  Войти как Суперадмин
                </Button>
              </div>
              <p className="mt-3 text-center text-xs text-gray-500">
                Демо-аккаунты: введите любой пароль, например «demo12345»
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
