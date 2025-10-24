import { Fragment, ReactNode } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50 p-4">
      <div 
        className={`w-full ${sizeClasses[size]} animate-fadeIn rounded-2xl bg-white shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function ModalFooter({ onCancel, onConfirm, confirmText = 'Сохранить', cancelText = 'Отмена', loading = false }: {
  onCancel: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}) {
  return (
    <>
      <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
        {cancelText}
      </Button>
      <Button type="button" onClick={onConfirm} disabled={loading}>
        {loading ? 'Сохранение...' : confirmText}
      </Button>
    </>
  );
}
