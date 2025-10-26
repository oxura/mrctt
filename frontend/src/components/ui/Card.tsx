import React from 'react';
import styles from './Card.module.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  hoverable = false,
  className = '',
  children,
  ...rest
}) => {
  const classNames = [
    styles.card,
    styles[variant],
    styles[`padding-${padding}`],
    hoverable && styles.hoverable,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} {...rest}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...rest
}) => {
  return (
    <div className={`${styles.header} ${className}`} {...rest}>
      {children}
    </div>
  );
};

export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...rest
}) => {
  return (
    <div className={`${styles.body} ${className}`} {...rest}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...rest
}) => {
  return (
    <div className={`${styles.footer} ${className}`} {...rest}>
      {children}
    </div>
  );
};

export default Card;
