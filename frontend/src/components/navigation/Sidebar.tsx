import React, { useState, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import type { TenantSettingsModules } from '../../types';
import styles from './Sidebar.module.css';

interface MenuItem {
  path: string;
  label: string;
  icon: string;
  moduleKey?: keyof TenantSettingsModules;
}

const allMenuItems: MenuItem[] = [
  { path: '/dashboard', label: 'Главная', icon: '🏠' },
  { path: '/leads', label: 'Лиды', icon: '📋' },
  { path: '/products', label: 'Продукты', icon: '🛒', moduleKey: 'products' },
  { path: '/groups', label: 'Группы', icon: '👥', moduleKey: 'groups' },
  { path: '/forms', label: 'Формы', icon: '📝' },
  { path: '/tasks', label: 'Задачи', icon: '🗓️', moduleKey: 'tasks' },
  { path: '/team', label: 'Команда', icon: '👨‍💼', moduleKey: 'team' },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onMobileClose }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { tenant, clear } = useAuthStore();
  const navigate = useNavigate();

  const menuItems = useMemo(() => {
    const modules = tenant?.settings?.modules as TenantSettingsModules | undefined;
    
    if (!modules || typeof modules !== 'object') {
      return allMenuItems;
    }

    return allMenuItems.filter((item) => {
      if (!item.moduleKey) return true;
      return modules[item.moduleKey] === true;
    });
  }, [tenant?.settings?.modules]);

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
      {mobileOpen && <div className={styles.overlay} onClick={onMobileClose} aria-hidden="true" />}
      <aside 
        className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''} ${mobileOpen ? styles.mobileOpen : ''}`}
        aria-label="Основная навигация"
      >
        <div className={styles.header}>
          <div className={styles.logo} role="banner">
            <span className={styles.logoIcon} aria-hidden="true">🌿</span>
            {!collapsed && <span className={styles.logoText}>{tenant?.name || 'Экосистема'}</span>}
          </div>
          <button 
            type="button"
            className={styles.toggleButton} 
            onClick={() => setCollapsed((prev) => !prev)}
            title={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
            aria-label={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
            aria-expanded={!collapsed}
          >
            {collapsed ? '»' : '«'}
          </button>
        </div>

        <nav className={styles.nav} aria-label="Основное меню">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
              title={collapsed ? item.label : undefined}
              aria-label={collapsed ? item.label : undefined}
            >
              <span className={styles.icon} aria-hidden="true">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className={styles.footer} role="navigation" aria-label="Дополнительное меню">
          <NavLink 
            to="/settings" 
            className={styles.footerItem}
            onClick={handleNavClick}
            title={collapsed ? 'Настройки' : undefined}
            aria-label="Настройки"
          >
            <span className={styles.icon} aria-hidden="true">⚙️</span>
            {!collapsed && <span>Настройки</span>}
          </NavLink>
          <NavLink 
            to="/profile" 
            className={styles.footerItem}
            onClick={handleNavClick}
            title={collapsed ? 'Профиль' : undefined}
            aria-label="Профиль"
          >
            <span className={styles.icon} aria-hidden="true">👤</span>
            {!collapsed && <span>Профиль</span>}
          </NavLink>
          <button 
            type="button"
            className={styles.logoutButton} 
            onClick={handleLogout}
            title={collapsed ? 'Выйти' : undefined}
            aria-label="Выйти из системы"
          >
            <span className={styles.icon} aria-hidden="true">🚪</span>
            {!collapsed && <span>Выйти</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
