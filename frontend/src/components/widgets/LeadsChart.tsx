import React from 'react';
import styles from './LeadsChart.module.css';

interface LeadsChartDataPoint {
  date: string;
  count: number;
}

interface LeadsChartProps {
  data: LeadsChartDataPoint[];
  loading?: boolean;
}

const LeadsChart: React.FC<LeadsChartProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3>Поступление лидов (30 дней)</h3>
        </div>
        <div className={styles.loadingState}>Загрузка данных...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3>Поступление лидов (30 дней)</h3>
        </div>
        <div className={styles.emptyState}>Нет данных для отображения</div>
      </div>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const chartHeight = 200;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Поступление лидов (30 дней)</h3>
      </div>
      <div className={styles.chartWrapper}>
        <svg className={styles.chart} viewBox={`0 0 ${data.length * 20} ${chartHeight}`}>
          {/* Grid lines */}
          <g className={styles.grid}>
            {[0, 25, 50, 75, 100].map((percent) => {
              const y = chartHeight - (chartHeight * percent / 100);
              return (
                <line
                  key={percent}
                  x1="0"
                  y1={y}
                  x2={data.length * 20}
                  y2={y}
                  stroke="#e0e0e0"
                  strokeWidth="1"
                />
              );
            })}
          </g>

          {/* Bars */}
          <g className={styles.bars}>
            {data.map((point, index) => {
              const barHeight = (point.count / maxCount) * (chartHeight - 20);
              const x = index * 20 + 5;
              const y = chartHeight - barHeight - 10;

              return (
                <g key={point.date}>
                  <rect
                    x={x}
                    y={y}
                    width="10"
                    height={barHeight}
                    fill="#4f46e5"
                    className={styles.bar}
                    data-count={point.count}
                  />
                  {point.count > 0 && (
                    <text
                      x={x + 5}
                      y={y - 5}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#666"
                      className={styles.barLabel}
                    >
                      {point.count}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        <div className={styles.xAxis}>
          {data.map((point, index) => {
            // Show every 5th label to avoid clutter
            if (index % 5 !== 0) return null;

            const date = new Date(point.date);
            const label = `${date.getDate()}.${date.getMonth() + 1}`;

            return (
              <span key={point.date} className={styles.xLabel}>
                {label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LeadsChart;
