import {
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { useAppStore } from '../../store/appStore';

export default function SuperAdminDashboard() {
  const { superAdminStats } = useAppStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">SaaS Панель управления</h1>
        <p className="mt-1 text-gray-600">
          Управление всеми компаниями на платформе Экосистема заявок
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Всего компаний"
          value={superAdminStats.totalCompanies}
          icon={BuildingOfficeIcon}
          color="blue"
        />
        <StatCard
          title="Активных подписок"
          value={superAdminStats.activeSubscriptions}
          icon={UsersIcon}
          color="green"
        />
        <StatCard
          title="MRR"
          value={`${superAdminStats.mrr.toLocaleString('ru-RU')} ₽`}
          icon={CurrencyDollarIcon}
          color="purple"
        />
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Недавние регистрации</h2>
          <ChartBarIcon className="h-5 w-5 text-gray-400" />
        </div>
        <table className="w-full text-left text-sm">
          <thead className="border-b text-gray-700">
            <tr>
              <th className="pb-3 font-medium">Компания</th>
              <th className="pb-3 font-medium">Ниша</th>
              <th className="pb-3 font-medium">Дата регистрации</th>
              <th className="pb-3 font-medium">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {superAdminStats.recentCompanies.map((company) => (
              <tr key={company.id} className="hover:bg-gray-50">
                <td className="py-3 font-medium text-gray-900">{company.name}</td>
                <td className="py-3 text-gray-600">{company.niche}</td>
                <td className="py-3 text-gray-500">
                  {new Date(company.createdAt).toLocaleDateString('ru-RU')}
                </td>
                <td className="py-3">
                  <button className="text-sm text-primary-600 hover:underline">
                    Войти как владелец
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Функции суперадмина
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <FeatureCard
            title="Управление тарифами"
            description="Настройка цен, лимитов и доступных функций для каждого плана"
            action="Открыть"
          />
          <FeatureCard
            title="Блокировка аккаунтов"
            description="Приостановка доступа к системе при нарушении условий использования"
            action="Управление"
          />
          <FeatureCard
            title="Аналитика платформы"
            description="Детальные отчеты по всем компаниям: выручка, активность, конверсии"
            action="Просмотр"
          />
          <FeatureCard
            title="Имперсонация"
            description="Вход в любую компанию для тестирования или поддержки клиентов"
            action="Список"
          />
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: typeof BuildingOfficeIcon;
  color: 'blue' | 'green' | 'purple';
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  action: string;
}

function FeatureCard({ title, description, action }: FeatureCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 hover:border-primary-300 hover:shadow-md transition-all">
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
      <button className="mt-4 text-sm font-medium text-primary-600 hover:underline">
        {action} →
      </button>
    </div>
  );
}
