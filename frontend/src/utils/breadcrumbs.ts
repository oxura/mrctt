export const getBreadcrumbs = (pathname: string): string[] => {
  const routeMap: Record<string, string[]> = {
    '/dashboard': [],
    '/leads': ['Лиды'],
    '/products': ['Продукты'],
    '/groups': ['Группы'],
    '/forms': ['Формы'],
    '/tasks': ['Задачи'],
    '/team': ['Команда'],
    '/settings': ['Настройки'],
    '/billing': ['Биллинг'],
    '/billing/plans': ['Биллинг', 'Выбор тарифа'],
    '/profile': ['Профиль'],
    '/notifications': ['Уведомления'],
    '/onboarding': ['Настройка'],
  };

  return routeMap[pathname] || [];
};
