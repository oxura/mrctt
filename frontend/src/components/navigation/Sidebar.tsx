import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import styles from './Sidebar.module.css';

const menuItems = [
  { path: '/dashboard', label: 'Главная', icon: '🏠' },
  { path: '/leads', label: 'Лиды', icon: '📋' },
  { path: '/products', label: 'Продукты', icon: '🛒' },
  { path: '/groups', label: 'Группы', icon: '👥' },
  { path: '/forms', label: 'Формы', icon: '📝' },
  { path: '/tasks', label: 'Задачи', icon: '🗓️' },
  { path: '/team', label: 'Команда', icon: '👨‍💼' },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onMobileClose }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { tenant, clear } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    clear();
    navigate('/login');
    if (onMobileClose) onMobileClose();
  };

  const handleNavClick = () => {
    if (onMobileClose) onMobileClose();
  };

  return (
    <>
      {mobileOpen && <div className={styles.overlay} onClick={onMobileClose} />}
      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''} ${mobileOpen ? styles.mobileOpen : ''}`}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🌿</span>
            {!collapsed && <span className={styles.logoText}>{tenant?.name || 'Экосистема'}</span>}
          </div>
          <button 
            className={styles.toggleButton} 
            onClick={() => setCollapsed((prev) => !prev)}
            title={collapsed ? 'Развернуть' : 'Свернуть'}
          >
            {collapsed ? '»' : '«'}
          </button>
        </div>

        <nav className={styles.nav}>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <span className={styles.icon}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className={styles.footer}>
          <NavLink 
            to="/settings" 
            className={styles.footerItem}
            onClick={handleNavClick}
            title={collapsed ? 'Настройки' : undefined}
          >
            <span className={styles.icon}>⚙️</span>
            {!collapsed && <span>Настройки</span>}
          </NavLink>
          <NavLink 
            to="/profile" 
            className={styles.footerItem}
            onClick={handleNavClick}
            title={collapsed ? 'Профиль' : undefined}
          >
            <span className={styles.icon}>👤</span>
            {!collapsed && <span>Профиль</span>}
          </NavLink>
          <button 
            className={styles.logoutButton} 
            onClick={handleLogout}
            title={collapsed ? 'Выйти' : undefined}
          >
            <span className={styles.icon}>🚪</span>
            {!collapsed && <span>Выйти</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
