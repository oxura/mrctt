import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '../../layouts/AppLayout';
import api from '../../utils/api';
import { Form, FormField, FormFieldType, CreateFormRequest } from '../../types/forms';
import { Product } from '../../types';
import { useToast } from '../../components/ui/toastContext';
import styles from './FormBuilder.module.css';

const fieldTypeLabels: Record<FormFieldType, string> = {
  text: 'Текст',
  phone: 'Телефон',
  email: 'Email',
  dropdown: 'Выпадающий список',
  checkbox: 'Чекбокс',
  date: 'Дата',
};

const fieldTypeIcons: Record<FormFieldType, string> = {
  text: '📝',
  phone: '📞',
  email: '📧',
  dropdown: '📋',
  checkbox: '☑️',
  date: '📅',
};

const FormBuilder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success: showToastSuccess, error: showToastError } = useToast();

  const [formName, setFormName] = useState('Новая форма');
  const [productId, setProductId] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState('Спасибо! Мы свяжемся с вами в ближайшее время.');
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [draggedFieldType, setDraggedFieldType] = useState<FormFieldType | null>(null);
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
    if (id) {
      loadForm(id);
    }
  }, [id]);

  const loadProducts = async () => {
    try {
      const response = await api.get('/api/v1/products', {
        params: { page_size: 100, status: 'active' },
      });
      setProducts(response.data.data.products || []);
    } catch (error: any) {
      console.error('Failed to load products', error);
    }
  };

  const loadForm = async (formId: string) => {
    try {
      setLoading(true);
      const response = await api.get<{ data: Form }>(`/api/v1/forms/${formId}`);
      const form = response.data.data;
      setFormName(form.name);
      setProductId(form.product_id || '');
      setSuccessMessage(form.success_message || 'Спасибо! Мы свяжемся с вами в ближайшее время.');
      setFields(form.fields || []);
      setPublicUrl(form.public_url || null);
    } catch (error: any) {
      showToastError(error.response?.data?.message || 'Не удалось загрузить форму');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      showToastError('Введите название формы');
      return;
    }

    try {
      setSaving(true);
      const payload: CreateFormRequest = {
        name: formName,
        product_id: productId || null,
        fields,
        success_message: successMessage,
      };

      if (id) {
        const response = await api.put<{ data: Form }>(`/api/v1/forms/${id}`, payload);
        setPublicUrl(response.data.data.public_url || null);
        showToastSuccess('Форма успешно обновлена');
      } else {
        const response = await api.post<{ data: Form }>('/api/v1/forms', payload);
        setPublicUrl(response.data.data.public_url || null);
        showToastSuccess('Форма успешно создана');
        navigate(`/forms/builder/${response.data.data.id}`, { replace: true });
      }
    } catch (error: any) {
      showToastError(error.response?.data?.message || 'Не удалось сохранить форму');
    } finally {
      setSaving(false);
    }
  };

  const handleDragStartFromToolbox = (fieldType: FormFieldType) => {
    setDraggedFieldType(fieldType);
  };

  const handleDragStartFromCanvas = (fieldId: string) => {
    setDraggedFieldId(fieldId);
  };

  const handleDragOverCanvas = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnCanvas = (e: React.DragEvent, targetIndex?: number) => {
    e.preventDefault();

    if (draggedFieldType) {
      const newField: FormField = {
        id: `field-${Date.now()}`,
        type: draggedFieldType,
        label: `${fieldTypeLabels[draggedFieldType]}`,
        placeholder: '',
        required: false,
        options: draggedFieldType === 'dropdown' ? ['Вариант 1', 'Вариант 2'] : undefined,
      };

      if (targetIndex !== undefined) {
        const newFields = [...fields];
        newFields.splice(targetIndex, 0, newField);
        setFields(newFields);
      } else {
        setFields([...fields, newField]);
      }

      setSelectedFieldId(newField.id);
      setDraggedFieldType(null);
    } else if (draggedFieldId) {
      const draggedIndex = fields.findIndex((f) => f.id === draggedFieldId);
      if (draggedIndex === -1) return;

      const newFields = [...fields];
      const [draggedField] = newFields.splice(draggedIndex, 1);

      let insertIndex = targetIndex ?? newFields.length;
      if (insertIndex > draggedIndex) {
        insertIndex -= 1;
      }

      newFields.splice(insertIndex, 0, draggedField);

      setFields(newFields);
      setDraggedFieldId(null);
    }
  };

  const handleDeleteField = (fieldId: string) => {
    setFields(fields.filter((f) => f.id !== fieldId));
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
  };

  const handleUpdateField = (fieldId: string, updates: Partial<FormField>) => {
    setFields(fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)));
  };

  const handleCopyUrl = () => {
    if (!publicUrl) return;
    const fullUrl = `${window.location.origin}/public-form/${publicUrl}`;
    navigator.clipboard.writeText(fullUrl);
    showToastSuccess('Ссылка скопирована в буфер обмена');
  };

  const selectedField = fields.find((f) => f.id === selectedFieldId);

  if (loading) {
    return (
      <AppLayout breadcrumbs={['Формы', 'Конструктор']}>
        <div className={styles.loader}>Загрузка...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={['Формы', id ? 'Редактирование' : 'Создание']}>
      <div className={styles.builderContainer}>
        <div className={styles.builderHeader}>
          <input
            type="text"
            className={styles.formNameInput}
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Название формы"
          />
          <div className={styles.headerActions}>
            <button className={styles.secondaryButton} onClick={() => navigate('/forms')}>
              Отмена
            </button>
            <button
              className={styles.primaryButton}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>

        <div className={styles.builderBody}>
          <div className={styles.toolboxPanel}>
            <h3>Блоки полей</h3>
            <div className={styles.toolboxItems}>
              {(Object.keys(fieldTypeLabels) as FormFieldType[]).map((type) => (
                <div
                  key={type}
                  className={styles.toolboxItem}
                  draggable
                  onDragStart={() => handleDragStartFromToolbox(type)}
                >
                  <span className={styles.toolboxIcon}>{fieldTypeIcons[type]}</span>
                  <span>{fieldTypeLabels[type]}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            className={styles.canvasPanel}
            onDragOver={handleDragOverCanvas}
            onDrop={handleDropOnCanvas}
          >
            <h3>Превью формы</h3>
            {fields.length === 0 ? (
              <div className={styles.canvasEmpty}>
                <p>Перетащите поля из панели слева, чтобы создать форму</p>
              </div>
            ) : (
              <div className={styles.canvasFields}>
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className={`${styles.canvasField} ${
                      selectedFieldId === field.id ? styles.canvasFieldSelected : ''
                    }`}
                    draggable
                    onDragStart={() => handleDragStartFromCanvas(field.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDropOnCanvas(e, index)}
                    onClick={() => setSelectedFieldId(field.id)}
                  >
                    <div className={styles.fieldHeader}>
                      <span className={styles.fieldIcon}>{fieldTypeIcons[field.type]}</span>
                      <span className={styles.fieldLabel}>
                        {field.label}
                        {field.required && <span className={styles.required}>*</span>}
                      </span>
                      <button
                        className={styles.fieldDeleteButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteField(field.id);
                        }}
                      >
                        ✕
                      </button>
                    </div>
                    <div className={styles.fieldPreview}>
                      {field.type === 'text' && (
                        <input type="text" placeholder={field.placeholder || 'Введите текст'} disabled />
                      )}
                      {field.type === 'phone' && (
                        <input type="tel" placeholder={field.placeholder || '+7 (999) 123-45-67'} disabled />
                      )}
                      {field.type === 'email' && (
                        <input type="email" placeholder={field.placeholder || 'email@example.com'} disabled />
                      )}
                      {field.type === 'date' && <input type="date" disabled />}
                      {field.type === 'checkbox' && (
                        <label>
                          <input type="checkbox" disabled /> {field.placeholder || 'Согласен'}
                        </label>
                      )}
                      {field.type === 'dropdown' && (
                        <select disabled>
                          <option>{field.placeholder || 'Выберите...'}</option>
                          {field.options?.map((opt, i) => (
                            <option key={i}>{opt}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.propertiesPanel}>
            <h3>Свойства</h3>
            {selectedField ? (
              <div className={styles.propertiesForm}>
                <div className={styles.formGroup}>
                  <label>Тип поля</label>
                  <input type="text" value={fieldTypeLabels[selectedField.type]} disabled />
                </div>
                <div className={styles.formGroup}>
                  <label>Название поля</label>
                  <input
                    type="text"
                    value={selectedField.label}
                    onChange={(e) =>
                      handleUpdateField(selectedField.id, { label: e.target.value })
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Placeholder</label>
                  <input
                    type="text"
                    value={selectedField.placeholder || ''}
                    onChange={(e) =>
                      handleUpdateField(selectedField.id, { placeholder: e.target.value })
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={selectedField.required}
                      onChange={(e) =>
                        handleUpdateField(selectedField.id, { required: e.target.checked })
                      }
                    />
                    Обязательное поле
                  </label>
                </div>
                {selectedField.type === 'dropdown' && (
                  <div className={styles.formGroup}>
                    <label>Варианты (через запятую)</label>
                    <textarea
                      value={selectedField.options?.join(', ') || ''}
                      onChange={(e) =>
                        handleUpdateField(selectedField.id, {
                          options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                        })
                      }
                      rows={3}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.propertiesEmpty}>
                <p>Выберите поле для настройки</p>
              </div>
            )}

            <hr className={styles.divider} />

            <div className={styles.formSettings}>
              <h4>Настройки формы</h4>
              <div className={styles.formGroup}>
                <label>Привязка к продукту</label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                >
                  <option value="">Не выбран</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Текст после отправки</label>
                <textarea
                  value={successMessage}
                  onChange={(e) => setSuccessMessage(e.target.value)}
                  rows={3}
                />
              </div>
              {publicUrl && (
                <div className={styles.formGroup}>
                  <label>Публичная ссылка</label>
                  <div className={styles.urlCopyGroup}>
                    <input
                      type="text"
                      value={`${window.location.origin}/public-form/${publicUrl}`}
                      readOnly
                    />
                    <button className={styles.copyButton} onClick={handleCopyUrl}>
                      Копировать
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default FormBuilder;
