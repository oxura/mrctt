import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Form, FormField } from '../../types/forms';
import styles from './PublicForm.module.css';

const PublicForm: React.FC = () => {
  const { publicUrl } = useParams<{ publicUrl: string }>();
  const location = useLocation();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (publicUrl) {
      loadForm(publicUrl);
    }
  }, [publicUrl]);

  const loadForm = async (url: string) => {
    try {
      setLoading(true);
      const response = await axios.get<{ data: Form }>(
        `${import.meta.env.VITE_API_URL}/api/v1/forms/public/${url}`,
        {
          withCredentials: false,
        }
      );
      setForm(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Форма не найдена');
    } finally {
      setLoading(false);
    }
  };

  const validateField = (field: FormField, value: any): string | null => {
    if (field.required) {
      if (field.type === 'dropdown') {
        if (!value || value === '') {
          return `Поле "${field.label}" обязательно для заполнения`;
        }
      } else if (field.type === 'checkbox') {
        if (!value) {
          return `Поле "${field.label}" обязательно для заполнения`;
        }
      } else if (!value || (typeof value === 'string' && value.trim() === '')) {
        return `Поле "${field.label}" обязательно для заполнения`;
      }
    }

    if (value && typeof value === 'string' && value.trim() !== '') {
      if (field.type === 'text') {
        if (value.length > 255) {
          return 'Текст не должен превышать 255 символов';
        }
      }
      if (field.type === 'email') {
        if (value.length > 255) {
          return 'Email не должен превышать 255 символов';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return 'Введите корректный email адрес';
        }
      }
      if (field.type === 'phone') {
        if (value.length < 10 || value.length > 30) {
          return 'Номер телефона должен содержать от 10 до 30 символов';
        }
        const phoneRegex = /^[\d\s\+\-\(\)]+$/;
        if (!phoneRegex.test(value)) {
          return 'Введите корректный номер телефона';
        }
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    const newErrors: Record<string, string> = {};
    for (const field of form.fields) {
      const fieldError = validateField(field, values[field.id]);
      if (fieldError) {
        newErrors[field.id] = fieldError;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSubmitting(true);
      setErrors({});
      setError(null);

      const searchParams = new URLSearchParams(location.search);
      const utm_source = searchParams.get('utm_source');
      const utm_medium = searchParams.get('utm_medium');
      const utm_campaign = searchParams.get('utm_campaign');

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/forms/public/${publicUrl}/submit`,
        {
          values,
          utm_source,
          utm_medium,
          utm_campaign,
        },
        {
          withCredentials: false,
        }
      );

      setSubmitted(true);
    } catch (err: any) {
      const fieldErrors = err.response?.data?.details?.fields;
      if (fieldErrors && typeof fieldErrors === 'object') {
        setErrors(fieldErrors);
        setError(null);
      } else {
        setError(err.response?.data?.message || 'Ошибка при отправке формы');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      const { [fieldId]: _, ...rest } = errors;
      setErrors(rest);
    }
  };

  const renderField = (field: FormField) => {
    const fieldError = errors[field.id];

    switch (field.type) {
      case 'text':
        return (
          <div key={field.id} className={styles.formGroup}>
            <label className={styles.label}>
              {field.label}
              {field.required && <span className={styles.required}> *</span>}
            </label>
            <input
              type="text"
              className={`${styles.input} ${fieldError ? styles.inputError : ''}`}
              placeholder={field.placeholder || ''}
              value={values[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
            />
            {fieldError && <span className={styles.errorMessage}>{fieldError}</span>}
          </div>
        );

      case 'phone':
        return (
          <div key={field.id} className={styles.formGroup}>
            <label className={styles.label}>
              {field.label}
              {field.required && <span className={styles.required}> *</span>}
            </label>
            <input
              type="tel"
              className={`${styles.input} ${fieldError ? styles.inputError : ''}`}
              placeholder={field.placeholder || '+7 (999) 123-45-67'}
              value={values[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
            />
            {fieldError && <span className={styles.errorMessage}>{fieldError}</span>}
          </div>
        );

      case 'email':
        return (
          <div key={field.id} className={styles.formGroup}>
            <label className={styles.label}>
              {field.label}
              {field.required && <span className={styles.required}> *</span>}
            </label>
            <input
              type="email"
              className={`${styles.input} ${fieldError ? styles.inputError : ''}`}
              placeholder={field.placeholder || 'email@example.com'}
              value={values[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
            />
            {fieldError && <span className={styles.errorMessage}>{fieldError}</span>}
          </div>
        );

      case 'date':
        return (
          <div key={field.id} className={styles.formGroup}>
            <label className={styles.label}>
              {field.label}
              {field.required && <span className={styles.required}> *</span>}
            </label>
            <input
              type="date"
              className={`${styles.input} ${fieldError ? styles.inputError : ''}`}
              value={values[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
            />
            {fieldError && <span className={styles.errorMessage}>{fieldError}</span>}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={!!values[field.id]}
                onChange={(e) => handleFieldChange(field.id, e.target.checked)}
              />
              <span>
                {field.label}
                {field.required && <span className={styles.required}> *</span>}
              </span>
            </label>
            {fieldError && <span className={styles.errorMessage}>{fieldError}</span>}
          </div>
        );

      case 'dropdown':
        return (
          <div key={field.id} className={styles.formGroup}>
            <label className={styles.label}>
              {field.label}
              {field.required && <span className={styles.required}> *</span>}
            </label>
            <select
              className={`${styles.select} ${fieldError ? styles.inputError : ''}`}
              value={values[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
            >
              <option value="">{field.placeholder || 'Выберите...'}</option>
              {field.options?.map((option, idx) => (
                <option key={idx} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {fieldError && <span className={styles.errorMessage}>{fieldError}</span>}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.loader}>Загрузка...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.errorState}>
            <p className={styles.errorIcon}>❌</p>
            <p className={styles.errorTitle}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.errorState}>
            <p className={styles.errorIcon}>❌</p>
            <p className={styles.errorTitle}>Форма не найдена</p>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.successState}>
            <p className={styles.successIcon}>✅</p>
            <p className={styles.successMessage}>
              {form.success_message || 'Спасибо! Мы свяжемся с вами в ближайшее время.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.formTitle}>{form.name}</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.errorAlert}>{error}</div>}
          {form.fields.map((field) => renderField(field))}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={submitting}
          >
            {submitting ? 'Отправка...' : 'Отправить'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PublicForm;
