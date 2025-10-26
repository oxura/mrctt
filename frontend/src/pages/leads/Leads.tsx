import React from 'react';
import AppLayout from '../../layouts/AppLayout';
import styles from './Leads.module.css';

const Leads: React.FC = () => {
  return (
    <AppLayout breadcrumbs={['Лиды']}>
      <div className={styles.leads}>
        <div className={styles.header}>
          <h1>CRM Pipeline / Лиды</h1>
          <button className={styles.addButton}>+ Добавить лид</button>
        </div>
        <div className={styles.placeholder}>
          <p>🚧 Раздел в разработке</p>
          <p>Здесь будет таблица и канбан-доска с лидами/сделками.</p>
        </div>
      </div>
    </AppLayout>
  );
};

export default Leads;
