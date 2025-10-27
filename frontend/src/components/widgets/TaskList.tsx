import React from 'react';
import styles from './TaskList.module.css';

interface TaskItem {
  id: string;
  title: string;
  due_date: string;
  lead_name?: string | null;
  is_completed: boolean;
}

interface TaskListProps {
  tasks: TaskItem[];
  onToggleTask?: (taskId: string, completed: boolean) => void;
  loading?: boolean;
  error?: string;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onToggleTask, loading, error }) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const handleToggle = (taskId: string, currentState: boolean) => {
    if (onToggleTask) {
      onToggleTask(taskId, !currentState);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <h3>Мои задачи на сегодня</h3>
        <div className={styles.loadingState}>Загрузка...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3>Мои задачи на сегодня</h3>
      {error && (
        <div className={styles.errorState}>{error || 'Не удалось загрузить данные'}</div>
      )}
      {tasks.length === 0 && !error ? (
        <div className={styles.emptyState}>Нет задач на сегодня</div>
      ) : null}
      {tasks.length > 0 && (
        <ul className={styles.list}>
          {tasks.map((task) => (
            <li key={task.id} className={styles.item}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={task.is_completed}
                  onChange={() => handleToggle(task.id, task.is_completed)}
                />
                <span className={task.is_completed ? styles.titleCompleted : styles.title}>
                  {task.title}
                </span>
              </label>
              <div className={styles.meta}>
                <span className={styles.due}>До {formatTime(task.due_date)}</span>
                {task.lead_name && <span className={styles.lead}>Лид: {task.lead_name}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TaskList;
