import React from 'react';
import AppLayout from '../../layouts/AppLayout';
import KpiCard from '../../components/widgets/KpiCard';
import ActivityFeed from '../../components/widgets/ActivityFeed';
import TaskList from '../../components/widgets/TaskList';
import styles from './Dashboard.module.css';

const Dashboard: React.FC = () => {
  const kpis = [
    { label: 'Новые лиды', value: '24', trend: '+12% к вчера', trendDirection: 'up' as const },
    { label: 'В работе', value: '63', trend: '+5% к прошлой неделе', trendDirection: 'up' as const },
    { label: 'Продажи (мес)', value: '₽480 000', trend: '+18% к прошлому месяцу', trendDirection: 'up' as const },
    { label: 'Просроченные задачи', value: '3', trend: '-1 за сегодня', trendDirection: 'down' as const },
  ];

  const activities = [
    {
      id: '1',
      title: 'Статус лида изменен на «Оплачено»',
      description: 'Лид Иван Петров переведен в успешные сделки',
      timestamp: '10 минут назад',
      actor: 'Менеджер Анна',
    },
    {
      id: '2',
      title: 'Новая заявка с лендинга',
      description: 'Новый лид для продукта «Курс по дизайну»',
      timestamp: '30 минут назад',
      actor: 'Форма «Дизайн-2024»',
    },
    {
      id: '3',
      title: 'Комментарий к лиду',
      description: '«Думает до завтра, назначить повторный звонок»',
      timestamp: '1 час назад',
      actor: 'Менеджер Олег',
    },
  ];

  const tasks = [
    { id: '1', title: 'Перезвонить Марии по предложению «Курс UX»', dueDate: '14:00', lead: 'Мария Сидорова', completed: false },
    { id: '2', title: 'Подготовить КП для тура в Грузию', dueDate: '16:30', lead: 'ООО «Путешествуем вместе»', completed: false },
    { id: '3', title: 'Проверить оплату по счету №457', dueDate: '18:00', lead: 'ИП Алексеев', completed: true },
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
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3>Поступление лидов (30 дней)</h3>
                <select>
                  <option>Все источники</option>
                  <option>Мета-реклама</option>
                  <option>Telegram</option>
                </select>
              </div>
              <div className={styles.placeholderChart}>График будет здесь</div>
            </div>

            <ActivityFeed items={activities} />
          </div>

          <div className={styles.sideColumn}>
            <TaskList tasks={tasks} />
            <div className={styles.card}>
              <h3>Статус по модулям</h3>
              <ul className={styles.moduleList}>
                <li>✔️ CRM Pipeline</li>
                <li>✔️ Конструктор форм</li>
                <li>✔️ Команда и роли</li>
                <li>⏳ Модуль задач (в разработке)</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
