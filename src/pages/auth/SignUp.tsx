import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { nanoid } from '../../utils/nanoid';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Имя обязательно';
    if (!formData.email.trim()) newErrors.email = 'Email обязателен';
    if (!formData.email.includes('@')) newErrors.email = 'Неверный формат email';
    if (formData.password.length < 8) newErrors.password = 'Пароль должен быть минимум 8 символов';
    if (!formData.agreed) newErrors.agreed = 'Необходимо согласие с офертой';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newUser = {
      id: nanoid(),
      name: formData.name,
      email: formData.email,
      role: 'owner' as const,
      onboardingCompleted: false,
    };

    const token = nanoid(32);
    login(newUser, token);
    navigate('/onboarding');
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
              error={errors.name}
              required
            />

            <Input
              label="Email"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={errors.email}
              required
            />

            <Input
              label="Пароль"
              type="password"
              placeholder="Минимум 8 символов"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

            <Button type="submit" size="lg" className="w-full">
              Создать аккаунт
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
