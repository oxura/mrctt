# Статус реализации проекта CRM SaaS

Этот документ показывает текущий статус реализации всех функций согласно PRD.

## ✅ Полностью реализовано (MVP Phase 1)

### Инфраструктура и архитектура
- [x] Многотенантная архитектура БД (tenant_id изоляция)
- [x] JWT-based аутентификация
- [x] Middleware для tenant resolution (header + subdomain)
- [x] RBAC система (роли + permissions)
- [x] Система миграций БД
- [x] Обработка ошибок и логирование (Winston)
- [x] Rate limiting (100 req/min)
- [x] Security headers (Helmet.js)
- [x] CORS настройка
- [x] Validation с Zod

### Аутентификация и пользователи
- [x] Страница регистрации с валидацией
  - Email формат
  - Пароль минимум 8 символов
  - Имя обязательно
  - Company slug с автогенерацией
  - Чекбокс оферты
- [x] Страница входа
- [x] "Забыли пароль" (email с токеном)
- [x] Сброс пароля по токену
- [x] Автоназначение роли Owner первому пользователю
- [x] GET /api/v1/auth/me

### Onboarding Wizard
- [x] Шаг 1: О компании (название, лого, страна/город)
- [x] Шаг 2: Выбор ниши (5 вариантов с иконками)
- [x] Шаг 3: Настройка модулей (toggle-переключатели)
- [x] Логика пресетов (автовключение модулей по нише)
- [x] Сохранение в tenant.settings
- [x] Редирект на /dashboard

### Layout и UI компоненты
- [x] Левый сайдбар
  - Логотип компании сверху
  - Навигационное меню (7 разделов)
  - Сворачивание в иконки
  - Фильтрация модулей по tenant.settings
  - Footer с настройками/профилем/выходом
- [x] Topbar
  - Breadcrumbs (хлебные крошки)
  - Глобальный поиск (desktop)
  - Уведомления (колокольчик + badge)
  - Аватар пользователя + dropdown меню
  - Мобильный поиск (modal для mobile)
- [x] Адаптивность Desktop/Tablet/Mobile
  - Desktop: полный функционал
  - Tablet: sidebar скрывается
  - Mobile: упрощенный UI, мобильное меню

### Dashboard
- [x] 4 KPI карточки (новые лиды, в работе, продажи, просроченные задачи)
- [x] Placeholder для графика поступления лидов
- [x] Лента активности (activity feed)
- [x] Блок "Мои задачи на сегодня"
- [x] Статус модулей

### RBAC (Роли и права доступа)
- [x] 4 роли в БД: owner, admin, manager, platform_owner
- [x] Таблица permissions (resource:action:scope)
- [x] Таблица role_permissions (many-to-many)
- [x] Middleware requirePermission()
- [x] Middleware requireAnyPermission()
- [x] Middleware requireAllPermissions()
- [x] Helper для проверки ownership
- [x] Owner: полный доступ
- [x] Admin: все кроме биллинга и удаления компании
- [x] Manager: только свои лиды/задачи, read-only остальное
- [x] Platform Owner: cross-tenant доступ

### API Endpoints
#### Auth
- [x] POST /api/v1/auth/register
- [x] POST /api/v1/auth/login
- [x] POST /api/v1/auth/password/forgot
- [x] POST /api/v1/auth/password/reset
- [x] GET /api/v1/auth/me

#### Tenants
- [x] GET /api/v1/tenants/current (с tenantGuard)
- [x] PATCH /api/v1/tenants/current/onboarding
- [x] GET /api/v1/tenants (platform owner only)

#### Users
- [x] GET /api/v1/users (list team members)
- [x] GET /api/v1/users/:id (view user)

#### Audit
- [x] GET /api/v1/audit (audit logs, RBAC защита)

### База данных (PostgreSQL)
Миграции:
- [x] 00001_initial_schema.sql - таблицы tenants, users, products, groups, leads, tasks, forms
- [x] 00002_password_reset.sql - токены сброса пароля
- [x] 00003_rbac_permissions.sql - роли и permissions
- [x] 00004_update_manager_task_permissions.sql
- [x] 00005_audit_logs.sql - логи действий пользователей

### Email (опционально)
- [x] Отправка welcome email после регистрации
- [x] Email с токеном сброса пароля
- [x] Fallback на console.log если SMTP не настроен

## 🚧 В разработке / Placeholder

### CRM Pipeline (Лиды)
- [ ] Таблица лидов (List View)
  - [ ] Фильтры (дата, менеджер, продукт, статус)
  - [ ] Сортировка по колонкам
  - [ ] Пагинация (25/50/100)
  - [ ] Массовые действия (чекбоксы)
- [ ] Канбан (Board View)
  - [ ] Drag & drop между статусами
  - [ ] Карточки лидов
- [ ] Детальная карточка лида (3 колонки)
  - [ ] Основные данные
  - [ ] История взаимодействий (комментарии, звонки)
  - [ ] Смена статуса
  - [ ] Назначение менеджера
  - [ ] Привязка к продукту/группе
- [ ] API endpoints для лидов

### Продукты/Услуги
- [ ] Таблица продуктов
- [ ] Создание/редактирование продукта
- [ ] Архивирование
- [ ] API endpoints

### Группы/Потоки (для курсов, туризма)
- [ ] Создание группы (название, дата старта, лимит мест)
- [ ] Прогресс-бар занятости мест
- [ ] Автостатус "Набор закрыт"
- [ ] Привязка к продуктам

### Задачи и Календарь
- [ ] Календарь (месяц/неделя/день)
- [ ] Создание задачи (название, дедлайн, ответственный, привязка к лиду)
- [ ] Отображение задач на календаре
- [ ] Напоминания

### Конструктор форм
- [ ] Drag & drop конструктор
- [ ] Блоки: текст, телефон, email, dropdown, checkbox, дата
- [ ] Настройки полей (обязательное, label)
- [ ] Привязка формы к продукту
- [ ] Публичная ссылка для размещения
- [ ] Text "Спасибо" после отправки
- [ ] Сохранение submissions
- [ ] Автосоздание лидов из форм

### Команда
- [ ] Список пользователей
- [ ] Инвайт по email
- [ ] Назначение ролей
- [ ] Деактивация пользователя
- [ ] Скрытие модуля для соло-фрилансеров

### Настройки компании
- [ ] Общие (лого, название, валюта)
- [ ] Модули (post-onboarding вкл/выкл)
- [ ] Статусы лидов (кастомные статусы воронки)

### Биллинг
- [ ] Карточка тарифного плана
- [ ] История платежей
- [ ] Смена тарифа
- [ ] Интеграция с платежным шлюзом

### Суперадминка (Platform Owner)
- [ ] Dashboard с MRR/ARR
- [ ] Список всех tenants
- [ ] Impersonate (войти как tenant)
- [ ] Блокировка аккаунта
- [ ] Ручное продление подписки

## ❌ Не входит в MVP Phase 1

- Реальные интеграции WhatsApp/Telegram (только кнопки с `wa.me/` ссылками)
- Сложный конструктор отчетов (хватит базового Dashboard)
- Нативное мобильное приложение (только адаптивная верстка)
- Public API для внешних разработчиков
- Email/SMS рассылки
- Мультиязычность (только русский)
- GraphQL (только REST API)
- WebSockets / Real-time чат
- AI/ML интеграции

## Технические детали

### Frontend
- React 18 + TypeScript
- React Router DOM v6
- Zustand (state management)
- Axios (API client)
- Vite (build tool)
- CSS Modules

### Backend
- Node.js 18+ + TypeScript
- Express.js
- PostgreSQL (Neon DB compatible)
- bcrypt (password hashing)
- jsonwebtoken (JWT)
- Zod (validation)
- Winston (logging)

### Security
- Password: bcrypt с 12 salt rounds
- JWT: HS256, 7 дней expiry
- Rate limiting: 100 req/min
- Helmet.js security headers
- CORS: только FRONTEND_URL
- SQL: parameterized queries (защита от injection)

### Development
- ESLint + Prettier
- Git hooks (pre-commit, pre-push)
- Миграции через npm run migrate
- Hot reload (backend + frontend)

## Следующие шаги (Roadmap)

1. **Реализовать CRM Pipeline (лиды)** - основной функционал системы
2. **Продукты и Группы** - для привязки лидов
3. **Конструктор форм** - для захвата лидов с внешних источников
4. **Задачи и календарь** - для менеджеров
5. **Команда** - инвайт пользователей
6. **Настройки** - доработка tenant settings
7. **Биллинг** - подписки и платежи
8. **Тестирование** - unit + integration tests
9. **Деплой** - production setup (Vercel/Railway + Neon DB)
10. **Документация API** - Swagger/OpenAPI

---

**Последнее обновление:** 26 октября 2024
**Версия:** 1.0.0 (MVP Phase 1 в процессе)
