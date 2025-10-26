import React, { useState } from 'react';
import {
  Button,
  Input,
  Select,
  Checkbox,
  Textarea,
  Card,
  CardHeader,
  CardBody,
  Modal,
  ModalBody,
  ModalFooter,
  Dropdown,
  useToast,
  Table,
  Badge,
  Skeleton,
  Spinner,
  Divider,
} from '../../components/ui';
import type { Column, BulkAction, FilterOption } from '../../components/ui';
import styles from './ComponentsDemo.module.css';

interface SampleData {
  id: string;
  name: string;
  email: string;
  status: string;
  role: string;
}

const ComponentsDemo: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [checkboxValue, setCheckboxValue] = useState(false);
  const toast = useToast();

  const sampleData: SampleData[] = [
    { id: '1', name: 'Иван Петров', email: 'ivan@example.com', status: 'active', role: 'admin' },
    { id: '2', name: 'Мария Сидорова', email: 'maria@example.com', status: 'active', role: 'manager' },
    { id: '3', name: 'Петр Иванов', email: 'petr@example.com', status: 'inactive', role: 'user' },
    { id: '4', name: 'Анна Смирнова', email: 'anna@example.com', status: 'active', role: 'user' },
    { id: '5', name: 'Дмитрий Козлов', email: 'dmitry@example.com', status: 'pending', role: 'user' },
  ];

  const columns: Column<SampleData>[] = [
    { key: 'name', label: 'Имя', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { 
      key: 'status', 
      label: 'Статус', 
      sortable: true,
      render: (value) => (
        <span className={styles[`status-${value}`]}>{value}</span>
      ),
    },
    { key: 'role', label: 'Роль', sortable: true },
  ];

  const bulkActions: BulkAction[] = [
    {
      label: 'Удалить',
      icon: '🗑️',
      onClick: (ids) => toast.success(`Удалено ${ids.length} элементов`),
      variant: 'danger',
    },
    {
      label: 'Экспорт',
      icon: '📥',
      onClick: (ids) => toast.info(`Экспортировано ${ids.length} элементов`),
    },
  ];

  const filters: FilterOption[] = [
    {
      key: 'status',
      label: 'Статус',
      options: [
        { value: 'active', label: 'Активный' },
        { value: 'inactive', label: 'Неактивный' },
        { value: 'pending', label: 'В ожидании' },
      ],
    },
    {
      key: 'role',
      label: 'Роль',
      options: [
        { value: 'admin', label: 'Администратор' },
        { value: 'manager', label: 'Менеджер' },
        { value: 'user', label: 'Пользователь' },
      ],
    },
  ];

  return (
    <div className={styles.container}>
      <h1>Демонстрация UI-компонентов</h1>
      <p className={styles.description}>
        Полный набор переиспользуемых компонентов для CRM-системы
      </p>

      {/* Buttons */}
      <Card>
        <CardHeader>
          <h2>Кнопки</h2>
        </CardHeader>
        <CardBody>
          <div className={styles.section}>
            <h3>Варианты</h3>
            <div className={styles.buttonGroup}>
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
            </div>
          </div>

          <div className={styles.section}>
            <h3>Размеры</h3>
            <div className={styles.buttonGroup}>
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
          </div>

          <div className={styles.section}>
            <h3>С иконками</h3>
            <div className={styles.buttonGroup}>
              <Button leftIcon="➕">Создать</Button>
              <Button rightIcon="→">Далее</Button>
              <Button variant="outline" leftIcon="⬇️" rightIcon="📥">
                Скачать
              </Button>
            </div>
          </div>

          <div className={styles.section}>
            <h3>Состояния</h3>
            <div className={styles.buttonGroup}>
              <Button loading>Загрузка...</Button>
              <Button disabled>Недоступна</Button>
              <Button fullWidth>На всю ширину</Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Form Controls */}
      <Card>
        <CardHeader>
          <h2>Поля форм</h2>
        </CardHeader>
        <CardBody>
          <div className={styles.formGrid}>
            <Input
              label="Email"
              placeholder="example@domain.com"
              type="email"
              helperText="Введите ваш email"
            />
            <Input
              label="Пароль"
              placeholder="••••••••"
              type="password"
              error="Пароль слишком короткий"
            />
            <Input
              label="Поиск"
              placeholder="Поиск..."
              leftIcon="🔍"
            />
            <Input
              label="С иконками"
              placeholder="Ваш текст"
              leftIcon="📧"
              rightIcon="✓"
            />
            <Select
              label="Выберите страну"
              options={[
                { value: '', label: 'Выберите опцию' },
                { value: 'ru', label: 'Россия' },
                { value: 'us', label: 'США' },
                { value: 'uk', label: 'Великобритания' },
              ]}
            />
            <Checkbox
              label="Согласен с условиями"
              checked={checkboxValue}
              onChange={(e) => setCheckboxValue(e.target.checked)}
            />
            <Textarea
              label="Комментарий"
              placeholder="Введите ваш комментарий..."
              helperText="Максимум 500 символов"
            />
          </div>
        </CardBody>
      </Card>

      {/* Cards */}
      <Card>
        <CardHeader>
          <h2>Карточки</h2>
        </CardHeader>
        <CardBody>
          <div className={styles.cardGrid}>
            <Card variant="default" padding="md">
              <h3>Default Card</h3>
              <p>Стандартная карточка с тенью</p>
            </Card>
            <Card variant="bordered" padding="md" hoverable>
              <h3>Bordered Card</h3>
              <p>Карточка с рамкой (наведите курсор)</p>
            </Card>
            <Card variant="elevated" padding="lg">
              <h3>Elevated Card</h3>
              <p>Карточка с большой тенью</p>
            </Card>
          </div>
        </CardBody>
      </Card>

      {/* Dropdown */}
      <Card>
        <CardHeader>
          <h2>Выпадающее меню</h2>
        </CardHeader>
        <CardBody>
          <div className={styles.dropdownSection}>
            <Dropdown
              trigger={<Button variant="outline">Действия ▼</Button>}
              items={[
                { label: 'Редактировать', value: 'edit', icon: '✏️', onClick: () => toast.info('Редактирование') },
                { label: 'Удалить', value: 'delete', icon: '🗑️', onClick: () => toast.error('Удалено') },
                { label: 'Отключено', value: 'disabled', disabled: true },
              ]}
            />
          </div>
        </CardBody>
      </Card>

      {/* Modal */}
      <Card>
        <CardHeader>
          <h2>Модальное окно</h2>
        </CardHeader>
        <CardBody>
          <Button onClick={() => setModalOpen(true)}>Открыть модальное окно</Button>
          <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Пример модального окна">
            <ModalBody>
              <p>Это пример модального окна с различными компонентами.</p>
              <Input label="Имя" placeholder="Введите имя" />
              <Textarea label="Описание" placeholder="Введите описание" />
            </ModalBody>
            <ModalFooter>
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Отмена
              </Button>
              <Button onClick={() => { setModalOpen(false); toast.success('Сохранено!'); }}>
                Сохранить
              </Button>
            </ModalFooter>
          </Modal>
        </CardBody>
      </Card>

      {/* Toast */}
      <Card>
        <CardHeader>
          <h2>Уведомления (Toast)</h2>
        </CardHeader>
        <CardBody>
          <div className={styles.buttonGroup}>
            <Button onClick={() => toast.success('Операция выполнена успешно!')}>
              Success
            </Button>
            <Button onClick={() => toast.error('Произошла ошибка!')}>
              Error
            </Button>
            <Button onClick={() => toast.warning('Предупреждение!')}>
              Warning
            </Button>
            <Button onClick={() => toast.info('Информация')}>
              Info
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Badge */}
      <Card>
        <CardHeader>
          <h2>Бэйджи (Badge)</h2>
        </CardHeader>
        <CardBody>
          <div className={styles.section}>
            <h3>Варианты</h3>
            <div className={styles.buttonGroup}>
              <Badge variant="primary">Primary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="error">Error</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="neutral">Neutral</Badge>
            </div>
          </div>

          <div className={styles.section}>
            <h3>С точкой</h3>
            <div className={styles.buttonGroup}>
              <Badge variant="success" dot>Активный</Badge>
              <Badge variant="error" dot>Просрочено</Badge>
              <Badge variant="warning" dot>В ожидании</Badge>
            </div>
          </div>

          <div className={styles.section}>
            <h3>Размеры</h3>
            <div className={styles.buttonGroup}>
              <Badge variant="primary" size="sm">Small</Badge>
              <Badge variant="primary" size="md">Medium</Badge>
              <Badge variant="primary" size="lg">Large</Badge>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Spinner */}
      <Card>
        <CardHeader>
          <h2>Загрузка (Spinner)</h2>
        </CardHeader>
        <CardBody>
          <div className={styles.section}>
            <h3>Размеры</h3>
            <div className={styles.buttonGroup}>
              <Spinner size="sm" />
              <Spinner size="md" />
              <Spinner size="lg" />
              <Spinner size="xl" />
            </div>
          </div>

          <div className={styles.section}>
            <h3>Варианты</h3>
            <div className={styles.buttonGroup}>
              <Spinner variant="primary" />
              <Spinner variant="gray" />
              <div style={{ background: '#2563eb', padding: '10px', borderRadius: '4px' }}>
                <Spinner variant="white" />
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Skeleton */}
      <Card>
        <CardHeader>
          <h2>Skeleton (заглушки)</h2>
        </CardHeader>
        <CardBody>
          <div className={styles.section}>
            <h3>Текстовые</h3>
            <div style={{ width: '100%' }}>
              <Skeleton variant="text" width="100%" />
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="text" width="60%" />
            </div>
          </div>

          <div className={styles.section}>
            <h3>Блоки и кружки</h3>
            <div className={styles.buttonGroup}>
              <Skeleton variant="rectangular" width={200} height={100} />
              <Skeleton variant="circular" width={80} height={80} />
            </div>
          </div>

          <div className={styles.section}>
            <h3>Анимация</h3>
            <div style={{ width: '100%' }}>
              <Skeleton variant="text" animation="pulse" width="100%" />
              <Skeleton variant="text" animation="wave" width="100%" />
              <Skeleton variant="text" animation={false} width="100%" />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Divider */}
      <Card>
        <CardHeader>
          <h2>Разделители (Divider)</h2>
        </CardHeader>
        <CardBody>
          <div className={styles.section}>
            <h3>Стандартный</h3>
            <p>Текст выше разделителя</p>
            <Divider />
            <p>Текст ниже разделителя</p>
          </div>

          <div className={styles.section}>
            <h3>С меткой</h3>
            <p>Текст выше</p>
            <Divider label="или" />
            <p>Текст ниже</p>
          </div>

          <div className={styles.section}>
            <h3>Варианты стилей</h3>
            <Divider variant="solid" spacing="sm" />
            <Divider variant="dashed" spacing="md" />
            <Divider variant="dotted" spacing="lg" />
          </div>
        </CardBody>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <h2>Таблица</h2>
        </CardHeader>
        <CardBody>
          <Table
            data={sampleData}
            columns={columns}
            keyExtractor={(row) => row.id}
            pageSize={25}
            showSearch
            searchPlaceholder="Поиск по таблице..."
            filters={filters}
            bulkActions={bulkActions}
            onRowClick={(row) => toast.info(`Выбрана строка: ${row.name}`)}
          />
        </CardBody>
      </Card>
    </div>
  );
};

export default ComponentsDemo;
