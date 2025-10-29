import React from 'react';
import { Task } from '../../hooks/useTasks';
import styles from './OverdueTasksWidget.module.css';

interface OverdueTasksWidgetProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const OverdueTasksWidget: React.FC<OverdueTasksWidgetProps> = ({ tasks, onTaskClick }) => {
  if (tasks.length === 0) return null;

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <span className={styles.icon}>⚠️</span>
        <h3>Просроченные задачи</h3>
        <span className={styles.count}>{tasks.length}</span>
      </div>
      <div className={styles.taskList}>
        {tasks.map((task) => {
          const daysOverdue = Math.floor(
            (new Date().getTime() - new Date(task.due_date!).getTime()) / (1000 * 60 * 60 * 24)
          );

          return (
            <div
              key={task.id}
              className={styles.taskItem}
              onClick={() => onTaskClick(task)}
            >
              <div className={styles.taskInfo}>
                <div className={styles.taskTitle}>{task.title}</div>
                {task.assigned_name && (
                  <div className={styles.assigned}>👤 {task.assigned_name}</div>
                )}
              </div>
              <div className={styles.overdueIndicator}>
                Просрочено {daysOverdue} {daysOverdue === 1 ? 'день' : 'дней'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OverdueTasksWidget;
