import React from 'react';
import { useUsers } from '../../hooks/useUsers';
import { useAuthStore } from '../../store/authStore';
import styles from './TaskFilters.module.css';

export interface TaskFiltersState {
  assignedTo?: string;
  status?: 'all' | 'completed' | 'pending' | 'overdue';
}

interface TaskFiltersProps {
  filters: TaskFiltersState;
  onFiltersChange: (filters: TaskFiltersState) => void;
}

const TaskFilters: React.FC<TaskFiltersProps> = ({ filters, onFiltersChange }) => {
  const { users, loading } = useUsers();
  const { user } = useAuthStore();

  const handleAssignedToChange = (value: string) => {
    onFiltersChange({
      ...filters,
      assignedTo: value === '' ? undefined : value,
    });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value === 'all' ? undefined : (value as 'completed' | 'pending' | 'overdue'),
    });
  };

  return (
    <div className={styles.filters}>
      <div className={styles.filter}>
        <label htmlFor="filter-status">Статус</label>
        <select
          id="filter-status"
          value={filters.status || 'all'}
          onChange={(e) => handleStatusChange(e.target.value)}
        >
          <option value="all">Все задачи</option>
          <option value="pending">Активные</option>
          <option value="completed">Выполненные</option>
          <option value="overdue">Просроченные</option>
        </select>
      </div>

      <div className={styles.filter}>
        <label htmlFor="filter-assigned">Ответственный</label>
        <select
          id="filter-assigned"
          value={filters.assignedTo || ''}
          onChange={(e) => handleAssignedToChange(e.target.value)}
          disabled={loading}
        >
          <option value="">Все</option>
          <option value={user?.id}>Мои задачи</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.first_name} {u.last_name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default TaskFilters;
