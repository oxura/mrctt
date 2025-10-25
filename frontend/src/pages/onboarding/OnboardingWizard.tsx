import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '../../layouts/AppLayout';
import styles from './OnboardingWizard.module.css';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import type { TenantSettingsModules } from '../../types';

const niches = [
  { id: 'courses', title: 'Онлайн-школа / Курсы', icon: '🎓' },
  { id: 'services', title: 'Услуги / Freelance', icon: '🛠️' },
  { id: 'medicine', title: 'Медицина / Клиника', icon: '🏥' },
  { id: 'tourism', title: 'Туризм', icon: '✈️' },
  { id: 'other', title: 'Другое', icon: '✨' },
];

type ModuleId = 'products' | 'groups' | 'tasks' | 'team';

const defaultModules: ModuleId[] = ['products', 'tasks'];

const modulePresets: Record<string, ModuleId[]> = {
  courses: ['products', 'groups', 'tasks', 'team'],
  services: ['products', 'tasks', 'team'],
  medicine: ['products', 'tasks', 'team'],
  tourism: ['products', 'groups', 'tasks', 'team'],
  other: [...defaultModules],
};

const moduleOptions: { id: ModuleId; label: string }[] = [
  { id: 'products', label: 'Модуль: Продукты' },
  { id: 'groups', label: 'Модуль: Группы / Потоки' },
  { id: 'tasks', label: 'Модуль: Задачи / Календарь' },
  { id: 'team', label: 'Модуль: Команда' },
];

const OnboardingWizard: React.FC = () => {
  const [step, setStep] = useState(1);
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    logo: '',
    country: '',
    city: '',
  });
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [modules, setModules] = useState<ModuleId[]>(defaultModules);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const tenant = useAuthStore((state) => state.tenant);
  const updateTenant = useAuthStore((state) => state.updateTenant);
  const isPrefilled = useRef(false);

  useEffect(() => {
    if (tenant && !isPrefilled.current) {
      isPrefilled.current = true;
      setCompanyInfo({
        name: tenant.name || '',
        logo: tenant.logo_url || '',
        country: tenant.country || '',
        city: tenant.city || '',
      });

      if (tenant.industry) {
        setSelectedNiche(tenant.industry);
      }

      const modulesSettings = tenant.settings?.modules as TenantSettingsModules | undefined;
      if (modulesSettings && typeof modulesSettings === 'object') {
        const activeModules = moduleOptions
          .filter((option) => modulesSettings[option.id] === true)
          .map((option) => option.id);

        setModules(activeModules.length ? activeModules : [...defaultModules]);
      } else if (tenant.industry && modulePresets[tenant.industry]) {
        setModules([...modulePresets[tenant.industry]]);
      } else {
        setModules([...defaultModules]);
      }
    }
  }, [tenant]);

  const handleNext = () => {
    if (step === 1) {
      const trimmedName = companyInfo.name.trim();
      if (!trimmedName) {
        setError('Название компании обязательно');
        return;
      }

      if (trimmedName !== companyInfo.name) {
        setCompanyInfo((prev) => ({ ...prev, name: trimmedName }));
      }
    }

    if (step === 2 && !selectedNiche) {
      setError('Выберите нишу');
      return;
    }

    setError(null);
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleFinish = async () => {
    if (modules.length === 0) {
      setError('Выберите хотя бы один модуль');
      return;
    }

    const trimmedName = companyInfo.name.trim();
    const trimmedCountry = companyInfo.country.trim();
    const trimmedCity = companyInfo.city.trim();

    if (!trimmedName) {
      setError('Название компании обязательно');
      setStep(1);
      return;
    }

    setCompanyInfo((prev) => ({
      ...prev,
      name: trimmedName,
      country: trimmedCountry,
      city: trimmedCity,
    }));

    setLoading(true);
    setError(null);

    try {
      const response = await api.patch('/api/v1/tenants/current/onboarding', {
        name: trimmedName,
        logo_url: companyInfo.logo || null,
        country: trimmedCountry || undefined,
        city: trimmedCity || undefined,
        industry: selectedNiche || undefined,
        modules,
      });

      if (response.data?.data?.tenant) {
        updateTenant(response.data.data.tenant);
      }

      navigate('/dashboard');
    } catch (err: unknown) {
      console.error('Failed to save onboarding data:', err);
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { data?: { message?: string } } }).response;
        setError(response?.data?.message || 'Не удалось сохранить настройки');
      } else {
        setError('Не удалось сохранить настройки');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyInfoChange = (field: 'name' | 'country' | 'city' | 'logo', value: string) => {
    setCompanyInfo((prev) => ({ ...prev, [field]: value }));
    if (error) {
      setError(null);
    }
  };

  const handleNicheSelect = (niche: string) => {
    setSelectedNiche(niche);
    const presetModules = modulePresets[niche];
    setModules(presetModules ? [...presetModules] : [...defaultModules]);
    setError(null);
  };


  const toggleModule = (moduleId: ModuleId) => {
    const nextModules = modules.includes(moduleId)
      ? modules.filter((item) => item !== moduleId)
      : [...modules, moduleId];

    setModules(nextModules);

    if (error && nextModules.length > 0) {
      setError(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        setError('Размер файла не должен превышать 2 МБ');
        e.target.value = '';
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Допустимые форматы: JPEG, PNG, GIF, WebP');
        e.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        handleCompanyInfoChange('logo', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <AppLayout breadcrumbs={['Онбординг']}>
      <div className={styles.container}>
        <div className={styles.steps}>
          <div className={`${styles.step} ${step >= 1 ? styles.active : ''}`}>
            <span>1</span>
            <p>О компании</p>
          </div>
          <div className={`${styles.step} ${step >= 2 ? styles.active : ''}`}>
            <span>2</span>
            <p>Выбор ниши</p>
          </div>
          <div className={`${styles.step} ${step >= 3 ? styles.active : ''}`}>
            <span>3</span>
            <p>Настройка модулей</p>
          </div>
        </div>

        {error && (
          <div className={styles.error}>
            <p>{error}</p>
          </div>
        )}

        {step === 1 && (
          <section className={styles.section}>
            <h2>Расскажите о компании</h2>
            <p>Эта информация используется в профиле и документах.</p>
            <div className={styles.formGrid}>
              <label>
                Название компании <span className={styles.required}>*</span>
                <input
                  type="text"
                  value={companyInfo.name}
                  onChange={(e) => handleCompanyInfoChange('name', e.target.value)}
                  placeholder="Например, Digital School"
                  required
                />
              </label>
              <label>
                Страна
                <input
                  type="text"
                  value={companyInfo.country}
                  onChange={(e) => handleCompanyInfoChange('country', e.target.value)}
                  placeholder="Россия"
                />
              </label>
              <label>
                Город
                <input
                  type="text"
                  value={companyInfo.city}
                  onChange={(e) => handleCompanyInfoChange('city', e.target.value)}
                  placeholder="Москва"
                />
              </label>
              <label className={styles.fileInput}>
                Логотип
                <input type="file" accept="image/*" onChange={handleFileChange} />
                {companyInfo.logo && (
                  <div className={styles.logoPreview}>
                    <img src={companyInfo.logo} alt="Logo preview" />
                  </div>
                )}
              </label>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className={styles.section}>
            <h2>Выберите нишу</h2>
            <p>Мы настроим интерфейс и модули под ваш сценарий.</p>
            <div className={styles.nicheGrid}>
              {niches.map((niche) => (
                <button
                  key={niche.id}
                  type="button"
                  onClick={() => handleNicheSelect(niche.id)}
                  className={`${styles.nicheCard} ${selectedNiche === niche.id ? styles.selected : ''}`}
                >
                  <span className={styles.nicheIcon}>{niche.icon}</span>
                  <span>{niche.title}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 3 && (
          <section className={styles.section}>
            <h2>Включите нужные модули</h2>
            <p>Вы всегда сможете изменить это в настройках.</p>
            <div className={styles.moduleList}>
              {moduleOptions.map((module) => {
                const isActive = modules.includes(module.id);
                return (
                  <label
                    key={module.id}
                    className={`${styles.moduleItem} ${isActive ? styles.moduleItemActive : ''}`}
                  >
                    <span className={styles.moduleLabel}>{module.label}</span>
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={() => toggleModule(module.id)}
                    />
                    <span className={styles.toggleSwitch}></span>
                  </label>
                );
              })}
            </div>
          </section>
        )}

        <div className={styles.footer}>
          <button type="button" onClick={handleBack} disabled={step === 1 || loading}>
            Назад
          </button>
          {step < 3 ? (
            <button type="button" onClick={handleNext} disabled={loading}>
              Далее
            </button>
          ) : (
            <button
              type="button"
              className={styles.primary}
              onClick={handleFinish}
              disabled={loading}
            >
              {loading ? 'Сохранение...' : 'Завершить и перейти в CRM'}
            </button>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default OnboardingWizard;
