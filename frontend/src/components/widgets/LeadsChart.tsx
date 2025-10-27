import React, { useMemo } from 'react';
import styles from './LeadsChart.module.css';

interface LeadsChartDataPoint {
  date: string;
  count: number;
}

interface LeadsChartProps {
  data: LeadsChartDataPoint[];
  loading?: boolean;
  error?: string;
}

const CHART_PADDING = {
  top: 20,
  right: 16,
  bottom: 14,
  left: 16,
};

const LeadsChart: React.FC<LeadsChartProps> = ({ data, loading, error }) => {
  const gradientId = useMemo(
    () => `lineGradient-${Math.random().toString(36).slice(2, 9)}`,
    []
  );

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

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3>Поступление лидов (30 дней)</h3>
        </div>
        <div className={styles.errorState}>{error || 'Не удалось загрузить данные'}</div>
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
  const minWidth = 800;
  const chartWidth = Math.max(data.length * 30, minWidth);
  const segments = Math.max(data.length - 1, 1);

  const points = data.map((point, index) => {
    const x = (index / segments) * (chartWidth - CHART_PADDING.left - CHART_PADDING.right) + CHART_PADDING.left;
    const y = chartHeight - CHART_PADDING.bottom - ((point.count / maxCount) * (chartHeight - CHART_PADDING.top - CHART_PADDING.bottom));
    return { x, y, count: point.count };
  });

  const linePath = points
    .map((point, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${command} ${point.x} ${point.y}`;
    })
    .join(' ');

  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - CHART_PADDING.bottom} L ${points[0].x} ${chartHeight - CHART_PADDING.bottom} Z`
    : '';

  const hasPoints = points.length > 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Поступление лидов (30 дней)</h3>
      </div>
      <div className={styles.chartWrapper}>
        <svg className={styles.chart} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          {/* Grid lines */}
          <g className={styles.grid}>
            {[0, 25, 50, 75, 100].map((percent) => {
              const y = chartHeight - CHART_PADDING.bottom - ((chartHeight - CHART_PADDING.top - CHART_PADDING.bottom) * percent / 100);
              return (
                <line
                  key={percent}
                  x1={CHART_PADDING.left}
                  y1={y}
                  x2={chartWidth - CHART_PADDING.right}
                  y2={y}
                  stroke="#e0e0e0"
                  strokeWidth="1"
                />
              );
            })}
          </g>

          {/* Area under the line */}
          {hasPoints && (
            <path
              d={areaPath}
              fill={`url(#${gradientId})`}
              opacity="0.2"
            />
          )}

          {/* Line */}
          {hasPoints && (
            <path
              d={linePath}
              fill="none"
              stroke="#4f46e5"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={styles.line}
            />
          )}

          {/* Data points */}
          <g className={styles.points}>
            {points.map((point, index) => (
              <g key={data[index].date}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill="#4f46e5"
                  stroke="#fff"
                  strokeWidth="2"
                  className={styles.point}
                />
                {point.count > 0 && (
                  <text
                    x={point.x}
                    y={point.y - 12}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#666"
                    className={styles.pointLabel}
                  >
                    {point.count}
                  </text>
                )}
              </g>
            ))}
          </g>

          {/* Gradient definition */}
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="1" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        <div className={styles.xAxis}>
          {data.map((point, index) => {
            // Show every 5th label and always show first and last points
            const shouldShowLabel = index === 0 || index === data.length - 1 || index % 5 === 0;
            if (!shouldShowLabel) return null;

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
