import React from 'react';
import styles from './KpiCard.module.css';

interface KpiCardProps {
  label: string;
  value: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, trend, trendDirection = 'neutral' }) => {
  return (
    <div className={styles.card}>
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
