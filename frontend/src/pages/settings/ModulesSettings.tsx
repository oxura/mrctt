import React, { useState, useEffect } from 'react';
import { Button, useToast } from '../../components/ui';
import Toggle from '../../components/ui/Toggle';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';
import styles from './ModulesSettings.module.css';

interface Module {
  key: string;
  label: string;
  description: string;
  icon: string;
}

const modules: Module[] = [
  {
    key: 'products',
    label: 'Продукты',
    description: 'Управление каталогом продуктов и услуг',
    icon: '🛒',
  },
  {
    key: 'groups',
    label: 'Группы / Потоки',
    description: 'Управление группами студентов или турами',
    icon: '👥',
  },
  {
    key: 'tasks',
    label: 'Задачи / Календарь',
    description: 'Планирование задач и напоминаний',
    icon: '🗓️',
  },
  {
    key: 'team',
    label: 'Команда',
    description: 'Управление пользователями и ролями',
    icon: '👨‍💼',
  },
];

const ModulesSettings: React.FC = () => {
  const { tenant, updateTenant } = useAuthStore();
  const { showToast } = useToast();

  const [activeModules, setActiveModules] = useState<Record<string, boolean>>({
    products: true,
    groups: false,
    tasks: true,
    team: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tenant?.settings?.modules) {
      setActiveModules({
        products: tenant.settings.modules.products ?? true,
        groups: tenant.settings.modules.groups ?? false,
        tasks: tenant.settings.modules.tasks ?? true,
        team: tenant.settings.modules.team ?? true,
      });
    }
  }, [tenant]);

  const handleToggle = (key: string, value: boolean) => {
    setActiveModules((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      const response = await api.put('/api/v1/tenants/current/settings', {
        modules: activeModules,
      });

      if (response.data?.data?.tenant) {
        updateTenant(response.data.data.tenant);
        showToast('Настройки модулей успешно сохранены', 'success');
      }
    } catch (error) {
      console.error('Failed to save modules settings:', error);
      showToast('Не удалось сохранить настройки', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Модули системы</h2>
      <p className={styles.description}>
        Включите или выключите разделы, которые используете. Отключенные модули не отображаются в меню.
      </p>

      <div className={styles.modulesList}>
        {modules.map((module) => (
          <div key={module.key} className={styles.moduleItem}>
            <div className={styles.moduleInfo}>
              <div className={styles.moduleIcon}>{module.icon}</div>
              <div className={styles.moduleDetails}>
                <div className={styles.moduleLabel}>{module.label}</div>
                <div className={styles.moduleDescription}>{module.description}</div>
              </div>
            </div>
            <Toggle
              checked={activeModules[module.key] || false}
              onChange={(checked) => handleToggle(module.key, checked)}
            />
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Сохранение...' : 'Сохранить изменения'}
        </Button>
      </div>
    </div>
  );
};

export default ModulesSettings;
