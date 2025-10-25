import { useMemo, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import {
  ChartBarIcon,
  FunnelIcon,
  UserGroupIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ru } from 'date-fns/locale';
import Button from '../../components/common/Button';

const COLORS = ['#3b82f6', '#6366f1', '#f59e0b', '#10b981', '#ef4444'];

export default function Analytics() {
  const { leads, tasks, products, company } = useAppStore();
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'month'>('30d');

  const getDaysAgo = (days: number) => {
    return subDays(new Date(), days);
  };

  const filteredLeads = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case '7d':
        startDate = getDaysAgo(7);
        break;
      case '30d':
        startDate = getDaysAgo(30);
        break;
      case '90d':
        startDate = getDaysAgo(90);
        break;
      case 'month':
        startDate = startOfMonth(now);
        break;
      default:
        startDate = getDaysAgo(30);
    }

    return leads.filter(lead => new Date(lead.createdAt) >= startDate);
  }, [leads, dateRange]);

  const leadsByDay = useMemo(() => {
    const days = dateRange === 'month' 
      ? eachDayOfInterval({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) })
      : Array.from({ length: dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90 }, (_, i) => getDaysAgo(i)).reverse();

    return days.map(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      const dayLeads = filteredLeads.filter(lead => {
        const leadDate = new Date(lead.createdAt);
        return format(leadDate, 'yyyy-MM-dd') === dayKey;
      });

      const dayTasks = tasks.filter(task => {
        const taskDate = new Date(task.dueDate);
        return format(taskDate, 'yyyy-MM-dd') === dayKey;
      });

      return {
        date: format(day, 'dd MMM', { locale: ru }),
        fullDate: day,
        leads: dayLeads.length,
        tasks: dayTasks.length,
      };
    });
  }, [filteredLeads, tasks, dateRange]);

  const leadsByStatus = useMemo(() => {
    return company?.leadStatuses.map(status => ({
      name: status.name,
      value: filteredLeads.filter(lead => lead.statusId === status.id).length,
      color: status.color,
    })) || [];
  }, [filteredLeads, company]);

  const leadsBySource = useMemo(() => {
    const sources: Record<string, number> = {};
    filteredLeads.forEach(lead => {
      const source = lead.source || 'Неизвестно';
      sources[source] = (sources[source] || 0) + 1;
    });

    return Object.entries(sources).map(([name, value]) => ({
      name,
      value,
    }));
  }, [filteredLeads]);

  const leadsByProduct = useMemo(() => {
    return products.map(product => ({
      name: product.name,
      value: filteredLeads.filter(lead => lead.productId === product.id).length,
    })).filter(p => p.value > 0);
  }, [filteredLeads, products]);

  const conversionRate = useMemo(() => {
    const successStatus = company?.leadStatuses.find(s => s.type === 'success');
    if (!successStatus) return 0;
    const successCount = filteredLeads.filter(lead => lead.statusId === successStatus.id).length;
    return filteredLeads.length > 0 ? ((successCount / filteredLeads.length) * 100).toFixed(1) : 0;
  }, [filteredLeads, company]);

  const avgLeadsPerDay = useMemo(() => {
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    return (filteredLeads.length / days).toFixed(1);
  }, [filteredLeads, dateRange]);

  const conversionFunnel = useMemo(() => {
    const statusOrder = company?.leadStatuses.sort((a, b) => a.order - b.order) || [];
    return statusOrder.map(status => ({
      name: status.name,
      leads: filteredLeads.filter(lead => lead.statusId === status.id).length,
      percentage: filteredLeads.length > 0 
        ? ((filteredLeads.filter(lead => lead.statusId === status.id).length / filteredLeads.length) * 100).toFixed(1)
        : 0,
    }));
  }, [filteredLeads, company]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Аналитика</h1>
          <p className="mt-1 text-gray-600">
            Глубокий анализ эффективности воронки продаж
          </p>
        </div>

        <div className="flex gap-2 rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setDateRange('7d')}
            className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
              dateRange === '7d'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            7 дней
          </button>
          <button
            onClick={() => setDateRange('30d')}
            className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
              dateRange === '30d'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            30 дней
          </button>
          <button
            onClick={() => setDateRange('90d')}
            className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
              dateRange === '90d'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            90 дней
          </button>
          <button
            onClick={() => setDateRange('month')}
            className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
              dateRange === 'month'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Месяц
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Всего лидов"
          value={filteredLeads.length}
          icon={UserGroupIcon}
          color="blue"
        />
        <StatCard
          title="Средн. в день"
          value={avgLeadsPerDay}
          icon={CalendarIcon}
          color="purple"
        />
        <StatCard
          title="Конверсия"
          value={`${conversionRate}%`}
          icon={ArrowTrendingUpIcon}
          color="green"
        />
        <StatCard
          title="Задач"
          value={tasks.length}
          icon={ChartBarIcon}
          color="orange"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Динамика лидов</h2>
              <p className="text-sm text-gray-500">Поступление лидов по дням</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={leadsByDay}>
              <defs>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af" 
                style={{ fontSize: '12px' }}
                interval="preserveStartEnd"
              />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Area
                type="monotone"
                dataKey="leads"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorLeads)"
                name="Лиды"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Воронка конверсии</h2>
            <p className="text-sm text-gray-500">Распределение по статусам</p>
          </div>
          <div className="space-y-3">
            {conversionFunnel.map((stage, index) => (
              <div key={stage.name} className="relative">
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{stage.name}</span>
                  <span className="text-gray-900">{stage.leads} ({stage.percentage}%)</span>
                </div>
                <div className="h-8 w-full rounded-lg bg-gray-100 overflow-hidden">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${stage.percentage}%`,
                      background: `linear-gradient(90deg, ${COLORS[index % COLORS.length]}, ${COLORS[index % COLORS.length]}dd)`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Источники лидов</h2>
            <p className="text-sm text-gray-500">Распределение по каналам привлечения</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={leadsBySource}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: PieLabelRenderProps) => {
                  const percent = typeof props.percent === 'number' ? props.percent : 0;
                  const name = typeof props.name === 'string' ? props.name : `${props.name ?? ''}`;
                  return `${name}: ${(percent * 100).toFixed(0)}%`;
                }}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {leadsBySource.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Лиды по продуктам</h2>
            <p className="text-sm text-gray-500">Популярность продуктов</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={leadsByProduct} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                width={150}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="value" fill="#6366f1" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Детальная статистика</h2>
            <p className="text-sm text-gray-500">Сравнение лидов и задач</p>
          </div>
          <Button variant="secondary" size="sm">
            Экспорт данных
          </Button>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={leadsByDay}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              stroke="#9ca3af" 
              style={{ fontSize: '12px' }}
              interval="preserveStartEnd"
            />
            <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="leads"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
              name="Лиды"
            />
            <Line
              type="monotone"
              dataKey="tasks"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ fill: '#f59e0b', r: 4 }}
              activeDot={{ r: 6 }}
              name="Задачи"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: 'blue' | 'purple' | 'green' | 'orange';
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
