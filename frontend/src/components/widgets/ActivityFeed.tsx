import React from 'react';
import styles from './ActivityFeed.module.css';

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  actor_name: string;
  created_at: string;
}

interface ActivityFeedProps {
  items: ActivityItem[];
  loading?: boolean;
  error?: string;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ items, loading, error }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTitle = (type: string) => {
    const mapping: Record<string, string> = {
      status_change: 'Смена статуса лида',
      note_added: 'Добавлен комментарий',
      task_completed: 'Задача выполнена',
      task_created: 'Создана задача',
      lead_created: 'Новый лид',
      lead_assigned: 'Лид назначен менеджеру',
      lead_updated: 'Лид обновлен',
      comment_added: 'Добавлен комментарий',
    };

    return mapping[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <h3>Лента событий</h3>
        <div className={styles.loadingState}>Загрузка ленты...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h3>Лента событий</h3>
        <div className={styles.errorState}>{error || 'Не удалось загрузить данные'}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3>Лента событий</h3>
      {items.length === 0 ? (
        <div className={styles.emptyState}>Пока нет активности</div>
      ) : (
        <div className={styles.list}>
          {items.map((item) => (
            <div key={item.id} className={styles.item}>
              <div className={styles.avatar}>
                {item.actor_name?.[0]?.toUpperCase() || 'С'}
              </div>
              <div className={styles.content}>
                <div className={styles.title}>{formatTitle(item.type)}</div>
                {item.description && <div className={styles.description}>{item.description}</div>}
                <div className={styles.meta}>
                  <span>{item.actor_name || 'Система'}</span>
                  <span>•</span>
                  <time>{formatDate(item.created_at)}</time>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
