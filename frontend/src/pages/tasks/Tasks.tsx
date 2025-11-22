import React, { useState, useEffect } from 'react';
import AppLayout from '../../layouts/AppLayout';
import Calendar from '../../components/tasks/Calendar';
import TaskModal from '../../components/tasks/TaskModal';
import TaskFilters, { TaskFiltersState } from '../../components/tasks/TaskFilters';
import OverdueTasksWidget from '../../components/tasks/OverdueTasksWidget';
import { useAllTasks } from '../../hooks/useAllTasks';
import { useAuthStore } from '../../store/authStore';
import { Task } from '../../hooks/useTasks';
import styles from './Tasks.module.css';

type ViewType = 'month' | 'week' | 'day';

const Tasks: React.FC = () => {
  const { tenant } = useAuthStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('month');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [calendarTasks, setCalendarTasks] = useState<Task[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [filters, setFilters] = useState<TaskFiltersState>({ status: undefined });

  const { fetchCalendarTasks, fetchOverdueTasks, fetchGoogleEvents, createTask, updateTask, deleteTask, toggleTaskComplete } =
    useAllTasks(filters);

  const isModuleEnabled = tenant?.settings?.modules?.tasks !== false;

  const loadCalendarData = React.useCallback(async () => {
    if (!isModuleEnabled) return;

    const defaultStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const defaultEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const dateFrom = filters.dateFrom
      ? new Date(filters.dateFrom)
      : new Date(defaultStart.setDate(defaultStart.getDate() - 7));

    const dateTo = filters.dateTo
      ? new Date(filters.dateTo)
      : new Date(defaultEnd.setDate(defaultEnd.getDate() + 7));

    if (!filters.dateFrom) {
      dateFrom.setHours(0, 0, 0, 0);
    }

    if (!filters.dateTo) {
      dateTo.setHours(23, 59, 59, 999);
    }

    try {
      const [calendar, overdue, googleEvents] = await Promise.all([
        fetchCalendarTasks(dateFrom.toISOString(), dateTo.toISOString()),
        fetchOverdueTasks(filters.assignedTo),
        fetchGoogleEvents(),
      ]);

      const mappedGoogleEvents = googleEvents.map((event: any) => ({
        id: event.id,
        title: `📅 ${event.title}`,
        description: event.description,
        due_date: event.start,
        is_completed: false,
        priority: 'medium',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tenant_id: '',
        lead_id: null,
        assigned_to: null,
        created_by: null,
        source: 'google',
      })) as Task[];

      setCalendarTasks([...calendar, ...mappedGoogleEvents]);
      setOverdueTasks(overdue);
    } catch (error) {
      console.error('Failed to load calendar data', error);
    }
  }, [
    currentDate,
    fetchCalendarTasks,
    fetchOverdueTasks,
    fetchGoogleEvents,
    filters.assignedTo,
    filters.dateFrom,
    filters.dateTo,
    isModuleEnabled,
  ]);

  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  if (!isModuleEnabled) {
    return (
      <AppLayout breadcrumbs={['Задачи']}>
        <div className={styles.disabledModule}>
          <div className={styles.disabledMessage}>
            <span className={styles.icon}>🔒</span>
            <h2>Модуль задач отключен</h2>
            <p>Включите модуль задач в настройках компании, чтобы использовать эту функцию.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  const handleTaskClick = (task: Task) => {
    if (task.source === 'google') {
      alert('События Google Calendar нельзя редактировать здесь. Используйте Google Calendar.');
      return;
    }
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleModalSave = async (data: any) => {
    try {
      if (selectedTask) {
        await updateTask(selectedTask.id, data);
      } else {
        await createTask(data);
      }

      await loadCalendarData();
    } catch (error) {
      console.error('Error saving task:', error);
      throw error;
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      await loadCalendarData();
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  const handleToggleComplete = async (taskId: string, isCompleted: boolean) => {
    try {
      await toggleTaskComplete(taskId, isCompleted);
      await loadCalendarData();
    } catch (error) {
      console.error('Error toggling task complete:', error);
      throw error;
    }
  };

  const monthNames = [
    'Январь',
    'Февраль',
    'Март',
    'Апрель',
    'Май',
    'Июнь',
    'Июль',
    'Август',
    'Сентябрь',
    'Октябрь',
    'Ноябрь',
    'Декабрь',
  ];

  return (
    <AppLayout breadcrumbs={['Задачи']}>
      <div className={styles.tasks}>
        <div className={styles.header}>
          <h1>Календарь задач</h1>
          <button className={styles.createButton} onClick={handleCreateTask}>
            + Создать задачу
          </button>
        </div>

        <TaskFilters filters={filters} onFiltersChange={setFilters} />

        {overdueTasks.length > 0 && (
          <OverdueTasksWidget tasks={overdueTasks} onTaskClick={handleTaskClick} />
        )}

        <div className={styles.calendarWrapper}>
          <div className={styles.calendarControls}>
            <div className={styles.monthNavigation}>
              <button onClick={handlePrevMonth} className={styles.navButton}>
                ←
              </button>
              <h2 className={styles.currentMonth}>
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button onClick={handleNextMonth} className={styles.navButton}>
                →
              </button>
              <button onClick={handleToday} className={styles.todayButton}>
                Сегодня
              </button>
            </div>

            <div className={styles.viewSwitcher}>
              <button
                className={`${styles.viewButton} ${viewType === 'month' ? styles.active : ''}`}
                onClick={() => setViewType('month')}
              >
                Месяц
              </button>
              <button
                className={`${styles.viewButton} ${viewType === 'week' ? styles.active : ''}`}
                onClick={() => setViewType('week')}
                disabled
                title="Скоро доступно"
              >
                Неделя
              </button>
              <button
                className={`${styles.viewButton} ${viewType === 'day' ? styles.active : ''}`}
                onClick={() => setViewType('day')}
                disabled
                title="Скоро доступно"
              >
                День
              </button>
            </div>
          </div>

          <Calendar
            tasks={calendarTasks}
            currentDate={currentDate}
            viewType={viewType}
            onDateClick={() => {}}
            onTaskClick={handleTaskClick}
          />
        </div>

        <TaskModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTask(null);
          }}
          onSave={handleModalSave}
          onDelete={handleDeleteTask}
          onToggleComplete={handleToggleComplete}
          task={selectedTask}
        />
      </div>
    </AppLayout>
  );
};

export default Tasks;
