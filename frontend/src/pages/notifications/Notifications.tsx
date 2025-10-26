import React from 'react';
import AppLayout from '../../layouts/AppLayout';
import styles from './Notifications.module.css';

const Notifications: React.FC = () => {
  const notifications = [
    {
      id: 'n1',
      title: 'Новый лид',
      message: 'Заявка с формы «Дизайн-2024»',
      time: '5 минут назад',
    },
    {
      id: 'n2',
      title: 'Просроченная задача',
      message: 'Перезвонить Марии по предложению «Курс UX»',
      time: '30 минут назад',
    },
    {
      id: 'n3',
      title: 'Оплата получена',
      message: 'Счет №457 оплачен и закрыт',
      time: '1 час назад',
    },
  ];

  return (
    <AppLayout breadcrumbs={['Уведомления']}>
      <div className={styles.notifications}>
        <h1>Уведомления</h1>
        <div className={styles.list}>
          {notifications.map((item) => (
            <div key={item.id} className={styles.card}>
              <div className={styles.icon}>🔔</div>
              <div className={styles.content}>
                <div className={styles.header}>
                  <h3>{item.title}</h3>
                  <span>{item.time}</span>
                </div>
                <p>{item.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Notifications;
