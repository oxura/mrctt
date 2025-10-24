import { useMemo, useEffect } from 'react';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CheckCircleIcon,
  ClockIcon,
  BanknotesIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';
import Button from '../../components/common/Button';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { Link } from 'react-router-dom';

const chartHeight = 180;

export default function Dashboard() {
  const { kpi, activities, tasks, leads, refreshKpi } = useAppStore();
  const { user } = useAuthStore();

  const leadTrendData = useMemo(() => {
    const points: { date: string; value: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const value = leads.filter((lead) => {
        const leadDate = new Date(lead.createdAt);
        return (
          leadDate.getFullYear() === date.getFullYear() &&
          leadDate.getMonth() === date.getMonth() &&
          leadDate.getDate() === date.getDate()
        );
      }).length;
      points.push({ date: date.toISOString(), value });
    }
    return points;
  }, [leads]);

  const maxValue = Math.max(...leadTrendData.map((point) => point.value), 5);

  const pathD = leadTrendData
    .map((point, index) => {
      const x = (index / (leadTrendData.length - 1)) * 100;
      const y = 100 - (point.value / maxValue) * 100;
      return `${index === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');

  const areaPath = `${pathD} L100,100 L0,100 Z`;

  useEffect(() => {
    refreshKpi();
  }, [refreshKpi, leads, tasks]);

  const myTasks = tasks.filter((task) => task.ownerId === user?.id).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Добро пожаловать, {user?.name.split(' ')[0]}!</h1>
          <p className="mt-1 text-gray-600">
            Отслеживайте ключевые показатели в реальном времени и управляйте лидами на одной панели.
          </p>
        </div>
        <Link to="/leads">
          <Button>Добавить нового лида</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Новые лиды"
          value={kpi.newLeads.value}
          delta={kpi.newLeads.delta}
          icon={PhoneIcon}
          trend="up"
        />
        <KpiCard
          title="В работе"
          value={kpi.inProgress}
          icon={ClockIcon}
          trend="neutral"
        />
        <KpiCard
          title="Продажи за месяц"
          value={kpi.sales}
          icon={BanknotesIcon}
          currency
          trend="up"
        />
        <KpiCard
          title="Просроченные задачи"
          value={kpi.overdueTasks}
          icon={CheckCircleIcon}
          trend={kpi.overdueTasks > 0 ? 'down' : 'neutral'}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Поступление лидов</h2>
              <p className="text-sm text-gray-500">Данные за последние 30 дней</p>
            </div>
            <Button variant="ghost" size="sm">
              Скачать отчет
            </Button>
          </div>

          <div className="relative">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-48 w-full">
              <defs>
                <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              <path d={areaPath} fill="url(#leadGradient)" stroke="none" />
              <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="1.5" />
            </svg>
            <div className="mt-4 grid grid-cols-6 text-xs text-gray-500">
              {leadTrendData.filter((_, index) => index % 5 === 0).map((point) => (
                <span key={point.date}>
                  {new Date(point.date).toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Мои задачи на сегодня</h2>
            <div className="mt-4 space-y-3">
              {myTasks.length === 0 && (
                <p className="text-sm text-gray-500">На сегодня задач нет 🎉</p>
              )}
              {myTasks.map((task) => (
                <div key={task.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{task.title}</p>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        task.status === 'overdue'
                          ? 'bg-red-100 text-red-700'
                          : task.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-primary-100 text-primary-700'
                      }`}
                    >
                      {task.status === 'pending' && 'В работе'}
                      {task.status === 'overdue' && 'Просрочено'}
                      {task.status === 'completed' && 'Готово'}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Дедлайн: {new Date(task.dueDate).toLocaleString('ru-RU')}
                  </p>
                </div>
              ))}
            </div>
            <Button variant="secondary" size="sm" className="mt-4 w-full">
              Открыть календарь
            </Button>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Лента событий</h2>
            <div className="mt-4 space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary-600" />
                  <div>
                    <p className="text-sm text-gray-700">{activity.message}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(activity.createdAt).toLocaleString('ru-RU')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface KpiCardProps {
  title: string;
  value: number;
  delta?: number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  trend?: 'up' | 'down' | 'neutral';
  currency?: boolean;
}

function KpiCard({ title, value, delta, icon: Icon, trend = 'neutral', currency }: KpiCardProps) {
  const TrendIcon = trend === 'up' ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;
  const isPositive = trend !== 'down';

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {currency ? `${value.toLocaleString('ru-RU')} ₽` : value}
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {typeof delta === 'number' && (
        <div className="mt-4 flex items-center space-x-2 text-sm">
          {trend !== 'neutral' && (
            <TrendIcon
              className={`h-4 w-4 ${isPositive ? 'text-green-500' : 'text-red-500'}`}
            />
          )}
          <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
            {isPositive ? '+' : ''}{delta}%
          </span>
          <span className="text-gray-500">к вчерашнему дню</span>
        </div>
      )}
    </div>
  );
}
