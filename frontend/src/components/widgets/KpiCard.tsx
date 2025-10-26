import React from 'react';
import styles from './KpiCard.module.css';

interface KpiCardProps {
  label: string;
  value: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  variant?: 'default' | 'danger';
}

const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  trend,
  trendDirection = 'neutral',
  variant = 'default',
}) => {
  const cardClassName = [styles.card, variant !== 'default' ? styles[variant] : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cardClassName}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>{value}</div>
      {trend && (
        <div className={`${styles.trend} ${styles[trendDirection]}`}>
          {trendDirection === 'up' && '▲'}
          {trendDirection === 'down' && '▼'}
          {trendDirection === 'neutral' && '■'}
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
};

export default KpiCard;
