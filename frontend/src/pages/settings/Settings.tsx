import React from 'react';
import AppLayout from '../../layouts/AppLayout';
import styles from './Settings.module.css';

const Settings: React.FC = () => {
  return (
    <AppLayout breadcrumbs={['Настройки']}>
      <div className={styles.settings}>
        <h1>Настройки компании</h1>
        <div className={styles.placeholder}>
          <p>🚧 Раздел в разработке</p>
          <p>Здесь будут настройки компании, модулей, статусов лидов и т.д.</p>
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
