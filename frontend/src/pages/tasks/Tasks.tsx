import React from 'react';
import AppLayout from '../../layouts/AppLayout';
import styles from './Tasks.module.css';

const Tasks: React.FC = () => {
  return (
    <AppLayout breadcrumbs={['Задачи']}>
      <div className={styles.tasks}>
        <div className={styles.header}>
          <h1>Календарь и Задачи</h1>
          <div className={styles.actions}>
            <button className={styles.viewButton}>Сетка</button>
            <button className={styles.viewButton}>Список</button>
            <button className={styles.addButton}>+ Новая задача</button>
          </div>
        </div>
        <div className={styles.placeholder}>
          <p>🚧 Раздел в разработке</p>
          <p>Здесь появится календарь задач и планировщик для работы с лидами.</p>
        </div>
      </div>
    </AppLayout>
  );
};

export default Tasks;
