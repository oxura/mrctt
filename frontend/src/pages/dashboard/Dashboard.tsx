import React from 'react';
import AppLayout from '../../layouts/AppLayout';
import KpiCard from '../../components/widgets/KpiCard';
import ActivityFeed from '../../components/widgets/ActivityFeed';
import TaskList from '../../components/widgets/TaskList';
import LeadsChart from '../../components/widgets/LeadsChart';
import {
  useDashboardStats,
  useLeadsChart,
  useActivityFeed,
  useMyTasks,
} from '../../hooks/useDashboard';
import styles from './Dashboard.module.css';

const Dashboard: React.FC = () => {
  const { stats, loading: statsLoading, error: statsError } = useDashboardStats();
  const { chartData, loading: chartLoading, error: chartError } = useLeadsChart(30);
  const { activities, loading: activitiesLoading, error: activitiesError } = useActivityFeed(10);
  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
    updateTaskCompletion,
  } = useMyTasks();

  const handleToggleTask = async (taskId: string, isCompleted: boolean) => {
    try {
      await updateTaskCompletion(taskId, isCompleted);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const formatNumber = (value?: number) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value.toLocaleString('ru-RU');
    }

    return '0';
  };

  const formatCurrency = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      const currencySymbols: Record<string, string> = {
        USD: '$',
        EUR: '€',
        RUB: '₽',
        GBP: '£',
      };
      const symbol = currencySymbols[currency] || currency;
      return `${symbol}${amount.toLocaleString('ru-RU')}`;
    }
  };

  const formatPercentChange = (percent?: number) => {
    if (typeof percent !== 'number' || !Number.isFinite(percent)) {
      return '0%';
    }

    const absolute = Math.abs(percent);
    const formatted = new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: absolute % 1 === 0 ? 0 : 1,
      maximumFractionDigits: 1,
    }).format(absolute);

    if (percent > 0) {
      return `+${formatted}%`;
    }

    if (percent < 0) {
      return `-${formatted}%`;
    }

    return '0%';
  };

  const newLeadsPercent = stats?.newLeads?.percentChange ?? 0;
  const overdueCount = stats?.overdueTasks?.count ?? 0;

  const hasStatsError = Boolean(statsError);

  const kpis: Array<{
    label: string;
    value: string;
    trend: string;
    trendDirection: 'up' | 'down' | 'neutral';
    variant?: 'default' | 'danger';
  }> = [
    {
      label: 'Новые лиды',
      value: statsLoading ? '...' : hasStatsError ? '—' : formatNumber(stats?.newLeads?.today),
      trend:
        statsLoading || hasStatsError
          ? ''
          : `${formatPercentChange(newLeadsPercent)} к вчера`,
      trendDirection:
        statsLoading || hasStatsError
          ? 'neutral'
          : newLeadsPercent >= 0
          ? 'up'
          : 'down',
    },
    {
      label: 'В работе',
      value: statsLoading ? '...' : hasStatsError ? '—' : formatNumber(stats?.activeDeals?.count),
      trend: '',
      trendDirection: 'neutral',
    },
    {
      label: 'Продажи (мес)',
      value: statsLoading
        ? '...'
        : hasStatsError
        ? '—'
        : formatCurrency(
            stats?.sales?.totalAmount ?? 0,
            stats?.sales?.currency ?? 'USD'
          ),
      trend: '',
      trendDirection: 'neutral',
    },
    {
      label: 'Просроченные задачи',
      value: statsLoading ? '...' : hasStatsError ? '—' : formatNumber(overdueCount),
      trend: '',
      trendDirection:
        statsLoading || hasStatsError
          ? 'neutral'
          : overdueCount > 0
          ? 'down'
          : 'neutral',
      variant:
        statsLoading || hasStatsError
          ? 'default'
          : overdueCount > 0
          ? 'danger'
          : 'default',
    },
  ];

  return (
    <AppLayout>
      <div className={styles.dashboard}>
        <section className={styles.kpis}>
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </section>

        <section className={styles.mainContent}>
          <div className={styles.chartArea}>
            <LeadsChart
              data={chartData}
              loading={chartLoading}
              error={chartError ?? undefined}
            />
            <ActivityFeed
              items={activities}
              loading={activitiesLoading}
              error={activitiesError ?? undefined}
            />
          </div>

          <div className={styles.sideColumn}>
            <TaskList
              tasks={tasks}
              loading={tasksLoading}
              error={tasksError ?? undefined}
              onToggleTask={handleToggleTask}
            />
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
