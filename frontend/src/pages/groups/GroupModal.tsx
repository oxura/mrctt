import React, { useEffect, useMemo, useState } from 'react';
import { CreateGroupDto, UpdateGroupDto } from '../../hooks/useGroups';
import { Group, GroupStatus, Product } from '../../types';
import styles from '../../components/modals/AddLeadModal.module.css';
import groupStyles from './Groups.module.css';

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateGroupDto | UpdateGroupDto) => Promise<void>;
  products: Product[];
  group?: Group | null;
  mode: 'create' | 'edit';
}

const statusOptions: { value: GroupStatus; label: string }[] = [
  { value: 'open', label: 'Набор открыт' },
  { value: 'full', label: 'Набор закрыт' },
  { value: 'closed', label: 'Набор закрыт' },
  { value: 'cancelled', label: 'Отменено' },
];

const GroupModal: React.FC<GroupModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  products,
  group,
  mode,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateGroupDto | UpdateGroupDto>({
    product_id: products[0]?.id || '',
    name: '',
    start_date: '',
    end_date: null,
    max_capacity: undefined,
    status: 'open',
  });

  const courseProducts = useMemo(() => products.filter((product) => product.type === 'course'), [products]);

  useEffect(() => {
    if (group && mode === 'edit') {
      setFormData({
        product_id: group.product_id,
        name: group.name,
        start_date: group.start_date ? group.start_date.substring(0, 10) : '',
        end_date: group.end_date ? group.end_date.substring(0, 10) : null,
        max_capacity: group.max_capacity ?? undefined,
        status: group.status,
      });
    } else if (mode === 'create') {
      setFormData({
        product_id: courseProducts[0]?.id || '',
        name: '',
        start_date: '',
        end_date: null,
        max_capacity: undefined,
        status: 'open',
      });
    }
  }, [group, mode, isOpen, courseProducts]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'max_capacity') {
      const numValue = value === '' ? undefined : parseInt(value, 10);
      setFormData((prev) => ({ ...prev, [name]: numValue }));
    } else if (name === 'start_date' || name === 'end_date') {
      setFormData((prev) => ({ ...prev, [name]: value || null }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.product_id) {
        throw new Error('Выберите продукт типа "Курс"');
      }

      const payload: CreateGroupDto | UpdateGroupDto = {
        ...formData,
        start_date: formData.start_date ? formData.start_date : null,
        end_date: formData.end_date ? (formData.end_date as string) : null,
        max_capacity: formData.max_capacity ?? undefined,
      };

      if (mode === 'create') {
        delete (payload as UpdateGroupDto).status;
      }

      await onSubmit(payload);

      setFormData({
        product_id: courseProducts[0]?.id || '',
        name: '',
        start_date: '',
        end_date: null,
        max_capacity: undefined,
        status: 'open',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Не удалось сохранить группу');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const title = mode === 'create' ? 'Создать группу' : 'Редактировать группу';
  const submitText = loading
    ? 'Сохранение...'
    : mode === 'create'
      ? 'Создать группу'
      : 'Сохранить изменения';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <h2>{title}</h2>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.formField}>
            <label htmlFor="product_id">Продукт *</label>
            <select
              id="product_id"
              name="product_id"
              value={formData.product_id || ''}
              onChange={handleChange}
              required
            >
              <option value="" disabled>
                Выберите продукт типа "Курс"
              </option>
              {courseProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
            {courseProducts.length === 0 && (
              <p className={groupStyles.hint}>Добавьте продукт типа "Курс", чтобы создать группу.</p>
            )}
          </div>

          <div className={styles.formField}>
            <label htmlFor="name">Название *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              placeholder="Например, Сентябрьский поток"
              required
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label htmlFor="start_date">Дата старта *</label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={typeof formData.start_date === 'string' ? formData.start_date : ''}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.formField}>
              <label htmlFor="max_capacity">Лимит мест</label>
              <input
                type="number"
                id="max_capacity"
                name="max_capacity"
                value={formData.max_capacity ?? ''}
                onChange={handleChange}
                placeholder="20"
                min={1}
              />
              <span className={groupStyles.hint}>Оставьте пустым, если лимита нет</span>
            </div>
          </div>

          {mode === 'edit' && (
            <div className={styles.formField}>
              <label htmlFor="status">Статус</label>
              <select
                id="status"
                name="status"
                value={formData.status || 'open'}
                onChange={handleChange}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <footer className={styles.footer}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Отмена
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading || courseProducts.length === 0}
            >
              {submitText}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default GroupModal;
