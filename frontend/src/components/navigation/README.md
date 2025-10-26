# Navigation Components

Основные компоненты навигации для CRM SaaS приложения.

## Компоненты

### Sidebar
Левый боковой сайдбар с навигационным меню.

**Функции:**
- Логотип компании
- Навигационное меню (7 разделов)
- Сворачивание/разворачивание (260px ↔ 80px)
- Нижний блок (Настройки, Профиль, Выход)
- Мобильная версия с overlay

**Props:**
```typescript
interface SidebarProps {
  mobileOpen?: boolean;      // Открыт ли на мобильных
  onMobileClose?: () => void; // Callback для закрытия
}
```

**Использование:**
```tsx
<Sidebar 
  mobileOpen={isMobileMenuOpen} 
  onMobileClose={() => setMobileMenuOpen(false)} 
/>
```

---

### Topbar
Верхняя панель с breadcrumbs, поиском и меню пользователя.

**Функции:**
- Breadcrumbs навигация
- Глобальный поиск (debounce 300ms)
- Уведомления с badge
- Аватар пользователя с dropdown
- Hamburger меню для мобильных

**Props:**
```typescript
interface TopbarProps {
  breadcrumbs?: string[];    // Хлебные крошки
  onMenuClick?: () => void;  // Открытие мобильного меню
}
```

**Использование:**
```tsx
<Topbar 
  breadcrumbs={['Лиды', 'Детали']} 
  onMenuClick={() => setMobileMenuOpen(true)} 
/>
```

---

## Accessibility

Все компоненты полностью доступны:
- ✅ ARIA-метки для всех интерактивных элементов
- ✅ Клавиатурная навигация (Tab, Enter, Escape)
- ✅ Screen reader поддержка
- ✅ Semantic HTML

### Клавиши

| Клавиша | Действие |
|---------|----------|
| `Escape` | Закрыть все dropdown-меню |
| `Enter` | Выбрать результат поиска |
| `Space` | Выбрать результат поиска |
| `Tab` | Навигация по элементам |

---

## Адаптивность

### Desktop (> 960px)
- Полная функциональность
- Sidebar всегда видим
- Breadcrumbs отображаются

### Tablet (641px - 960px)
- Hamburger меню
- Sidebar через overlay
- Breadcrumbs скрыты
- Поиск сжимается

### Mobile (< 640px)
- Только hamburger меню
- Поиск скрыт
- Увеличенные touch-targets
- Dropdown на всю ширину

---

## Стили

Используются CSS Modules для изоляции стилей:
- `Sidebar.module.css`
- `Topbar.module.css`

### CSS переменные

```css
/* Размеры */
--sidebar-width: 260px;
--sidebar-collapsed-width: 80px;
--topbar-height: 70px;
--topbar-height-mobile: 64px;

/* Цвета */
--primary: #3b82f6;
--primary-dark: #2563eb;
--background: #1e293b;
--text: #f1f5f9;
```

---

## Hooks

### useClickOutside
Custom hook для обработки кликов вне элемента.

```typescript
import { useClickOutside } from '../../hooks/useClickOutside';

const ref = useRef<HTMLDivElement>(null);
useClickOutside(ref, () => {
  // Закрыть меню
}, isOpen);
```

---

## Utils

### getBreadcrumbs
Автоматическое построение breadcrumbs из роута.

```typescript
import { getBreadcrumbs } from '../../utils/breadcrumbs';

const crumbs = getBreadcrumbs(location.pathname);
// ['/dashboard'] => []
// ['/leads'] => ['Лиды']
```

---

## Примеры

### Полный Layout
```tsx
import AppLayout from '../../layouts/AppLayout';

function MyPage() {
  return (
    <AppLayout breadcrumbs={['Раздел', 'Подраздел']}>
      {/* Ваш контент */}
    </AppLayout>
  );
}
```

### Автоматические breadcrumbs
```tsx
import AppLayout from '../../layouts/AppLayout';

function MyPage() {
  return (
    <AppLayout>
      {/* Breadcrumbs определятся автоматически из роута */}
    </AppLayout>
  );
}
```

---

## Performance

### Оптимизации
- ✅ Debounce для поиска (300ms)
- ✅ useCallback для мемоизации
- ✅ Cleanup для event listeners
- ✅ CSS transitions вместо JS анимаций

### Bundle размер
- CSS: ~35 KB (6.9 KB gzipped)
- JS: ~267 KB (87.9 KB gzipped)

---

## Будущие улучшения

- [ ] SVG иконки вместо эмодзи
- [ ] Темная тема
- [ ] Кастомизация цветов
- [ ] Анимация для результатов поиска
- [ ] История поисковых запросов
