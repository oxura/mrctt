import { useState } from 'react';
import { Link } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { isValidEmail, sanitizeString } from '../../utils/validation';

export default function RecoverPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Введите email адрес');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Введите корректный email адрес');
      return;
    }

    const sanitizedEmail = sanitizeString(email.trim().toLowerCase());
    console.log('Password recovery requested for:', sanitizedEmail);

    // In MVP, we don't have a backend to handle this
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white p-8 shadow-xl">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Проверьте email</h1>
              <p className="mt-2 text-gray-600">
                Если аккаунт с указанным email существует, мы отправим инструкции по восстановлению пароля.
              </p>
            </div>

            <div className="space-y-4">
              <Link to="/login">
                <Button variant="secondary" className="w-full">
                  Вернуться к входу
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900">Восстановление пароля</h1>
            <p className="mt-2 text-gray-600">
              Введите email, и мы отправим инструкции по восстановлению доступа
            </p>
          </div>

          <div className="mb-6 rounded-lg bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">
              <strong>Обратите внимание:</strong> Функция восстановления пароля будет доступна после MVP-фазы.
              Если у вас возникли проблемы, свяжитесь с поддержкой по адресу{' '}
              <a href="mailto:support@ecosystem.app" className="font-semibold underline">
                support@ecosystem.app
              </a>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full">
              Отправить инструкции
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-primary-600 hover:underline">
              Вернуться к входу
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
