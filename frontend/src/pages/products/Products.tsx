import React from 'react';
import AppLayout from '../../layouts/AppLayout';
import styles from './Products.module.css';

const Products: React.FC = () => {
  return (
    <AppLayout breadcrumbs={['Продукты']}>
      <div className={styles.products}>
        <div className={styles.header}>
          <h1>Продукты и Услуги</h1>
          <button className={styles.addButton}>+ Добавить продукт</button>
        </div>
        <div className={styles.placeholder}>
          <p>🚧 Раздел в разработке</p>
          <p>Здесь будет каталог продуктов/услуг вашей компании.</p>
        </div>
      </div>
    </AppLayout>
  );
};

export default Products;
