# Установка и запуск проекта

## 🚀 Быстрый старт

### Требования

- Node.js 18+ (рекомендуется v20.x)
- npm 9+ или yarn 1.22+

### Установка

```bash
# 1. Клонируйте репозиторий (если используется Git)
git clone <repository-url>
cd saas-crm-ecosystem

# 2. Установите зависимости
npm install

# 3. Запустите dev-сервер
npm run dev
```

Приложение будет доступно по адресу: http://localhost:3000

### Production Build

```bash
# Соберите production версию
npm run build

# Запустите preview
npm run preview
```

---

## 📋 Доступные команды

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск development сервера с HMR |
| `npm run build` | Production сборка (TypeScript + Vite) |
| `npm run preview` | Предпросмотр production сборки |

---

## 🔑 Демо-данные

Проект использует mock-данные для демонстрации. При запуске доступны следующие аккаунты:

### Для входа в систему:

**Владелец компании:**
- Email: `owner@example.com`
- Пароль: любой (например: `password`)
- Доступ: полный доступ ко всем функциям + биллинг

**Суперадмин платформы:**
- Email: `superadmin@ecosystem.app`
- Пароль: любой (например: `admin`)
- Доступ: панель управления всеми компаниями

### Демо-данные включают:

- ✅ 6 лидов в различных статусах
- ✅ 2 продукта (курс и услуга)
- ✅ 2 группы/потока для образовательных программ
- ✅ 3 пользователя в команде (Owner, Admin, Manager)
- ✅ 2 задачи (одна просроченная)
- ✅ 1 готовую анкету для сбора лидов
- ✅ Историю платежей

---

## 🎨 Технологии

### Frontend
- **React 18** - UI библиотека
- **TypeScript** - типизация
- **Vite** - сборщик и dev-сервер
- **Tailwind CSS** - стилизация
- **Zustand** - state management
- **React Router 6** - маршрутизация
- **Heroicons** - иконки
- **HeadlessUI** - компоненты без стилей

### Структура
```
src/
├── components/       # Переиспользуемые компоненты
│   ├── common/      # Button, Input, Select, Modal, Badge
│   └── layout/      # MainLayout с сайдбаром
├── pages/           # Страницы приложения
│   ├── auth/        # Регистрация, вход
│   ├── onboarding/  # Мастер настройки
│   ├── dashboard/   # Главная с KPI
│   ├── leads/       # CRM воронка
│   ├── products/    # Каталог продуктов
│   ├── calendar/    # Задачи
│   ├── team/        # Команда
│   ├── forms/       # Конструктор анкет
│   ├── settings/    # Настройки
│   ├── billing/     # Биллинг
│   └── superadmin/  # SaaS панель
├── store/           # Zustand stores
├── data/            # Mock-данные
├── types.ts         # TypeScript типы
└── utils/           # Вспомогательные функции
```

---

## 🔧 Настройка

### Конфигурация Vite

Файл `vite.config.ts` содержит:
- Настройку React plugin
- Алиасы путей (`@/` → `src/`)
- Proxy для API (порт 5000)
- Dev-сервер на порту 3000

### TypeScript

Файл `tsconfig.json`:
- Strict mode включен
- Настроены алиасы
- Target: ESNext

### Tailwind CSS

Файл `tailwind.config.js`:
- Кастомная палитра primary (синие оттенки)
- Responsive breakpoints
- JIT компиляция

---

## 🌐 Окружение

Создайте файл `.env` в корне проекта (опционально):

```env
# Backend API URL (если будет реальный backend)
VITE_API_URL=http://localhost:5000

# Environment
VITE_ENV=development
```

---

## 🐛 Устранение проблем

### Проблема: "Cannot find module"
```bash
# Удалите node_modules и пересоберите
rm -rf node_modules package-lock.json
npm install
```

### Проблема: Порт 3000 занят
```bash
# Измените порт в vite.config.ts
server: {
  port: 3001,  // Новый порт
}
```

### Проблема: TypeScript ошибки
```bash
# Очистите кеш TypeScript
rm -rf node_modules/.cache
npm run build
```

---

## 📦 Deployment

### Vercel

```bash
# Установите Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Netlify

```bash
# Build command
npm run build

# Publish directory
dist

# Добавьте файл netlify.toml:
[build]
  command = "npm run build"
  publish = "dist"
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

---

## 🎯 Следующие шаги

1. **Backend интеграция**
   - Замените mock-данные на API calls
   - Добавьте Axios interceptors для auth
   - Реализуйте WebSocket для real-time

2. **База данных**
   - PostgreSQL для multi-tenant
   - Redis для кеширования
   - S3 для файлов (лого, документы)

3. **Аутентификация**
   - JWT токены
   - Refresh tokens
   - OAuth2 (Google, GitHub)

4. **Тестирование**
   - Jest для unit тестов
   - React Testing Library
   - Cypress для E2E

---

## 📚 Дополнительные ресурсы

- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Zustand](https://github.com/pmndrs/zustand)
- [React Router](https://reactrouter.com)

---

## 🤝 Поддержка

Если возникли вопросы:
1. Проверьте [DEMO.md](./DEMO.md) для примеров использования
2. Изучите [README.md](./README.md) для overview
3. Посмотрите код в `src/pages/` для примеров

---

**Успешного запуска! 🚀**
