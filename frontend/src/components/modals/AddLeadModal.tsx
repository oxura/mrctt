import React, { useState } from 'react';
import { CreateLeadDto } from '../../hooks/useLeads';
import styles from './AddLeadModal.module.css';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLeadDto) => Promise<void>;
}

const AddLeadModal: React.FC<AddLeadModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateLeadDto>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    source: '',
    utm_source: '',
    status: 'new',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value || null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await onSubmit(formData);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        source: '',
        utm_source: '',
        status: 'new',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create lead');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <h2>Добавить лид вручную</h2>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label htmlFor="first_name">Имя *</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name || ''}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.formField}>
              <label htmlFor="last_name">Фамилия</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name || ''}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={styles.formField}>
            <label htmlFor="phone">Телефон *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone || ''}
              onChange={handleChange}
              placeholder="+7 (999) 123-45-67"
              required
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              placeholder="example@mail.com"
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="source">Источник</label>
            <input
              type="text"
              id="source"
              name="source"
              value={formData.source || ''}
              onChange={handleChange}
              placeholder="Landing, Instagram, Звонок..."
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="utm_source">UTM Source</label>
            <input
              type="text"
              id="utm_source"
              name="utm_source"
              value={formData.utm_source || ''}
              onChange={handleChange}
              placeholder="google, facebook, instagram..."
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="status">Статус</label>
            <select
              id="status"
              name="status"
              value={formData.status || 'new'}
              onChange={handleChange}
            >
              <option value="new">Новый</option>
              <option value="working">В работе</option>
              <option value="awaiting_payment">Ждет оплаты</option>
              <option value="won">Успех</option>
              <option value="lost">Отказ</option>
            </select>
          </div>

          <footer className={styles.footer}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? 'Сохранение...' : 'Добавить лид'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default AddLeadModal;
