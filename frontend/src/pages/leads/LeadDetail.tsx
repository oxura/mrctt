import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '../../layouts/AppLayout';
import { useLead } from '../../hooks/useLeads';
import { useComments } from '../../hooks/useComments';
import { useActivities } from '../../hooks/useActivities';
import { useTasks } from '../../hooks/useTasks';
import { useUsers } from '../../hooks/useUsers';
import { leadStatusMeta } from '../../data/leads';
import { useToast } from '../../components/ui/toastContext';
import styles from './LeadDetail.module.css';

type TabId = 'comments' | 'history' | 'tasks';

const dateFormatter = (value: string) => {
  const date = new Date(value);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).replace('.', '');
};

const LeadDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();
  const [activeTab, setActiveTab] = useState<TabId>('comments');
  const [commentContent, setCommentContent] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);

  const { lead, loading: leadLoading, error: leadError, updateLead, updateLeadStatus } = useLead(id!);
  const { comments, loading: commentsLoading, createComment } = useComments(id!);
  const { activities, loading: activitiesLoading } = useActivities(id!);
  const { tasks, loading: tasksLoading, createTask, updateTask } = useTasks(id!);
  const { users } = useUsers();

  const getLeadName = () => {
    if (!lead) return '';
    const parts = [lead.first_name, lead.last_name].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Без имени';
  };

  const getInitials = () => {
    if (!lead) return '?';
    const firstName = lead.first_name || '';
    const lastName = lead.last_name || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || '?';
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateLeadStatus(newStatus);
      const statusMeta = leadStatusMeta[newStatus as keyof typeof leadStatusMeta];
      showSuccess(`Статус изменен на «${statusMeta?.label || newStatus}»`);
    } catch (err: any) {
      showError(err.message || 'Не удалось изменить статус');
    }
  };

  const handleManagerChange = async (newManagerId: string) => {
    try {
      await updateLead({ assigned_to: newManagerId || null });
      showSuccess('Менеджер успешно назначен');
    } catch (err: any) {
      showError(err.message || 'Не удалось назначить менеджера');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    setIsSubmittingComment(true);
    try {
      await createComment({ content: commentContent });
      setCommentContent('');
      showSuccess('Комментарий добавлен');
    } catch (err: any) {
      showError(err.message || 'Не удалось добавить комментарий');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      await createTask({ title: newTaskTitle });
      setNewTaskTitle('');
      setShowTaskForm(false);
      showSuccess('Задача создана');
    } catch (err: any) {
      showError(err.message || 'Не удалось создать задачу');
    }
  };

  const handleToggleTask = async (taskId: string, isCompleted: boolean) => {
    try {
      await updateTask(taskId, { is_completed: !isCompleted });
    } catch (err: any) {
      showError(err.message || 'Не удалось обновить задачу');
    }
  };

  if (leadLoading) {
    return (
      <AppLayout breadcrumbs={['Лиды', 'Загрузка...']}>
        <div className={styles.wrapper}>
          <div className={styles.loading}>Загрузка...</div>
        </div>
      </AppLayout>
    );
  }

  if (leadError || !lead) {
    return (
      <AppLayout breadcrumbs={['Лиды', 'Ошибка']}>
        <div className={styles.wrapper}>
          <div className={styles.error}>{leadError || 'Лид не найден'}</div>
        </div>
      </AppLayout>
    );
  }

  const statusMeta = leadStatusMeta[lead.status as keyof typeof leadStatusMeta] || {
    label: lead.status,
    accent: '#6b7280',
  };

  return (
    <AppLayout breadcrumbs={['Лиды', getLeadName()]}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate('/leads')}>
            ← Назад к списку
          </button>
        </div>

        <div className={styles.layout}>
          <div className={styles.leftColumn}>
            <div className={styles.card}>
              <div className={styles.avatarSection}>
                <div className={styles.avatar}>{getInitials()}</div>
                <h2 className={styles.leadName}>{getLeadName()}</h2>
              </div>

              <div className={styles.contactInfo}>
                {lead.phone && (
                  <div className={styles.contactItem}>
                    <span className={styles.contactIcon}>📞</span>
                    <div className={styles.contactContent}>
                      <div className={styles.contactLabel}>Телефон</div>
                      <div className={styles.contactValue}>
                        <a href={`tel:${lead.phone}`} className={styles.contactLink}>
                          {lead.phone}
                        </a>
                      </div>
                    </div>
                    <button className={styles.actionButton}>Позвонить</button>
                  </div>
                )}

                {lead.email && (
                  <div className={styles.contactItem}>
                    <span className={styles.contactIcon}>✉️</span>
                    <div className={styles.contactContent}>
                      <div className={styles.contactLabel}>Email</div>
                      <div className={styles.contactValue}>
                        <a href={`mailto:${lead.email}`} className={styles.contactLink}>
                          {lead.email}
                        </a>
                      </div>
                    </div>
                    <button className={styles.actionButton}>Написать</button>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Связанные данные</h3>
              </div>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>Продукт</div>
                  <div className={styles.infoValue}>{lead.product_name || '—'}</div>
                </div>

                {lead.group_name && (
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>Группа/Поток</div>
                    <div className={styles.infoValue}>{lead.group_name}</div>
                  </div>
                )}

                {lead.source && (
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>Источник</div>
                    <div className={styles.infoValue}>{lead.source}</div>
                  </div>
                )}

                {lead.utm_source && (
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>UTM Source</div>
                    <div className={styles.infoValue}>{lead.utm_source}</div>
                  </div>
                )}

                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>Создан</div>
                  <div className={styles.infoValue}>{dateFormatter(lead.created_at)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.centerColumn}>
            <div className={styles.card}>
              <div className={styles.tabs}>
                <button
                  className={`${styles.tabButton} ${activeTab === 'comments' ? styles.tabButtonActive : ''}`}
                  onClick={() => setActiveTab('comments')}
                >
                  Комментарии ({comments.length})
                </button>
                <button
                  className={`${styles.tabButton} ${activeTab === 'history' ? styles.tabButtonActive : ''}`}
                  onClick={() => setActiveTab('history')}
                >
                  История ({activities.length})
                </button>
                <button
                  className={`${styles.tabButton} ${activeTab === 'tasks' ? styles.tabButtonActive : ''}`}
                  onClick={() => setActiveTab('tasks')}
                >
                  Задачи ({tasks.length})
                </button>
              </div>

              <div className={styles.tabContent}>
                {activeTab === 'comments' && (
                  <>
                    <form className={styles.commentForm} onSubmit={handleCommentSubmit}>
                      <textarea
                        className={styles.commentTextarea}
                        placeholder="Оставить комментарий..."
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        disabled={isSubmittingComment}
                      />
                      <button
                        type="submit"
                        className={styles.commentSubmit}
                        disabled={isSubmittingComment || !commentContent.trim()}
                      >
                        {isSubmittingComment ? 'Отправка...' : 'Отправить'}
                      </button>
                    </form>

                    {commentsLoading ? (
                      <div className={styles.loading}>Загрузка комментариев...</div>
                    ) : comments.length === 0 ? (
                      <div className={styles.emptyState}>
                        <div className={styles.emptyStateIcon}>💬</div>
                        <div className={styles.emptyStateText}>Комментариев пока нет</div>
                      </div>
                    ) : (
                      <div className={styles.commentsList}>
                        {comments.map((comment) => (
                          <div key={comment.id} className={styles.comment}>
                            <div className={styles.commentHeader}>
                              <div className={styles.commentAuthor}>
                                {comment.user_name || 'Неизвестный'}
                              </div>
                              <div className={styles.commentDate}>
                                {dateFormatter(comment.created_at)}
                              </div>
                            </div>
                            <div className={styles.commentContent}>{comment.content}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'history' && (
                  <>
                    {activitiesLoading ? (
                      <div className={styles.loading}>Загрузка истории...</div>
                    ) : activities.length === 0 ? (
                      <div className={styles.emptyState}>
                        <div className={styles.emptyStateIcon}>📋</div>
                        <div className={styles.emptyStateText}>История действий пуста</div>
                      </div>
                    ) : (
                      <div className={styles.activities}>
                        {activities.map((activity) => (
                          <div key={activity.id} className={styles.activity}>
                            <div className={styles.activityHeader}>
                              <div className={styles.activityUser}>
                                {activity.user_name || 'Система'}
                              </div>
                              <div className={styles.activityDate}>
                                {dateFormatter(activity.created_at)}
                              </div>
                            </div>
                            <div className={styles.activityDescription}>
                              {activity.description || activity.activity_type}
                            </div>
                            <span className={styles.activityType}>{activity.activity_type}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'tasks' && (
                  <>
                    {tasksLoading ? (
                      <div className={styles.loading}>Загрузка задач...</div>
                    ) : tasks.length === 0 ? (
                      <div className={styles.emptyState}>
                        <div className={styles.emptyStateIcon}>✓</div>
                        <div className={styles.emptyStateText}>Задач пока нет</div>
                      </div>
                    ) : (
                      <div className={styles.tasksList}>
                        {tasks.map((task) => (
                          <div
                            key={task.id}
                            className={`${styles.task} ${task.is_completed ? styles.completed : ''}`}
                          >
                            <input
                              type="checkbox"
                              className={styles.taskCheckbox}
                              checked={task.is_completed}
                              onChange={() => handleToggleTask(task.id, task.is_completed)}
                            />
                            <div className={styles.taskContent}>
                              <div className={`${styles.taskTitle} ${task.is_completed ? styles.completedTitle : ''}`}>
                                {task.title}
                              </div>
                              <div className={styles.taskMeta}>
                                {task.assigned_name && <span>👤 {task.assigned_name}</span>}
                                {task.due_date && (
                                  <span>📅 {dateFormatter(task.due_date)}</span>
                                )}
                                {task.priority && (
                                  <span
                                    className={`${styles.priorityBadge} ${
                                      task.priority === 'high'
                                        ? styles.priorityHigh
                                        : task.priority === 'medium'
                                        ? styles.priorityMedium
                                        : styles.priorityLow
                                    }`}
                                  >
                                    {task.priority === 'high'
                                      ? 'Высокий'
                                      : task.priority === 'medium'
                                      ? 'Средний'
                                      : 'Низкий'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className={styles.rightColumn}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Статус</h3>
              </div>
              <select
                className={styles.select}
                value={lead.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                style={{
                  backgroundColor: `${statusMeta.accent}15`,
                  color: statusMeta.accent,
                  fontWeight: 600,
                }}
              >
                {Object.entries(leadStatusMeta).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Менеджер</h3>
              </div>
              <select
                className={styles.select}
                value={lead.assigned_to || ''}
                onChange={(e) => handleManagerChange(e.target.value)}
              >
                <option value="">Не назначен</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {[user.first_name, user.last_name].filter(Boolean).join(' ') || user.email}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Задачи по лиду</h3>
              </div>

              {showTaskForm ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className={styles.select}
                    placeholder="Название задачи..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className={styles.commentSubmit}
                      onClick={handleCreateTask}
                      disabled={!newTaskTitle.trim()}
                      style={{ flex: 1 }}
                    >
                      Создать
                    </button>
                    <button
                      className={styles.actionButton}
                      onClick={() => {
                        setShowTaskForm(false);
                        setNewTaskTitle('');
                      }}
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className={styles.addTaskButton}
                  onClick={() => setShowTaskForm(true)}
                >
                  + Напоминание
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default LeadDetail;
