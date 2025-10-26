import React from 'react';
import AppLayout from '../../layouts/AppLayout';
import { useAuthStore } from '../../store/authStore';
import styles from './Profile.module.css';

const Profile: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <AppLayout breadcrumbs={['Профиль']}>
      <div className={styles.profile}>
        <h1>Мой профиль</h1>
        <div className={styles.card}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {user?.first_name?.[0]?.toUpperCase() || user?.email[0]?.toUpperCase()}
            </div>
            <div>
              <h2>{user?.first_name || 'Пользователь'}</h2>
              <p>{user?.email}</p>
              <p className={styles.role}>{user?.role}</p>
            </div>
          </div>
          <div className={styles.placeholder}>
            <p>🚧 Раздел в разработке</p>
            <p>Здесь будет возможность редактировать профиль, изменять пароль и настройки.</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;
