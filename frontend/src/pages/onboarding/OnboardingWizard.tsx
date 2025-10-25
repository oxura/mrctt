import React, { useState } from 'react';
import AppLayout from '../../layouts/AppLayout';
import styles from './OnboardingWizard.module.css';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const niches = [
  { id: 'courses', title: 'Онлайн-школа / Курсы', icon: '🎓' },
  { id: 'services', title: 'Услуги / Freelance', icon: '🛠️' },
  { id: 'medicine', title: 'Медицина / Клиника', icon: '🏥' },
  { id: 'tourism', title: 'Туризм', icon: '✈️' },
  { id: 'other', title: 'Другое', icon: '✨' },
];

const modulePresets: Record<string, string[]> = {
  courses: ['products', 'groups', 'tasks', 'team'],
  services: ['products', 'tasks', 'team'],
  medicine: ['products', 'tasks', 'team'],
  tourism: ['products', 'groups', 'tasks', 'team'],
  other: ['products', 'tasks'],
};

const moduleOptions = [
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
  const [modules, setModules] = useState<string[]>(['products', 'tasks']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleNext = () => {
    if (step === 1) {
      if (!companyInfo.name) {
        setError('Название компании обязательно');
        return;
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
    setLoading(true);
    setError(null);

    try {
      await api.patch('/api/v1/tenants/current/onboarding', {
        name: companyInfo.name || undefined,
        logo_url: companyInfo.logo || null,
        country: companyInfo.country || undefined,
        city: companyInfo.city || undefined,
        industry: selectedNiche || undefined,
        modules,
      });

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
    setModules(modulePresets[niche] || ['products', 'tasks']);
    setError(null);
  };

  const toggleModule = (moduleId: string) => {
    setModules((prev) =>
      prev.includes(moduleId) ? prev.filter((item) => item !== moduleId) : [...prev, moduleId]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
              {moduleOptions.map((module) => (
                <label key={module.id} className={styles.moduleItem}>
                  <input
                    type="checkbox"
                    checked={modules.includes(module.id)}
                    onChange={() => toggleModule(module.id)}
                  />
                  <span>{module.label}</span>
                </label>
              ))}
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
