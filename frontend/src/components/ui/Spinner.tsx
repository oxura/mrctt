import React from 'react';
import styles from './Spinner.module.css';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'white' | 'gray';
  label?: string;
  centered?: boolean;
}

const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  label = 'Загрузка...',
  centered = false,
}) => {
  const containerClasses = [styles.container, centered && styles.centered]
    .filter(Boolean)
    .join(' ');

  const spinnerClasses = [styles.spinner, styles[size], styles[variant]]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses} role="status">
      <span className={spinnerClasses} />
      <span className="sr-only">{label}</span>
    </div>
  );
};

export default Spinner;
