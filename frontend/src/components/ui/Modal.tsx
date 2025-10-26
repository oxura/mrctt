import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import styles from './Modal.module.css';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEsc = true,
  children,
}) => {
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose, closeOnEsc]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  const modal = (
    <div className={styles.overlay} onClick={handleOverlayClick} role="dialog" aria-modal="true">
      <div className={`${styles.modal} ${styles[size]}`}>
        {title && (
          <div className={styles.header}>
            <h3 className={styles.title}>{title}</h3>
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Закрыть модальное окно"
            >
              ✕
            </button>
          </div>
        )}
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
};

export const ModalHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...rest
}) => {
  return (
    <div className={`${styles.modalHeader} ${className}`} {...rest}>
      {children}
    </div>
  );
};

export const ModalBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...rest
}) => {
  return (
    <div className={`${styles.modalBody} ${className}`} {...rest}>
      {children}
    </div>
  );
};

export const ModalFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...rest
}) => {
  return (
    <div className={`${styles.modalFooter} ${className}`} {...rest}>
      {children}
    </div>
  );
};

export default Modal;
