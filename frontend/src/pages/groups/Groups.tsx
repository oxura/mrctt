import React from 'react';
import AppLayout from '../../layouts/AppLayout';
import styles from '../products/Products.module.css';

const Groups: React.FC = () => {
  return (
    <AppLayout breadcrumbs={['Группы']}>
      <div className={styles.products}>
        <div className={styles.header}>
          <h1>Группы и Потоки</h1>
          <button className={styles.addButton}>+ Создать группу</button>
        </div>
        <div className={styles.placeholder}>
          <p>🚧 Раздел в разработке</p>
          <p>Здесь будут группы/потоки для курсов или туров с лимитами мест.</p>
        </div>
      </div>
    </AppLayout>
  );
};

export default Groups;
