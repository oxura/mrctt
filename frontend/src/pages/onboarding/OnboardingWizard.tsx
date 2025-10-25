import React, { useState } from 'react';
import AppLayout from '../../layouts/AppLayout';
import styles from './OnboardingWizard.module.css';
import { useNavigate } from 'react-router-dom';

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
    location: '',
  });
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [modules, setModules] = useState<string[]>(['products', 'tasks']);
  const navigate = useNavigate();

  const handleNext = () => setStep((prev) => Math.min(prev + 1, 3));
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleFinish = () => {
    // Normally would call API to persist onboarding selections
    navigate('/dashboard');
  };

  const handleNicheSelect = (niche: string) => {
    setSelectedNiche(niche);
    setModules(modulePresets[niche] || ['products', 'tasks']);
  };

  const toggleModule = (moduleId: string) => {
    setModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((item) => item !== moduleId)
        : [...prev, moduleId]
    );
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

        {step === 1 && (
          <section className={styles.section}>
            <h2>Расскажите о компании</h2>
            <p>Эта информация используется в профиле и документах.</p>
            <div className={styles.formGrid}>
              <label>
                Название компании
                <input
                  type="text"
                  value={companyInfo.name}
                  onChange={(e) => setCompanyInfo((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Например, Digital School"
                />
              </label>
              <label>
                Город / Страна
                <input
                  type="text"
                  value={companyInfo.location}
                  onChange={(e) => setCompanyInfo((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="Москва, Россия"
                />
              </label>
              <label className={styles.fileInput}>
                Логотип
                <input type="file" accept="image/*" onChange={() => setCompanyInfo((prev) => ({ ...prev, logo: 'uploaded' }))} />
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
          <button type="button" onClick={handleBack} disabled={step === 1}>
            Назад
          </button>
          {step < 3 ? (
            <button type="button" onClick={handleNext}>
              Далее
            </button>
          ) : (
            <button type="button" className={styles.primary} onClick={handleFinish}>
              Завершить и перейти в CRM
            </button>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default OnboardingWizard;
