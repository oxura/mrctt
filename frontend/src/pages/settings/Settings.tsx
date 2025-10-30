import React, { useState } from 'react';
import AppLayout from '../../layouts/AppLayout';
import { Tabs, Card } from '../../components/ui';
import styles from './Settings.module.css';
import GeneralSettings from './GeneralSettings';
import ModulesSettings from './ModulesSettings';
import LeadStatusesSettings from './LeadStatusesSettings';

const tabs = [
  { key: 'general', label: 'Общие', icon: '⚙️' },
  { key: 'modules', label: 'Модули', icon: '🧩' },
  { key: 'lead-statuses', label: 'Статусы лидов', icon: '🎯' },
];

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <AppLayout breadcrumbs={['Настройки']}>
      <div className={styles.settings}>
        <div className={styles.header}>
          <h1>Настройки компании</h1>
          <p className={styles.subtitle}>Управление настройками вашей компании</p>
        </div>

        <Card>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          <div className={styles.tabContent}>
            {activeTab === 'general' && <GeneralSettings />}
            {activeTab === 'modules' && <ModulesSettings />}
            {activeTab === 'lead-statuses' && <LeadStatusesSettings />}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Settings;
