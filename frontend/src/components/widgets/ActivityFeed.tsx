import React from 'react';
import styles from './ActivityFeed.module.css';

interface ActivityItem {
  id: string;
  title: string;
  timestamp: string;
  description: string;
  actor: string;
  avatar?: string;
}

interface ActivityFeedProps {
  items: ActivityItem[];
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ items }) => {
  return (
    <div className={styles.container}>
      <h3>Лента событий</h3>
      <div className={styles.list}>
        {items.map((item) => (
          <div key={item.id} className={styles.item}>
            <div className={styles.avatar}>{item.avatar || item.actor[0]}</div>
            <div className={styles.content}>
              <div className={styles.title}>{item.title}</div>
              <div className={styles.description}>{item.description}</div>
              <div className={styles.meta}>
                <span>{item.actor}</span>
                <span>•</span>
                <time>{item.timestamp}</time>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityFeed;
