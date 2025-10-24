import { Fragment, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  UserGroupIcon,
  ShoppingBagIcon,
  CalendarIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon,
  BellIcon,
  ChevronLeftIcon,
  ArrowRightOnRectangleIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { Role, ModuleKey } from '../../types';

interface NavItem {
  name: string;
  path: string;
  icon: typeof HomeIcon;
  moduleKey?: ModuleKey;
  roles?: Role[];
}

const navItems: NavItem[] = [
  { name: 'Главная', path: '/', icon: HomeIcon, moduleKey: 'dashboard' },
  { name: 'Лиды', path: '/leads', icon: UserGroupIcon, moduleKey: 'leads' },
  { name: 'Продукты', path: '/products', icon: ShoppingBagIcon, moduleKey: 'products', roles: ['owner', 'admin'] },
  { name: 'Календарь', path: '/calendar', icon: CalendarIcon, moduleKey: 'calendar' },
  { name: 'Команда', path: '/team', icon: UsersIcon, moduleKey: 'team', roles: ['owner', 'admin'] },
  { name: 'Анкеты', path: '/forms', icon: ClipboardDocumentListIcon, moduleKey: 'forms', roles: ['owner', 'admin'] },
  { name: 'SaaS Дашборд', path: '/superadmin', icon: BuildingOfficeIcon, roles: ['superadmin'] },
];

const bottomNavItems: NavItem[] = [
  { name: 'Настройки', path: '/settings', icon: Cog6ToothIcon, moduleKey: 'settings', roles: ['owner', 'admin'] },
  { name: 'Биллинг', path: '/billing', icon: CreditCardIcon, moduleKey: 'billing', roles: ['owner'] },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { company } = useAppStore();

  const isSuperAdmin = user?.role === 'superadmin';
  const allModuleKeys: ModuleKey[] = ['dashboard', 'leads', 'kanban', 'products', 'groups', 'calendar', 'team', 'forms', 'settings', 'billing'];

  const enabledModules: ModuleKey[] = isSuperAdmin
    ? allModuleKeys
    : company?.modules
        .filter((mod) => mod.enabled)
        .map((mod) => mod.key) || [];

  const visibleNavItems = navItems.filter((item) => {
    if (item.moduleKey && !enabledModules.includes(item.moduleKey)) {
      return false;
    }
    if (item.roles && user && !item.roles.includes(user.role)) {
      return false;
    }
    return true;
  });

  const workspaceName = isSuperAdmin ? 'Панель SaaS' : company?.name || 'CRM';
  const workspaceInitial = workspaceName.charAt(0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/leads?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const breadcrumbs = location.pathname
    .split('/')
    .filter(Boolean)
    .map((segment) => ({
      name: segment.charAt(0).toUpperCase() + segment.slice(1),
      path: `/${segment}`,
    }));

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-xl transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b px-6">
            <Link to="/" className="flex items-center space-x-2">
              {company?.logoUrl && !isSuperAdmin ? (
                <img src={company.logoUrl} alt={company.name} className="h-8 w-8" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white font-bold">
                  {workspaceInitial}
                </div>
              )}
              <span className="text-lg font-semibold text-gray-900">
                {workspaceName}
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-4">
            <div className="space-y-1 px-3">
              {visibleNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="border-t">
            <div className="space-y-1 p-3">
              {bottomNavItems
                .filter((item) => {
                  if (item.moduleKey && !enabledModules.includes(item.moduleKey)) {
                    return false;
                  }
                  if (item.roles && user && !item.roles.includes(user.role)) {
                    return false;
                  }
                  return true;
                })
                .map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
            </div>
            <div className="border-t p-3">
              <div className="flex items-center space-x-3 rounded-lg px-3 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-medium text-sm">
                  {user?.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="mt-2 flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                <span>Выход</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b bg-white px-6 shadow-sm">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            <nav className="hidden md:flex items-center space-x-2 text-sm text-gray-500">
              <Link to="/" className="hover:text-gray-700">Главная</Link>
              {breadcrumbs.map((breadcrumb, index) => (
                <Fragment key={breadcrumb.path}>
                  <ChevronLeftIcon className="h-4 w-4 rotate-180" />
                  <Link
                    to={breadcrumb.path}
                    className={index === breadcrumbs.length - 1 ? 'text-gray-900 font-medium' : 'hover:text-gray-700'}
                  >
                    {breadcrumb.name}
                  </Link>
                </Fragment>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <form onSubmit={handleSearch} className="hidden md:block">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Поиск по лидам..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </form>

            <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100">
              <BellIcon className="h-6 w-6" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"></span>
            </button>

            <div className="h-8 w-8 overflow-hidden rounded-full bg-primary-100">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-primary-700 font-medium text-sm">
                  {user?.name.charAt(0)}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
