import React from 'react';
import styles from './Badge.module.css';

export type BadgeVariant = 'primary' | 'success' | 'error' | 'warning' | 'info' | 'neutral';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  children: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  dot = false,
  children,
  className = '',
  ...rest
}) => {
  const classNames = [
    styles.badge,
    styles[variant],
    styles[size],
    dot && styles.hasDot,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classNames} {...rest}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {children}
    </span>
  );
};

export default Badge;
