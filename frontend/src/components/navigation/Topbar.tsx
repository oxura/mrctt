import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Topbar.module.css';
import { useAuthStore } from '../../store/authStore';
import { searchLeads } from '../../data/globalSearchData';
import { useClickOutside } from '../../hooks/useClickOutside';

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
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLFormElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  const hasSearchResults = searchResults.length > 0;

  const closeNotifications = useCallback(() => setShowNotifications(false), []);
  const closeUserMenu = useCallback(() => setShowUserMenu(false), []);
  const closeSearchResults = useCallback(() => setShowSearchResults(false), []);
  const closeMobileSearch = useCallback(() => {
    setShowMobileSearch(false);
    setShowSearchResults(false);
  }, []);

  const closeAllMenus = useCallback(() => {
    closeSearchResults();
    closeNotifications();
    closeUserMenu();
    closeMobileSearch();
  }, [closeNotifications, closeMobileSearch, closeUserMenu, closeSearchResults]);

  useClickOutside(notificationsRef, closeNotifications, showNotifications);
  useClickOutside(userMenuRef, closeUserMenu, showUserMenu);
  useClickOutside(searchRef, closeSearchResults, showSearchResults);
  useClickOutside(mobileSearchRef, closeMobileSearch, showMobileSearch);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeAllMenus();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [closeAllMenus]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
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
        if (results.length > 0) {
          closeNotifications();
          closeUserMenu();
        }
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, closeNotifications, closeUserMenu]);

  const handleSearchFocus = useCallback(() => {
    if (hasSearchResults) {
      setShowSearchResults(true);
    }
    closeNotifications();
    closeUserMenu();
  }, [hasSearchResults, closeNotifications, closeUserMenu]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/leads?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setShowSearchResults(false);
      if (showMobileSearch) {
        closeMobileSearch();
      }
    }
  };

  const handleSearchResultSelect = (leadId: string) => {
    navigate(`/leads?lead=${encodeURIComponent(leadId)}`);
    setSearchQuery('');
    setShowSearchResults(false);
    if (showMobileSearch) {
      closeMobileSearch();
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
        <button 
          className={styles.mobileMenuButton} 
          onClick={onMenuClick} 
          title="Меню"
          aria-label="Открыть меню навигации"
        >
          ☰
        </button>
        <nav className={styles.breadcrumbs} aria-label="Хлебные крошки">
          <span>Главная</span>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              <span className={styles.separator} aria-hidden="true">/</span>
              <span>{crumb}</span>
            </React.Fragment>
          ))}
        </nav>
        <form 
          className={styles.searchWrapper} 
          onSubmit={handleSearch} 
          ref={searchRef}
          role="search"
        >
          <div className={styles.searchContainer}>
            <span className={styles.searchIcon} aria-hidden="true">🔍</span>
            <input 
              type="text" 
              placeholder="Поиск по лидам, телефонам..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleSearchFocus}
              aria-label="Глобальный поиск по лидам и телефонам"
              aria-autocomplete="list"
              aria-controls={showSearchResults ? 'search-results' : undefined}
              aria-expanded={showSearchResults}
            />
            {searchQuery && (
              <button 
                type="button" 
                className={styles.clearButton}
                onClick={() => setSearchQuery('')}
                aria-label="Очистить поиск"
              >
                ✕
              </button>
            )}
          </div>

          {showSearchResults && (
            <div 
              className={styles.searchDropdown}
              id="search-results"
              role="listbox"
              aria-label="Результаты поиска"
            >
              {searchResults.length === 0 ? (
                <div className={styles.emptyState} role="status" aria-live="polite">Ничего не найдено</div>
              ) : (
                <>
                  <div className={styles.searchHeader}>
                    <span>Лиды</span>
                    <button type="submit">Открыть все</button>
                  </div>
                  <ul className={styles.searchResults} role="presentation">
                    {searchResults.map((result) => (
                      <li
                        key={result.id}
                        className={styles.searchResult}
                        onClick={() => handleSearchResultSelect(result.id)}
                        role="option"
                        aria-selected="false"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSearchResultSelect(result.id);
                          }
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
                        {result.product && (
                          <div className={styles.resultProduct}>{result.product}</div>
                        )}
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
        <button 
          type="button"
          className={styles.mobileSearchButton} 
          onClick={() => {
            setShowMobileSearch((prev) => {
              const next = !prev;
              if (next) {
                closeNotifications();
                closeUserMenu();
                requestAnimationFrame(() => mobileSearchInputRef.current?.focus());
              }
              return next;
            });
          }}
          title="Поиск"
          aria-label="Открыть поиск"
          aria-expanded={showMobileSearch}
          aria-haspopup="dialog"
        >
          🔍
        </button>

        <div className={styles.notificationsWrapper} ref={notificationsRef}>
          <button 
            type="button"
            className={styles.iconButton} 
            onClick={() => {
              setShowNotifications((prev) => {
                const next = !prev;
                if (next) {
                  closeSearchResults();
                  closeUserMenu();
                }
                return next;
              });
            }}
            title="Уведомления"
            aria-label={`Уведомления${unreadCount > 0 ? ` (${unreadCount} непрочитанных)` : ''}`}
            aria-expanded={showNotifications}
            aria-haspopup="true"
          >
            🔔
            {unreadCount > 0 && <span className={styles.badge} aria-label={`${unreadCount} непрочитанных`}>{unreadCount}</span>}
          </button>
          {showNotifications && (
            <div className={styles.dropdown} role="menu" aria-label="Уведомления">
              <div className={styles.dropdownHeader}>
                <h3>Уведомления</h3>
                <button type="button" className={styles.markAllRead}>Прочитать все</button>
              </div>
              <div className={styles.notificationsList}>
                {notifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`${styles.notificationItem} ${notification.unread ? styles.unread : ''}`}
                    role="menuitem"
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
                <button type="button" onClick={() => navigate('/notifications')}>Все уведомления</button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.userMenuWrapper} ref={userMenuRef}>
          <button 
            type="button"
            className={styles.userProfile} 
            onClick={() => {
              setShowUserMenu((prev) => {
                const next = !prev;
                if (next) {
                  closeSearchResults();
                  closeNotifications();
                }
                return next;
              });
            }}
            aria-haspopup="true"
            aria-expanded={showUserMenu}
            title="Меню пользователя"
          >
            <span className={styles.avatar}>
              {user?.first_name?.[0]?.toUpperCase() || user?.email[0]?.toUpperCase()}
            </span>
            <span className={styles.userInfo}>
              <span className={styles.userName}>{user?.first_name || user?.email}</span>
              <span className={styles.userRole}>{user?.role}</span>
            </span>
            <span className={styles.chevron} aria-hidden="true">{showUserMenu ? '▲' : '▼'}</span>
          </button>
          {showUserMenu && (
            <div className={styles.dropdown} role="menu" aria-label="Меню пользователя">
              <div className={styles.userMenuHeader}>
                <span className={styles.avatar}>
                  {user?.first_name?.[0]?.toUpperCase() || user?.email[0]?.toUpperCase()}
                </span>
                <div>
                  <div className={styles.menuUserName}>{user?.first_name || user?.email}</div>
                  <div className={styles.menuUserEmail}>{user?.email}</div>
                </div>
              </div>
              <div className={styles.menuDivider}></div>
              <button type="button" className={styles.menuItem} onClick={() => { navigate('/profile'); setShowUserMenu(false); }}>
                <span>👤</span> Профиль
              </button>
              <button type="button" className={styles.menuItem} onClick={() => { navigate('/settings'); setShowUserMenu(false); }}>
                <span>⚙️</span> Настройки
              </button>
              <div className={styles.menuDivider}></div>
              <button type="button" className={`${styles.menuItem} ${styles.logoutItem}`} onClick={handleLogout}>
                <span>🚪</span> Выйти
              </button>
            </div>
          )}
        </div>
      </div>

      {showMobileSearch && (
        <div className={styles.mobileSearchOverlay} role="dialog" aria-label="Мобильный поиск">
          <div className={styles.mobileSearchModal} ref={mobileSearchRef}>
            <div className={styles.mobileSearchHeader}>
              <span className={styles.searchIcon} aria-hidden="true">🔍</span>
              <input 
                ref={mobileSearchInputRef}
                type="text" 
                placeholder="Поиск по лидам, телефонам..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={handleSearchFocus}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    navigate(`/leads?search=${encodeURIComponent(searchQuery)}`);
                    setSearchQuery('');
                    closeMobileSearch();
                  }
                }}
                className={styles.mobileSearchInput}
                aria-label="Глобальный поиск"
              />
              <button 
                type="button" 
                className={styles.closeMobileSearch}
                onClick={closeMobileSearch}
                aria-label="Закрыть поиск"
              >
                ✕
              </button>
            </div>

            {searchResults.length > 0 ? (
              <div className={styles.mobileSearchResults}>
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className={styles.mobileSearchResult}
                    onClick={() => {
                      navigate(`/leads?lead=${encodeURIComponent(result.id)}`);
                      setSearchQuery('');
                      closeMobileSearch();
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/leads?lead=${encodeURIComponent(result.id)}`);
                        setSearchQuery('');
                        closeMobileSearch();
                      }
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
                    {result.product && (
                      <div className={styles.resultProduct}>{result.product}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : searchQuery.trim().length > 0 ? (
              <div className={styles.mobileSearchEmpty}>
                Ничего не найдено
              </div>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
};

export default Topbar;
