import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import styles from './Sidebar.module.css';

const menuItems = [
  { path: '/dashboard', label: 'Главная', icon: '🏠' },
  { path: '/leads', label: 'Лиды', icon: '📋' },
  { path: '/products', label: 'Продукты', icon: '🛒' },
  { path: '/team', label: 'Команда', icon: '👥' },
  { path: '/tasks', label: 'Задачи', icon: '🗓️' },
];

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { tenant, user, clear } = useAuthStore();

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🌿</span>
          {!collapsed && <span className={styles.logoText}>{tenant?.name || 'Экосистема'}</span>}
        </div>
        <button className={styles.toggleButton} onClick={() => setCollapsed((prev) => !prev)}>
          {collapsed ? '»' : '«'}
        </button>
      </div>

      <nav className={styles.nav}>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
          >
            <span className={styles.icon}>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className={styles.footer}>
        {!collapsed && (
          <div className={styles.userInfo}>
            <span className={styles.avatar}>{user?.first_name?.[0] || user?.email[0]}</span>
            <div>
              <div className={styles.name}>{user?.first_name || user?.email}</div>
              <div className={styles.role}>{user?.role}</div>
            </div>
          </div>
        )}
        <button className={styles.logoutButton} onClick={clear}>
          {collapsed ? '⏻' : 'Выйти'}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
