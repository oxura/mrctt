import React from 'react';
import styles from './TaskList.module.css';

interface TaskItem {
  id: string;
  title: string;
  dueDate: string;
  lead?: string;
  completed: boolean;
}

interface TaskListProps {
  tasks: TaskItem[];
}

const TaskList: React.FC<TaskListProps> = ({ tasks }) => {
  return (
    <div className={styles.container}>
      <h3>Мои задачи на сегодня</h3>
      <ul className={styles.list}>
        {tasks.map((task) => (
          <li key={task.id} className={styles.item}>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" checked={task.completed} readOnly />
              <span className={styles.title}>{task.title}</span>
            </label>
            <div className={styles.meta}>
              <span className={styles.due}>До {task.dueDate}</span>
              {task.lead && <span className={styles.lead}>Лид: {task.lead}</span>}
            </div>
          </li>
        ))}
      </ul>
      <button className={styles.addButton}>+ Добавить задачу</button>
    </div>
  );
};

export default TaskList;
