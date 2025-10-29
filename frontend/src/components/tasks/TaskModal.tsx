import React, { useState, useEffect } from 'react';
import { Task } from '../../hooks/useTasks';
import { useUsers } from '../../hooks/useUsers';
import styles from './TaskModal.module.css';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TaskFormData) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
  onToggleComplete?: (taskId: string, isCompleted: boolean) => Promise<void>;
  task?: Task | null;
  leadId?: string | null;
}

export interface TaskFormData {
  title: string;
  description?: string | null;
  assigned_to?: string | null;
  lead_id?: string | null;
  due_date?: string | null;
  priority?: 'low' | 'medium' | 'high';
}

const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  onToggleComplete,
  task,
  leadId,
}) => {
  const { users, loading: usersLoading } = useUsers();
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    assigned_to: '',
    lead_id: leadId || '',
    due_date: '',
    priority: 'medium',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        assigned_to: task.assigned_to || '',
        lead_id: task.lead_id || leadId || '',
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        priority: (task.priority as 'low' | 'medium' | 'high') || 'medium',
      });
      setIsCompleted(task.is_completed);
    } else {
      setFormData({
        title: '',
        description: '',
        assigned_to: '',
        lead_id: leadId || '',
        due_date: '',
        priority: 'medium',
      });
      setIsCompleted(false);
    }
  }, [task, leadId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value || null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const dataToSend: TaskFormData = {
        ...formData,
        assigned_to: formData.assigned_to || null,
        description: formData.description || null,
        lead_id: formData.lead_id || null,
        due_date: formData.due_date || null,
      };

      await onSave(dataToSend);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Не удалось сохранить задачу');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async () => {
    if (!task || !onToggleComplete) return;

    setToggleLoading(true);
    try {
      await onToggleComplete(task.id, !isCompleted);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Не удалось изменить статус задачи');
    } finally {
      setToggleLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task || !onDelete) return;

    if (!confirm('Вы уверены, что хотите удалить эту задачу?')) return;

    setDeleteLoading(true);
    try {
      await onDelete(task.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Не удалось удалить задачу');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{task ? 'Редактировать задачу' : 'Создать задачу'}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          {task && (
            <div className={styles.statusRow}>
              <div>
                <span
                  className={`${styles.statusBadge} ${isCompleted ? styles.statusCompleted : styles.statusPending}`}
                >
                  {isCompleted ? 'Выполнено' : 'В работе'}
                </span>
                {task.due_date && !isCompleted && (
                  <span className={styles.dueDate}>
                    Дедлайн: {new Date(task.due_date).toLocaleDateString('ru-RU')}
                  </span>
                )}
              </div>
              <div className={styles.statusActions}>
                <button
                  type="button"
                  className={styles.completeButton}
                  onClick={handleToggleComplete}
                  disabled={toggleLoading}
                >
                  {toggleLoading ? 'Обновление...' : isCompleted ? 'Вернуть в работу' : 'Отметить выполненной'}
                </button>
                {onDelete && (
                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={handleDelete}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? 'Удаление...' : 'Удалить'}
                  </button>
                )}
              </div>
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="title">
              Название задачи <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Например: Перезвонить клиенту"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="description">Описание</label>
            <textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              rows={3}
              placeholder="Дополнительная информация о задаче"
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="due_date">Дедлайн</label>
              <input
                type="date"
                id="due_date"
                name="due_date"
                value={formData.due_date || ''}
                onChange={handleChange}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="priority">Приоритет</label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="low">Низкий</option>
                <option value="medium">Средний</option>
                <option value="high">Высокий</option>
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="assigned_to">Ответственный</label>
            <select
              id="assigned_to"
              name="assigned_to"
              value={formData.assigned_to || ''}
              onChange={handleChange}
              disabled={usersLoading}
            >
              <option value="">Не назначен</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.first_name} {user.last_name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Отмена
            </button>
            <button type="submit" disabled={loading} className={styles.saveButton}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
