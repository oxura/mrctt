import React from 'react';
import AppLayout from '../../layouts/AppLayout';
import styles from './Forms.module.css';

const Forms: React.FC = () => {
  return (
    <AppLayout breadcrumbs={['Формы']}>
      <div className={styles.forms}>
        <div className={styles.header}>
          <h1>Конструктор анкет</h1>
          <button className={styles.addButton}>+ Новая форма</button>
        </div>
        <div className={styles.placeholder}>
          <p>🚧 Раздел в разработке</p>
          <p>Здесь будет конструктор для создания форм заявок и настройка интеграций.</p>
        </div>
      </div>
    </AppLayout>
  );
};

export default Forms;
