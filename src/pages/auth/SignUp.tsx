import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { generateSecureId } from '../../utils/crypto';
import { isValidEmail, validatePassword, sanitizeString } from '../../utils/validation';
import { rateLimiter, RATE_LIMITS, generateBrowserFingerprint } from '../../utils/security';

export default function SignUp() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    agreed: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    // Rate limiting check
    const fingerprint = generateBrowserFingerprint();
    const rateLimitKey = `signup-${fingerprint}`;
    
    if (!rateLimiter.isAllowed(rateLimitKey, RATE_LIMITS.signup)) {
      setErrors({ submit: 'Слишком много попыток регистрации. Попробуйте через час.' });
      return;
    }
    
    setErrors({});

    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Имя обязательно';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Имя должно содержать минимум 2 символа';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Имя не должно превышать 100 символов';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email обязателен';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Введите корректный email адрес';
    }
    
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.errors[0];
    }
    
    if (!formData.agreed) {
      newErrors.agreed = 'Необходимо согласие с условиями оферты';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const newUser = {
        id: generateSecureId(),
        name: sanitizeString(formData.name.trim()),
        email: sanitizeString(formData.email.trim().toLowerCase()),
        role: 'owner' as const,
        onboardingCompleted: false,
      };

      login(newUser);
      rateLimiter.reset(rateLimitKey);
      navigate('/onboarding');
    } catch (error) {
      console.error('Sign up error:', error);
      setErrors({ submit: 'Произошла ошибка при регистрации. Попробуйте снова.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900">Экосистема заявок</h1>
            <p className="mt-2 text-gray-600">Создайте аккаунт за 30 секунд</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Имя"
              type="text"
              placeholder="Алексей Иванов"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              autoComplete="name"
              error={errors.name}
              required
            />

            <Input
              label="Email"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              autoComplete="email"
              error={errors.email}
              required
            />

            <Input
              label="Пароль"
              type="password"
              placeholder="Минимум 8 символов, заглавные, строчные, цифры и символы"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              autoComplete="new-password"
              error={errors.password}
              required
            />

            <div className="flex items-start">
              <input
                type="checkbox"
                id="agreed"
                checked={formData.agreed}
                onChange={(e) => setFormData({ ...formData, agreed: e.target.checked })}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="agreed" className="ml-2 text-sm text-gray-600">
                Я согласен с{' '}
                <a href="#" className="text-primary-600 hover:underline">
                  условиями оферты
                </a>
              </label>
            </div>
            {errors.agreed && <p className="text-sm text-red-600">{errors.agreed}</p>}
            {errors.submit && (
              <p className="text-sm text-red-600" role="alert">
                {errors.submit}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Регистрация...' : 'Создать аккаунт'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
