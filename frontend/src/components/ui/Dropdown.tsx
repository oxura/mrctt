import React, { useState, useRef, useEffect } from 'react';
import styles from './Dropdown.module.css';

export interface DropdownItem {
  label: string;
  value: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
  closeOnSelect?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  placement = 'bottom-start',
  closeOnSelect = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled) return;
    item.onClick?.();
    if (closeOnSelect) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  return (
    <div className={styles.dropdown} ref={dropdownRef}>
      <div onClick={handleToggle} className={styles.trigger}>
        {trigger}
      </div>
      {isOpen && (
        <div className={`${styles.menu} ${styles[placement]}`} role="menu">
          {items.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`${styles.item} ${item.disabled ? styles.disabled : ''}`}
              onClick={() => handleItemClick(item)}
              disabled={item.disabled}
              role="menuitem"
            >
              {item.icon && <span className={styles.icon}>{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
