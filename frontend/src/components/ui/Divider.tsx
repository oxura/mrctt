import React from 'react';
import styles from './Divider.module.css';

export interface DividerProps extends React.HTMLAttributes<HTMLHRElement> {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed' | 'dotted';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  label?: string;
}

const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  variant = 'solid',
  spacing = 'md',
  label,
  className = '',
  ...rest
}) => {
  const classNames = [
    styles.divider,
    styles[orientation],
    styles[variant],
    styles[`spacing-${spacing}`],
    label && styles.withLabel,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (label && orientation === 'horizontal') {
    return (
      <div className={classNames} role="separator" aria-label={label} {...rest}>
        <span className={styles.label}>{label}</span>
      </div>
    );
  }

  return <hr className={classNames} role="separator" {...rest} />;
};

export default Divider;
