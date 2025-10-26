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
    '/profile': ['Профиль'],
    '/notifications': ['Уведомления'],
    '/onboarding': ['Настройка'],
  };

  return routeMap[pathname] || [];
};
