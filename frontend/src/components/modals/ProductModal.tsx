import React, { useState, useEffect } from 'react';
import { CreateProductDto, UpdateProductDto } from '../../hooks/useProducts';
import { Product, ProductType } from '../../types';
import styles from './AddLeadModal.module.css';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProductDto | UpdateProductDto) => Promise<void>;
  product?: Product | null;
  mode: 'create' | 'edit';
}

const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  product,
  mode,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateProductDto | UpdateProductDto>({
    name: '',
    description: '',
    type: 'service' as ProductType,
    price: undefined,
    status: 'active',
  });

  useEffect(() => {
    if (product && mode === 'edit') {
      setFormData({
        name: product.name,
        description: product.description || '',
        type: product.type,
        price: product.price ? parseFloat(product.price) : undefined,
        status: product.status,
      });
    } else if (mode === 'create') {
      setFormData({
        name: '',
        description: '',
        type: 'service' as ProductType,
        price: undefined,
        status: 'active',
      });
    }
  }, [product, mode, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'price') {
      const numValue = value === '' ? undefined : parseFloat(value);
      setFormData((prev) => ({ ...prev, [name]: numValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value || null }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await onSubmit(formData);
      setFormData({
        name: '',
        description: '',
        type: 'service' as ProductType,
        price: undefined,
        status: 'active',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const title = mode === 'create' ? 'Добавить продукт' : 'Редактировать продукт';
  const submitText = loading
    ? 'Сохранение...'
    : mode === 'create'
      ? 'Добавить продукт'
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
            <label htmlFor="name">Название *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              placeholder="Введите название продукта"
              required
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="description">Описание</label>
            <textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              placeholder="Краткое описание продукта"
              rows={3}
              style={{ width: '100%', padding: '8px', fontSize: '14px', fontFamily: 'inherit' }}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label htmlFor="type">Тип продукта *</label>
              <select
                id="type"
                name="type"
                value={formData.type || 'service'}
                onChange={handleChange}
                required
              >
                <option value="course">Курс</option>
                <option value="service">Услуга</option>
                <option value="other">Другое</option>
              </select>
            </div>

            <div className={styles.formField}>
              <label htmlFor="price">Цена</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price ?? ''}
                onChange={handleChange}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {mode === 'edit' && (
            <div className={styles.formField}>
              <label htmlFor="status">Статус</label>
              <select
                id="status"
                name="status"
                value={formData.status || 'active'}
                onChange={handleChange}
              >
                <option value="active">Активен</option>
                <option value="archived">Архивирован</option>
              </select>
            </div>
          )}

          <footer className={styles.footer}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className={styles.submitButton} disabled={loading}>
              {submitText}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
