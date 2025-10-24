import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { user: demoUser } = useAppStore();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError('Введите email и пароль');
      return;
    }

    if (formData.email === 'superadmin@ecosystem.app') {
      login(
        {
          id: 'platform-owner',
          name: 'Platform Owner',
          email: formData.email,
          role: 'superadmin',
          onboardingCompleted: true,
        },
        'superadmin-token'
      );
      navigate('/superadmin');
      return;
    }

    if (demoUser && formData.email === demoUser.email) {
      login(demoUser, 'demo-token');
      if (demoUser.onboardingCompleted) {
        navigate('/');
      } else {
        navigate('/onboarding');
      }
      return;
    }

    setError('Неверный email или пароль');
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
              required
            />

            <Input
              label="Пароль"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" size="lg" className="w-full">
              Войти
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
        </div>
      </div>
    </div>
  );
}
