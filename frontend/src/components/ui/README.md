# UI Components Library

Полная библиотека переиспользуемых UI-компонентов для CRM-системы "Экосистема заявок".

## Содержание
- [Дизайн-система](#дизайн-система)
- [Компоненты](#компоненты)
- [Использование](#использование)
- [Примеры](#примеры)

## Дизайн-система

Все компоненты следуют единой дизайн-системе с CSS-переменными:

- **Цвета**: Primary (синий), Success (зеленый), Error (красный), Warning (оранжевый), Gray (оттенки серого)
- **Типографика**: Font sizes от xs (12px) до 4xl (36px)
- **Отступы**: Space scale от 1 (4px) до 20 (80px)
- **Тени**: Shadow scale от xs до 2xl
- **Радиусы**: Border radius от sm (4px) до 2xl (16px)

## Компоненты

### Button
Универсальная кнопка с различными вариантами и размерами.

**Варианты**: `primary`, `secondary`, `outline`, `ghost`, `danger`  
**Размеры**: `sm`, `md`, `lg`

**Пропсы**:
- `variant?: ButtonVariant` - Вариант оформления
- `size?: ButtonSize` - Размер
- `fullWidth?: boolean` - На всю ширину
- `loading?: boolean` - Состояние загрузки
- `leftIcon?: ReactNode` - Иконка слева
- `rightIcon?: ReactNode` - Иконка справа

**Пример**:
```tsx
import { Button } from '@/components/ui';

<Button variant="primary" size="md" leftIcon="➕">
  Создать
</Button>
```

### Input
Текстовое поле ввода с поддержкой валидации и иконок.

**Пропсы**:
- `label?: string` - Метка поля
- `error?: string` - Текст ошибки
- `helperText?: string` - Вспомогательный текст
- `leftIcon?: ReactNode` - Иконка слева
- `rightIcon?: ReactNode` - Иконка справа
- `fullWidth?: boolean` - На всю ширину

**Пример**:
```tsx
import { Input } from '@/components/ui';

<Input
  label="Email"
  placeholder="example@domain.com"
  type="email"
  leftIcon="📧"
  error={errors.email}
/>
```

### Select
Выпадающий список.

**Пропсы**:
- `label?: string` - Метка поля
- `options: SelectOption[]` - Список опций
- `error?: string` - Текст ошибки
- `helperText?: string` - Вспомогательный текст
- `fullWidth?: boolean` - На всю ширину

**Пример**:
```tsx
import { Select } from '@/components/ui';

<Select
  label="Статус"
  options={[
    { value: 'active', label: 'Активный' },
    { value: 'inactive', label: 'Неактивный' },
  ]}
  value={status}
  onChange={(e) => setStatus(e.target.value)}
/>
```

### Checkbox
Чекбокс с поддержкой indeterminate состояния.

**Пропсы**:
- `label?: string` - Текст метки
- `error?: string` - Текст ошибки
- `helperText?: string` - Вспомогательный текст
- `indeterminate?: boolean` - Неопределенное состояние (для "выбрать все")

**Пример**:
```tsx
import { Checkbox } from '@/components/ui';

<Checkbox
  label="Согласен с условиями"
  checked={agreed}
  onChange={(e) => setAgreed(e.target.checked)}
/>
```

### Textarea
Многострочное текстовое поле.

**Пропсы**:
- `label?: string` - Метка поля
- `error?: string` - Текст ошибки
- `helperText?: string` - Вспомогательный текст
- `fullWidth?: boolean` - На всю ширину

**Пример**:
```tsx
import { Textarea } from '@/components/ui';

<Textarea
  label="Комментарий"
  placeholder="Введите комментарий..."
  rows={5}
/>
```

### Card
Карточка для группировки контента.

**Варианты**: `default`, `bordered`, `elevated`  
**Размеры padding**: `none`, `sm`, `md`, `lg`

**Пропсы**:
- `variant?: 'default' | 'bordered' | 'elevated'`
- `padding?: 'none' | 'sm' | 'md' | 'lg'`
- `hoverable?: boolean` - Эффект при наведении

**Подкомпоненты**: `CardHeader`, `CardBody`, `CardFooter`

**Пример**:
```tsx
import { Card, CardHeader, CardBody, CardFooter, Button } from '@/components/ui';

<Card variant="default" padding="md">
  <CardHeader>
    <h3>Заголовок карточки</h3>
  </CardHeader>
  <CardBody>
    <p>Содержимое карточки</p>
  </CardBody>
  <CardFooter>
    <Button>Действие</Button>
  </CardFooter>
</Card>
```

### Modal
Модальное окно с backdrop и управлением фокусом.

**Пропсы**:
- `isOpen: boolean` - Открыто ли окно
- `onClose: () => void` - Callback закрытия
- `title?: string` - Заголовок
- `size?: 'sm' | 'md' | 'lg' | 'xl'` - Размер
- `closeOnOverlayClick?: boolean` - Закрывать по клику на backdrop (по умолчанию true)
- `closeOnEsc?: boolean` - Закрывать по Escape (по умолчанию true)

**Подкомпоненты**: `ModalHeader`, `ModalBody`, `ModalFooter`

**Пример**:
```tsx
import { Modal, ModalBody, ModalFooter, Button } from '@/components/ui';

const [isOpen, setIsOpen] = useState(false);

<Modal 
  isOpen={isOpen} 
  onClose={() => setIsOpen(false)} 
  title="Подтверждение"
>
  <ModalBody>
    <p>Вы уверены, что хотите продолжить?</p>
  </ModalBody>
  <ModalFooter>
    <Button variant="outline" onClick={() => setIsOpen(false)}>
      Отмена
    </Button>
    <Button onClick={handleConfirm}>
      Подтвердить
    </Button>
  </ModalFooter>
</Modal>
```

### Dropdown
Выпадающее меню с действиями.

**Пропсы**:
- `trigger: ReactNode` - Элемент-триггер
- `items: DropdownItem[]` - Список элементов меню
- `placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'` - Позиция
- `closeOnSelect?: boolean` - Закрывать при выборе (по умолчанию true)

**Пример**:
```tsx
import { Dropdown, Button } from '@/components/ui';

<Dropdown
  trigger={<Button variant="outline">Действия ▼</Button>}
  items={[
    { 
      label: 'Редактировать', 
      value: 'edit', 
      icon: '✏️', 
      onClick: () => handleEdit() 
    },
    { 
      label: 'Удалить', 
      value: 'delete', 
      icon: '🗑️', 
      onClick: () => handleDelete() 
    },
  ]}
/>
```

### Toast
Система уведомлений (Toast notifications).

**Использование через хук useToast**:
- `success(message, duration?)` - Успешное уведомление
- `error(message, duration?)` - Уведомление об ошибке
- `warning(message, duration?)` - Предупреждение
- `info(message, duration?)` - Информационное уведомление

**Пример**:
```tsx
import { useToast } from '@/components/ui';

const toast = useToast();

// В обработчике события
toast.success('Данные успешно сохранены!');
toast.error('Произошла ошибка при сохранении');
```

**Важно**: Приложение должно быть обернуто в `ToastProvider` (уже сделано в main.tsx).

### Table
Полнофункциональная таблица с пагинацией, поиском, фильтрами, сортировкой и массовыми действиями.

**Пропсы**:
- `data: T[]` - Данные для отображения
- `columns: Column<T>[]` - Конфигурация колонок
- `keyExtractor: (row: T) => string` - Функция извлечения ключа
- `pageSize?: 25 | 50 | 100` - Размер страницы (по умолчанию 25)
- `showSearch?: boolean` - Показать поиск (по умолчанию true)
- `searchPlaceholder?: string` - Placeholder для поиска
- `filters?: FilterOption[]` - Конфигурация фильтров
- `bulkActions?: BulkAction[]` - Массовые действия
- `onRowClick?: (row: T) => void` - Callback клика по строке
- `emptyMessage?: string` - Сообщение при отсутствии данных

**Пример**:
```tsx
import { Table } from '@/components/ui';
import type { Column, BulkAction, FilterOption } from '@/components/ui';

interface User {
  id: string;
  name: string;
  email: string;
  status: string;
}

const columns: Column<User>[] = [
  { key: 'name', label: 'Имя', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { 
    key: 'status', 
    label: 'Статус', 
    sortable: true,
    render: (value) => <Badge status={value}>{value}</Badge>
  },
];

const bulkActions: BulkAction[] = [
  {
    label: 'Удалить',
    icon: '🗑️',
    onClick: (ids) => handleDelete(ids),
    variant: 'danger',
  },
];

const filters: FilterOption[] = [
  {
    key: 'status',
    label: 'Статус',
    options: [
      { value: 'active', label: 'Активный' },
      { value: 'inactive', label: 'Неактивный' },
    ],
  },
];

<Table
  data={users}
  columns={columns}
  keyExtractor={(row) => row.id}
  pageSize={25}
  showSearch
  filters={filters}
  bulkActions={bulkActions}
  onRowClick={(row) => navigate(`/users/${row.id}`)}
/>
```

## Использование

### Импорт компонентов

```tsx
// Импорт отдельных компонентов
import { Button, Input, Card } from '@/components/ui';

// Импорт типов
import type { ButtonProps, InputProps } from '@/components/ui';
```

### Стилизация

Все компоненты используют CSS Modules и дизайн-систему. Для кастомизации можно:

1. Использовать CSS-переменные из `design-system.css`
2. Передавать className для дополнительных стилей
3. Использовать пропсы компонентов (variant, size и т.д.)

## Демонстрация

Посмотреть все компоненты в действии можно на странице `/components-demo` (требуется авторизация).

## Адаптивность

Все компоненты адаптивны и корректно работают на:
- Desktop (> 960px)
- Tablet (640px - 960px)  
- Mobile (< 640px)

## Доступность (A11y)

Компоненты следуют стандартам доступности:
- Семантичная HTML-разметка
- ARIA-атрибуты
- Поддержка клавиатурной навигации
- Управление фокусом
- Screen reader friendly

## Поддержка TypeScript

Все компоненты полностью типизированы с TypeScript для безопасности типов и автодополнения.
