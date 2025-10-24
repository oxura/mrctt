# Техническая документация

## 🏗️ Архитектура приложения

### Frontend Stack

```
React 18.3.1 (functional components + hooks)
├── TypeScript 5.6.3 (strict mode)
├── Vite 5.4.8 (bundler + HMR)
├── React Router 6.28.0 (client-side routing)
├── Zustand 4.5.4 (state management)
│   └── Immer 10.1.1 (immutable updates)
├── Tailwind CSS 3.4.15 (utility-first styling)
├── Heroicons 2.1.3 (SVG icons)
├── HeadlessUI 1.7.18 (accessible components)
└── React Query 5.64.1 (готов к API интеграции)
```

---

## 📁 Структура файлов

### Модули и компоненты

```
src/
├── App.tsx                    # Главный компонент с роутингом
├── main.tsx                   # Entry point
├── index.css                  # Global styles + Tailwind imports
├── types.ts                   # Все TypeScript типы (148 строк)
│
├── components/
│   ├── common/
│   │   ├── Button.tsx         # Переиспользуемая кнопка (4 варианта)
│   │   ├── Input.tsx          # Input с label и error states
│   │   ├── Select.tsx         # Dropdown select
│   │   ├── Modal.tsx          # Универсальная модалка
│   │   ├── Badge.tsx          # Значки статусов
│   │   └── EmptyState.tsx     # Пустые состояния
│   │
│   └── layout/
│       └── MainLayout.tsx     # Layout с sidebar + topbar (290 строк)
│
├── pages/
│   ├── auth/
│   │   ├── SignUp.tsx         # Регистрация
│   │   └── Login.tsx          # Вход в систему
│   │
│   ├── onboarding/
│   │   └── OnboardingWizard.tsx   # 3-шаговый мастер настройки
│   │
│   ├── dashboard/
│   │   └── Dashboard.tsx      # Главная с KPI и графиками
│   │
│   ├── leads/
│   │   ├── Leads.tsx          # Список лидов (таблица + канбан)
│   │   ├── LeadKanban.tsx     # Канбан доска
│   │   └── LeadDetail.tsx     # Детальная карточка лида
│   │
│   ├── products/
│   │   └── Products.tsx       # Каталог продуктов + группы
│   │
│   ├── calendar/
│   │   └── Calendar.tsx       # Календарь и задачи
│   │
│   ├── team/
│   │   └── Team.tsx           # Управление командой
│   │
│   ├── forms/
│   │   ├── FormBuilder.tsx    # Конструктор анкет
│   │   └── PublicForm.tsx     # Публичная страница формы
│   │
│   ├── settings/
│   │   └── Settings.tsx       # Настройки (3 вкладки)
│   │
│   ├── billing/
│   │   └── Billing.tsx        # Биллинг и тарифы
│   │
│   └── superadmin/
│       └── SuperAdminDashboard.tsx  # SaaS панель
│
├── store/
│   ├── authStore.ts           # Аутентификация (Zustand + persist)
│   └── appStore.ts            # Главный store (Zustand + Immer, 306 строк)
│
├── data/
│   └── mockData.ts            # Демо-данные (257 строк)
│
└── utils/
    └── nanoid.ts              # Генератор ID
```

---

## 🔄 State Management

### Zustand Stores

#### AuthStore (authStore.ts)
```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user, token) => void;
  logout: () => void;
  updateUser: (updates) => void;
}
```

**Особенности:**
- Персистентность в localStorage
- Автоматическая сериализация/десериализация
- Используется для защиты роутов

#### AppStore (appStore.ts)
```typescript
interface AppState {
  company: Company | null;
  user: User | null;
  team: User[];
  products: Product[];
  groups: GroupFlow[];
  leads: Lead[];
  activities: ActivityItem[];
  tasks: Task[];
  forms: LeadForm[];
  billing: {...};
  // + 20+ actions
}
```

**Особенности:**
- Immer для иммутабельных обновлений
- Централизованное управление всеми данными
- Готов к замене на API calls

---

## 🎨 Styling Architecture

### Tailwind CSS

**Конфигурация** (`tailwind.config.js`):
```javascript
{
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { ... },  // Синяя палитра (#2563eb)
      }
    }
  }
}
```

**Naming Convention:**
- Используем utility classes напрямую
- Нет custom CSS классов (кроме animations)
- Mobile-first responsive design

**Breakpoints:**
- `sm:` 640px
- `md:` 768px
- `lg:` 1024px
- `xl:` 1280px

---

## 🔐 Authentication Flow

### Процесс аутентификации

```
1. User → SignUp/Login
2. Credentials validation
3. Create User object + Token
4. authStore.login(user, token)
5. localStorage persistence
6. Navigate to /onboarding or /
```

### Защита роутов

```tsx
<PrivateRoute allowedRoles={['owner', 'admin']}>
  <Products />
</PrivateRoute>
```

**Логика:**
1. Проверка `isAuthenticated`
2. Проверка `onboardingCompleted` (кроме superadmin)
3. Проверка `allowedRoles`
4. Redirect на `/login` или `/`

---

## 🔌 API Integration (Готово к подключению)

### Текущее состояние
Все данные берутся из `mockData.ts`. Для интеграции с реальным API:

### Шаг 1: Создать API клиент
```typescript
// src/api/client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для токена
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Шаг 2: Заменить mock-данные
```typescript
// Было:
addLead: (lead) => set((state) => { state.leads.push(lead) })

// Станет:
addLead: async (lead) => {
  const response = await apiClient.post('/leads', lead);
  set((state) => { state.leads.push(response.data) });
}
```

### Endpoints (примеры)
```
POST   /api/auth/signup
POST   /api/auth/login
GET    /api/leads
POST   /api/leads
PUT    /api/leads/:id
GET    /api/products
POST   /api/products
GET    /api/companies/:id
PUT    /api/companies/:id
```

---

## 🎯 TypeScript Types

### Основные интерфейсы

```typescript
// User & Auth
type Role = 'owner' | 'admin' | 'manager' | 'superadmin';

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  onboardingCompleted: boolean;
  companyId?: string;
}

// Lead Management
interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  statusId: string;
  ownerId?: string;
  productId?: string;
  groupId?: string;
  history: LeadInteraction[];
  ...
}

// Multi-tenant
interface Company {
  id: string;
  name: string;
  niche: string;
  modules: ModuleToggle[];
  leadStatuses: LeadStatus[];
  ...
}
```

---

## 🚀 Performance Optimizations

### Реализовано

1. **React.memo для тяжелых компонентов**
   - LeadKanban
   - Dashboard charts

2. **useMemo для вычислений**
   - Фильтрация лидов
   - Группировка по статусам в Канбане

3. **Code Splitting**
   - React Router автоматически делает lazy loading

4. **Zustand = минимальные ре-рендеры**
   - Подписка только на нужные части store

### Будущие оптимизации

- React Query для кеширования API
- Virtual scrolling для больших таблиц
- Web Workers для тяжелых вычислений
- Service Worker для offline mode

---

## 📦 Build Configuration

### Vite Config

```typescript
{
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  server: {
    port: 3000,
    proxy: { '/api': 'http://localhost:5000' }
  }
}
```

### Production Build

```bash
npm run build
# Создает:
# - dist/index.html (0.48 kB)
# - dist/assets/index-*.css (~23 kB)
# - dist/assets/index-*.js (~316 kB → 93 kB gzip)
```

**Оптимизации:**
- Tree-shaking неиспользуемого кода
- Минификация CSS/JS
- Gzip сжатие
- Code splitting по роутам

---

## 🧪 Testing Strategy (Рекомендации)

### Unit Tests (Jest + RTL)
```typescript
// Button.test.tsx
test('renders button with correct variant', () => {
  render(<Button variant="primary">Click me</Button>);
  expect(screen.getByRole('button')).toHaveClass('bg-primary-600');
});
```

### Integration Tests
```typescript
// Leads.test.tsx
test('adds new lead successfully', async () => {
  render(<Leads />);
  fireEvent.click(screen.getByText('Добавить лид'));
  // Fill form...
  fireEvent.click(screen.getByText('Создать лид'));
  await waitFor(() => {
    expect(screen.getByText('Новый лид')).toBeInTheDocument();
  });
});
```

### E2E Tests (Cypress)
```typescript
// leads.cy.ts
describe('Lead Management', () => {
  it('should create and manage lead', () => {
    cy.login('owner@example.com');
    cy.visit('/leads');
    cy.get('[data-testid="add-lead"]').click();
    // ...
  });
});
```

---

## 🔒 Security Considerations

### Реализовано

- [x] Role-Based Access Control (RBAC)
- [x] Protected routes с redirect
- [x] Input validation на формах
- [x] XSS protection (React автоматически)

### TODO для Production

- [ ] CSRF tokens для API
- [ ] Rate limiting на backend
- [ ] Helmet.js для HTTP headers
- [ ] Content Security Policy
- [ ] Sanitization пользовательского ввода
- [ ] HTTPS only в production

---

## 📊 Monitoring & Analytics (Рекомендации)

### Error Tracking
```typescript
// Sentry integration
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "...",
  integrations: [new Sentry.BrowserTracing()],
});
```

### Analytics
```typescript
// Google Analytics / Mixpanel
gtag('event', 'lead_created', {
  category: 'crm',
  label: lead.source,
});
```

---

## 🌐 Internationalization (i18n)

### Подготовка к мультиязычности

```typescript
// i18n/ru.json
{
  "auth.login": "Войти",
  "auth.signup": "Регистрация",
  "leads.add": "Добавить лид",
  ...
}

// React i18next
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
<Button>{t('leads.add')}</Button>
```

---

## 🐳 Deployment

### Vercel (Рекомендуется)
```bash
vercel --prod
```

### Docker
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Environment Variables
```env
VITE_API_URL=https://api.example.com
VITE_ENV=production
VITE_SENTRY_DSN=...
```

---

## 📈 Scalability Plan

### Phase 1: MVP (Текущее состояние)
- Frontend only
- Mock data
- Single-page app

### Phase 2: Backend Integration
- Node.js + Express
- PostgreSQL (multi-tenant)
- JWT authentication
- REST API

### Phase 3: Real-time Features
- WebSocket для live updates
- Push notifications
- Collaborative editing

### Phase 4: Microservices
- Auth service
- CRM service
- Billing service
- Analytics service
- API Gateway

---

## 🔧 Development Workflow

### Git Workflow
```bash
# Feature branch
git checkout -b feature/lead-kanban-dnd

# Commits
git commit -m "feat: add drag-and-drop to kanban"

# Pull request
# Review → Merge to main
```

### Code Review Checklist
- [ ] TypeScript ошибок нет
- [ ] Компоненты реиспользуемые
- [ ] Нет хардкода
- [ ] Адаптивная верстка
- [ ] Доступность (a11y)
- [ ] Performance оптимизировано

---

## 📚 Дополнительные ресурсы

- [Vite Documentation](https://vitejs.dev)
- [Zustand Best Practices](https://github.com/pmndrs/zustand)
- [Tailwind Components](https://tailwindui.com)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app)

---

**Версия документа:** 1.0  
**Дата:** 2025  
**Автор:** Development Team
