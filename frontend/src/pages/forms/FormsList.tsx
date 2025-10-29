import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../layouts/AppLayout';
import api from '../../utils/api';
import { Form, FormsListResponse } from '../../types/forms';
import { useToast } from '../../components/ui/toastContext';
import styles from './Forms.module.css';

const FormsList: React.FC = () => {
  const navigate = useNavigate();
  const { success: showToastSuccess, error: showToastError } = useToast();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ data: FormsListResponse }>('/api/v1/forms', {
        params: { page_size: 100 },
      });
      setForms(response.data.data.forms);
    } catch (error: any) {
      showToastError(error.response?.data?.message || 'Не удалось загрузить формы');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту форму?')) {
      return;
    }

    try {
      await api.delete(`/api/v1/forms/${id}`);
      showToastSuccess('Форма успешно удалена');
      loadForms();
    } catch (error: any) {
      showToastError(error.response?.data?.message || 'Не удалось удалить форму');
    }
  };

  const handleCopyUrl = (publicUrl: string) => {
    const fullUrl = `${window.location.origin}/public-form/${publicUrl}`;
    navigator.clipboard.writeText(fullUrl);
    showToastSuccess('Ссылка скопирована в буфер обмена');
  };

  const filteredForms = forms.filter((form) =>
    form.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const dateFormatter = (value: string) => {
    const date = new Date(value);
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    };
    return date.toLocaleDateString('ru-RU', options).replace('.', '');
  };

  return (
    <AppLayout breadcrumbs={['Формы']}>
      <div className={styles.wrapper}>
        <div className={styles.pageHeader}>
          <div>
            <p className={styles.pageEyebrow}>КОНСТРУКТОР</p>
            <h1>Формы заявок</h1>
          </div>
          <div className={styles.headerActions}>
            <button
              className={styles.primaryButton}
              onClick={() => navigate('/forms/builder')}
            >
              + Создать форму
            </button>
          </div>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.searchBlock}>
            <div className={styles.searchField}>
              <span>🔍</span>
              <input
                type="text"
                placeholder="Поиск по названию"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className={styles.tableCard}>
          {loading ? (
            <div className={styles.loader}>Загрузка...</div>
          ) : filteredForms.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyIcon}>📝</p>
              <p className={styles.emptyTitle}>Нет форм</p>
              <p className={styles.emptySubtitle}>
                {searchTerm
                  ? 'Попробуйте изменить поисковый запрос'
                  : 'Создайте первую форму для сбора заявок'}
              </p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Продукт</th>
                  <th>Поля</th>
                  <th>Статус</th>
                  <th>Создана</th>
                  <th className={styles.actionsCell}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredForms.map((form) => (
                  <tr key={form.id} className={styles.tableRow}>
                    <td className={styles.nameCell}>
                      <div className={styles.formName}>{form.name}</div>
                    </td>
                    <td>
                      {form.product_name ? (
                        <span className={styles.productBadge}>{form.product_name}</span>
                      ) : (
                        <span className={styles.noProduct}>—</span>
                      )}
                    </td>
                    <td>
                      <span className={styles.fieldsCount}>
                        {form.fields?.length || 0} полей
                      </span>
                    </td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${
                          form.is_active ? styles.statusActive : styles.statusInactive
                        }`}
                      >
                        {form.is_active ? 'Активна' : 'Неактивна'}
                      </span>
                    </td>
                    <td className={styles.dateCell}>{dateFormatter(form.created_at)}</td>
                    <td className={styles.actionsCell}>
                      <button
                        className={styles.actionButton}
                        onClick={() => navigate(`/forms/builder/${form.id}`)}
                        title="Редактировать"
                      >
                        ✏️
                      </button>
                      <button
                        className={styles.actionButton}
                        onClick={() => form.public_url && handleCopyUrl(form.public_url)}
                        title="Копировать ссылку"
                      >
                        🔗
                      </button>
                      <button
                        className={styles.actionButton}
                        onClick={() => handleDelete(form.id)}
                        title="Удалить"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default FormsList;
