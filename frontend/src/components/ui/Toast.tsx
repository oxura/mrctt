import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import styles from './Toast.module.css';
import type { ToastType, ToastOptions, Toast } from './toastTypes';
import { ToastContext } from './toastContext';

export type { ToastType, ToastOptions, Toast } from './toastTypes';

const ToastIcon: React.FC<{ type: ToastType }> = ({ type }) => {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return <span className={styles.icon}>{icons[type]}</span>;
};

const ToastItem: React.FC<{ toast: Toast; onClose: (id: string) => void }> = ({
  toast,
  onClose,
}) => {
  return (
    <div className={`${styles.toast} ${styles[toast.type || 'info']}`} role="alert">
      <ToastIcon type={toast.type || 'info'} />
      <span className={styles.message}>{toast.message}</span>
      <button
        type="button"
        className={styles.closeButton}
        onClick={() => onClose(toast.id)}
        aria-label="Закрыть уведомление"
      >
        ✕
      </button>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    ({ id, type = 'info', message, duration = 5000 }: ToastOptions) => {
      const toastId = id || `toast-${Date.now()}-${Math.random()}`;
      const toast: Toast = { id: toastId, type, message, duration };

      setToasts((prevToasts) => [...prevToasts, toast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(toastId);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, duration?: number) => {
      addToast({ type: 'success', message, duration });
    },
    [addToast]
  );

  const error = useCallback(
    (message: string, duration?: number) => {
      addToast({ type: 'error', message, duration });
    },
    [addToast]
  );

  const warning = useCallback(
    (message: string, duration?: number) => {
      addToast({ type: 'warning', message, duration });
    },
    [addToast]
  );

  const info = useCallback(
    (message: string, duration?: number) => {
      addToast({ type: 'info', message, duration });
    },
    [addToast]
  );

  const toastContainer = toasts.length > 0 && (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  );

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, warning, info }}>
      {children}
      {toastContainer && ReactDOM.createPortal(toastContainer, document.body)}
    </ToastContext.Provider>
  );
};

export default ToastProvider;
