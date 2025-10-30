import React, { useState, useEffect } from 'react';
import { Input, Button, useToast } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';
import styles from './GeneralSettings.module.css';

const currencies = [
  { value: 'RUB', label: 'RUB - Российский рубль' },
  { value: 'USD', label: 'USD - Доллар США' },
  { value: 'EUR', label: 'EUR - Евро' },
  { value: 'KZT', label: 'KZT - Казахстанский тенге' },
  { value: 'UAH', label: 'UAH - Украинская гривна' },
];

const GeneralSettings: React.FC = () => {
  const { tenant, updateTenant } = useAuthStore();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tenant) {
      setName(tenant.name);
      setLogoUrl(tenant.logo_url || '');
      setCurrency(tenant.currency);
    }
  }, [tenant]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        showToast('Размер файла не должен превышать 2 МБ', 'error');
        e.target.value = '';
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        showToast('Допустимые форматы: JPEG, PNG, GIF, WebP', 'error');
        e.target.value = '';
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('Название компании не может быть пустым', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await api.put('/api/v1/tenants/current/settings', {
        name: name.trim(),
        logo_url: logoUrl || null,
        currency,
      });

      if (response.data?.data?.tenant) {
        updateTenant(response.data.data.tenant);
        showToast('Настройки успешно сохранены', 'success');
      }
    } catch (error) {
      console.error('Failed to save general settings:', error);
      showToast('Не удалось сохранить настройки', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Общие настройки</h2>
      <p className={styles.description}>Основная информация о вашей компании</p>

      <div className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="company-name">Название компании</label>
          <Input
            id="company-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Введите название компании"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="currency">Валюта по умолчанию</label>
          <select
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className={styles.select}
          >
            {currencies.map((curr) => (
              <option key={curr.value} value={curr.value}>
                {curr.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="logo">Логотип компании</label>
          <input
            id="logo"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className={styles.fileInput}
          />
          {logoUrl && (
            <div className={styles.logoPreview}>
              <img src={logoUrl} alt="Логотип" />
              <Button
                variant="outline"
                size="small"
                onClick={() => {
                  setLogoUrl('');
                  setLogoFile(null);
                }}
              >
                Удалить
              </Button>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Сохранение...' : 'Сохранить изменения'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;
