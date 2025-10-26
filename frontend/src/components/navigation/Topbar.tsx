import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Topbar.module.css';
import { useAuthStore } from '../../store/authStore';
import { searchLeads } from '../../data/globalSearchData';

interface TopbarProps {
  breadcrumbs?: string[];
  onMenuClick?: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ breadcrumbs = [], onMenuClick }) => {
  const { user, clear } = useAuthStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof searchLeads>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      const results = searchLeads.filter(
        (lead) =>
          lead.name.toLowerCase().includes(query) ||
          lead.phone.includes(query) ||
          lead.id.toLowerCase().includes(query)
      );
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/leads?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setShowSearchResults(false);
    }
  };

  const handleLogout = () => {
    clear();
    navigate('/login');
  };

  const notifications = [
    { id: 1, title: 'Новый лид', message: 'Заявка с формы "Дизайн-2024"', time: '5 мин назад', unread: true },
    { id: 2, title: 'Просроченная задача', message: 'Перезвонить Марии', time: '30 мин назад', unread: true },
    { id: 3, title: 'Оплата получена', message: 'Счет №457 оплачен', time: '1 час назад', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className={styles.topbar}>
      <div className={styles.leftSection}>
        <button className={styles.mobileMenuButton} onClick={onMenuClick} title="Меню">
          ☰
        </button>
        <nav className={styles.breadcrumbs}>
          <span>Главная</span>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              <span className={styles.separator}>/</span>
              <span>{crumb}</span>
            </React.Fragment>
          ))}
        </nav>
        <form className={styles.searchWrapper} onSubmit={handleSearch} ref={searchRef}>
          <div className={styles.searchContainer}>
            <span className={styles.searchIcon}>🔍</span>
            <input 
              type="text" 
              placeholder="Поиск по лидам, телефонам..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length && setShowSearchResults(true)}
            />
            {searchQuery && (
              <button 
                type="button" 
                className={styles.clearButton}
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            )}
          </div>

          {showSearchResults && (
            <div className={styles.searchDropdown}>
              {searchResults.length === 0 ? (
                <div className={styles.emptyState}>Ничего не найдено</div>
              ) : (
                <>
                  <div className={styles.searchHeader}>
                    <span>Лиды</span>
                    <button type="submit">Открыть все</button>
                  </div>
                  <ul className={styles.searchResults}>
                    {searchResults.map((result) => (
                      <li
                        key={result.id}
                        className={styles.searchResult}
                        onClick={() => {
                          navigate(`/leads?lead=${encodeURIComponent(result.id)}`);
                          setSearchQuery('');
                          setShowSearchResults(false);
                        }}
                      >
                        <div className={styles.resultMain}>
                          <span className={styles.resultName}>{result.name}</span>
                          <span className={styles.resultPhone}>{result.phone}</span>
                        </div>
                        <div className={styles.resultMeta}>
                          <span className={styles.resultStatus}>{result.status}</span>
                          <span className={styles.resultManager}>{result.manager}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </form>
      </div>

      <div className={styles.rightSection}>
        <div className={styles.notificationsWrapper} ref={notificationsRef}>
          <button 
            className={styles.iconButton} 
            onClick={() => setShowNotifications(!showNotifications)}
            title="Уведомления"
          >
            🔔
            {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
          </button>
          {showNotifications && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <h3>Уведомления</h3>
                <button className={styles.markAllRead}>Прочитать все</button>
              </div>
              <div className={styles.notificationsList}>
                {notifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`${styles.notificationItem} ${notification.unread ? styles.unread : ''}`}
                  >
                    <div className={styles.notificationContent}>
                      <div className={styles.notificationTitle}>{notification.title}</div>
                      <div className={styles.notificationMessage}>{notification.message}</div>
                      <div className={styles.notificationTime}>{notification.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.dropdownFooter}>
                <button onClick={() => navigate('/notifications')}>Все уведомления</button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.userMenuWrapper} ref={userMenuRef}>
          <div 
            className={styles.userProfile} 
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className={styles.avatar}>
              {user?.first_name?.[0]?.toUpperCase() || user?.email[0]?.toUpperCase()}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.first_name || user?.email}</span>
              <span className={styles.userRole}>{user?.role}</span>
            </div>
            <span className={styles.chevron}>{showUserMenu ? '▲' : '▼'}</span>
          </div>
          {showUserMenu && (
            <div className={styles.dropdown}>
              <div className={styles.userMenuHeader}>
                <div className={styles.avatar}>
                  {user?.first_name?.[0]?.toUpperCase() || user?.email[0]?.toUpperCase()}
                </div>
                <div>
                  <div className={styles.menuUserName}>{user?.first_name || user?.email}</div>
                  <div className={styles.menuUserEmail}>{user?.email}</div>
                </div>
              </div>
              <div className={styles.menuDivider}></div>
              <button className={styles.menuItem} onClick={() => { navigate('/profile'); setShowUserMenu(false); }}>
                <span>👤</span> Профиль
              </button>
              <button className={styles.menuItem} onClick={() => { navigate('/settings'); setShowUserMenu(false); }}>
                <span>⚙️</span> Настройки
              </button>
              <div className={styles.menuDivider}></div>
              <button className={`${styles.menuItem} ${styles.logoutItem}`} onClick={handleLogout}>
                <span>🚪</span> Выйти
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
