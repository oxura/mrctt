import React from 'react';
import styles from './Topbar.module.css';
import { useAuthStore } from '../../store/authStore';

interface TopbarProps {
  breadcrumbs?: string[];
}

const Topbar: React.FC<TopbarProps> = ({ breadcrumbs = [] }) => {
  const { user } = useAuthStore();

  return (
    <header className={styles.topbar}>
      <div className={styles.leftSection}>
        <nav className={styles.breadcrumbs}>
          <span>Главная</span>
          {breadcrumbs.map((crumb) => (
            <React.Fragment key={crumb}>
              <span className={styles.separator}>/</span>
              <span>{crumb}</span>
            </React.Fragment>
          ))}
        </nav>
        <div className={styles.searchContainer}>
          <span className={styles.searchIcon}>🔍</span>
          <input type="text" placeholder="Поиск по лидам, телефонам..." />
        </div>
      </div>

      <div className={styles.rightSection}>
        <button className={styles.iconButton} title="Уведомления">
          🔔
        </button>
        <div className={styles.userProfile}>
          <div className={styles.avatar}>{user?.first_name?.[0] || user?.email[0]}</div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.first_name || user?.email}</span>
            <span className={styles.userRole}>{user?.role}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
