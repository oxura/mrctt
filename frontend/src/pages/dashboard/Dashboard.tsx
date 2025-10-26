import React from 'react';
import AppLayout from '../../layouts/AppLayout';
import KpiCard from '../../components/widgets/KpiCard';
import ActivityFeed from '../../components/widgets/ActivityFeed';
import TaskList from '../../components/widgets/TaskList';
import LeadsChart from '../../components/widgets/LeadsChart';
import { useDashboardStats, useLeadsChart, useActivityFeed, useMyTasks } from '../../hooks/useDashboard';
import styles from './Dashboard.module.css';

const Dashboard: React.FC = () => {
  const { stats, loading: statsLoading } = useDashboardStats();
  const { chartData, loading: chartLoading } = useLeadsChart(30);
  const { activities, loading: activitiesLoading } = useActivityFeed(10);
  const { tasks, loading: tasksLoading, updateTaskCompletion } = useMyTasks();

  const handleToggleTask = async (taskId: string, isCompleted: boolean) => {
    try {
      await updateTaskCompletion(taskId, isCompleted);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    const currencySymbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      RUB: '₽',
      GBP: '£',
    };
    const symbol = currencySymbols[currency] || currency;
    return `${symbol}${amount.toLocaleString('ru-RU')}`;
  };

  const getPercentageDisplay = (percent: number) => {
    if (percent > 0) return `+${percent}%`;
    return `${percent}%`;
  };

  const kpis = [
    {
      label: 'Новые лиды',
      value: statsLoading ? '...' : stats?.newLeads?.today.toString() || '0',
      trend: statsLoading ? '' : `${getPercentageDisplay(stats?.newLeads?.percentChange || 0)} к вчера`,
      trendDirection: statsLoading ? 'neutral' as const : (stats?.newLeads?.percentChange || 0) >= 0 ? 'up' as const : 'down' as const,
    },
    {
      label: 'В работе',
      value: statsLoading ? '...' : stats?.activeDeals?.count.toString() || '0',
      trend: '',
      trendDirection: 'neutral' as const,
    },
    {
      label: 'Продажи (мес)',
      value: statsLoading ? '...' : formatCurrency(stats?.sales?.totalAmount || 0, stats?.sales?.currency || 'USD'),
      trend: '',
      trendDirection: 'neutral' as const,
    },
    {
      label: 'Просроченные задачи',
      value: statsLoading ? '...' : stats?.overdueTasks?.count.toString() || '0',
      trend: '',
      trendDirection: (stats?.overdueTasks?.count || 0) > 0 ? 'down' as const : 'neutral' as const,
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
            <LeadsChart data={chartData} loading={chartLoading} />
            <ActivityFeed items={activities} loading={activitiesLoading} />
          </div>

          <div className={styles.sideColumn}>
            <TaskList tasks={tasks} loading={tasksLoading} onToggleTask={handleToggleTask} />
            <div className={styles.card}>
              <h3>Статус по модулям</h3>
              <ul className={styles.moduleList}>
                <li>✔️ Dashboard & Analytics</li>
                <li>✔️ Управление лидами</li>
                <li>✔️ Задачи и календарь</li>
                <li>✔️ Команда и роли</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
