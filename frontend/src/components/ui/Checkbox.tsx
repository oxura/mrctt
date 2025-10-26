import React from 'react';
import styles from './Checkbox.module.css';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  indeterminate?: boolean;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, helperText, className = '', id, indeterminate, ...rest }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = Boolean(error);
    const { checked, disabled, ...inputProps } = rest;

    const containerClasses = [styles.container, className]
      .filter(Boolean)
      .join(' ');

    const wrapperClasses = [
      styles.wrapper,
      hasError && styles.error,
      disabled && styles.disabled,
    ]
      .filter(Boolean)
      .join(' ');

    React.useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = Boolean(indeterminate && !checked);
      }
    }, [indeterminate, checked]);

    return (
      <div className={containerClasses}>
        <div className={wrapperClasses}>
          <input
            ref={inputRef}
            type="checkbox"
            id={checkboxId}
            className={styles.input}
            checked={checked}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={
              error
                ? `${checkboxId}-error`
                : helperText
                ? `${checkboxId}-helper`
                : undefined
            }
            {...inputProps}
          />
          <span className={styles.checkmark} aria-hidden="true">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M13.5 4L6 11.5L2.5 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          {label && (
            <label htmlFor={checkboxId} className={styles.label}>
              {label}
            </label>
          )}
        </div>
        {error && (
          <p id={`${checkboxId}-error`} className={styles.errorText} role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${checkboxId}-helper`} className={styles.helperText}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
