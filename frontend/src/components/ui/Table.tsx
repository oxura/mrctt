import React, { useState, useMemo, useEffect } from 'react';
import styles from './Table.module.css';
import Button, { type ButtonVariant } from './Button';
import Input from './Input';
import Select from './Select';
import Checkbox from './Checkbox';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

export interface FilterOption {
  key: string;
  label: string;
  options: Array<{ value: string; label: string }>;
}

export interface BulkAction {
  label: string;
  icon?: React.ReactNode;
  onClick: (selectedIds: string[]) => void;
  variant?: ButtonVariant;
}

export interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  pageSize?: 25 | 50 | 100;
  showSearch?: boolean;
  searchPlaceholder?: string;
  filters?: FilterOption[];
  bulkActions?: BulkAction[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

function Table<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  pageSize: initialPageSize = 25,
  showSearch = true,
  searchPlaceholder = 'Поиск...',
  filters = [],
  bulkActions = [],
  onRowClick,
  emptyMessage = 'Нет данных для отображения',
}: TableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    null
  );
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setPageSize(initialPageSize);
    setCurrentPage(1);
  }, [initialPageSize]);

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    if (searchQuery) {
      result = result.filter((row) =>
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    Object.entries(filterValues).forEach(([key, value]) => {
      if (value) {
        result = result.filter((row) => String(row[key]) === value);
      }
    });

    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [data, searchQuery, filterValues, sortConfig]);

  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = filteredAndSortedData.slice(startIndex, endIndex);
  const paginatedIds = paginatedData.map((row) => keyExtractor(row));
  const hasData = filteredAndSortedData.length > 0;
  const displayStart = hasData ? startIndex + 1 : 0;
  const displayEnd = hasData ? Math.min(endIndex, filteredAndSortedData.length) : 0;

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds((prev) => {
      if (paginatedIds.length === 0) {
        return prev;
      }
      const next = new Set(prev);
      const allPageSelected = paginatedIds.every((id) => next.has(id));

      if (allPageSelected) {
        paginatedIds.forEach((id) => next.delete(id));
      } else {
        paginatedIds.forEach((id) => next.add(id));
      }

      return next;
    });
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(Number(newSize) as 25 | 50 | 100);
    setCurrentPage(1);
  };

  const allSelected = paginatedIds.length > 0 && paginatedIds.every((id) => selectedIds.has(id));
  const someSelected = paginatedIds.some((id) => selectedIds.has(id)) && !allSelected;

  useEffect(() => {
    const nextTotalPages = Math.max(1, Math.ceil(filteredAndSortedData.length / pageSize));
    if (currentPage > nextTotalPages) {
      setCurrentPage(nextTotalPages);
    }
  }, [filteredAndSortedData.length, pageSize, currentPage]);

  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const validIds = new Set<string>();
      const dataIds = new Set(filteredAndSortedData.map((row) => keyExtractor(row)));
      prev.forEach((id) => {
        if (dataIds.has(id)) {
          validIds.add(id);
        }
      });
      return validIds.size === prev.size ? prev : validIds;
    });
  }, [filteredAndSortedData, keyExtractor]);

  return (
    <div className={styles.container}>
      {(showSearch || filters.length > 0) && (
        <div className={styles.toolbar}>
          {showSearch && (
            <div className={styles.searchWrapper}>
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                leftIcon="🔍"
              />
            </div>
          )}
          {filters.length > 0 && (
            <div className={styles.filters}>
              {filters.map((filter) => (
                <Select
                  key={filter.key}
                  options={[{ value: '', label: filter.label }, ...filter.options]}
                  value={filterValues[filter.key] || ''}
                  onChange={(e) => {
                    setFilterValues((prev) => ({ ...prev, [filter.key]: e.target.value }));
                    setCurrentPage(1);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {selectedIds.size > 0 && bulkActions.length > 0 && (
        <div className={styles.bulkActionsPanel}>
          <span className={styles.selectedCount}>Выбрано: {selectedIds.size}</span>
          <div className={styles.bulkActions}>
            {bulkActions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'secondary'}
                size="sm"
                leftIcon={action.icon}
                onClick={() => action.onClick(Array.from(selectedIds))}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {bulkActions.length > 0 && (
                <th className={styles.checkboxCell}>
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={() => handleSelectAll()}
                    aria-label="Выбрать все"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th key={column.key} className={styles.th}>
                  <div className={styles.thContent}>
                    <span>{column.label}</span>
                    {column.sortable && (
                      <button
                        type="button"
                        className={styles.sortButton}
                        onClick={() => handleSort(column.key)}
                        aria-label={`Сортировать по ${column.label}`}
                      >
                        {sortConfig?.key === column.key ? (
                          sortConfig.direction === 'asc' ? (
                            '↑'
                          ) : (
                            '↓'
                          )
                        ) : (
                          '↕'
                        )}
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (bulkActions.length > 0 ? 1 : 0)}
                  className={styles.emptyCell}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => {
                const rowId = keyExtractor(row);
                return (
                  <tr
                    key={rowId}
                    className={onRowClick ? styles.clickableRow : ''}
                    onClick={
                      onRowClick
                        ? (event) => {
                            if (!(event.target instanceof HTMLElement)) {
                              onRowClick(row);
                              return;
                            }

                            const interactiveElement = event.target.closest(
                              'a, button, input, textarea, select, label, [role="button"], [role="link"], [role="menuitem"], [data-prevent-row-click]'
                            );

                            if (interactiveElement) {
                              return;
                            }

                            onRowClick(row);
                          }
                        : undefined
                    }
                    tabIndex={onRowClick ? 0 : undefined}
                    onKeyDown={
                      onRowClick
                        ? (event) => {
                            const isActionKey =
                              event.key === 'Enter' ||
                              event.key === ' ' ||
                              event.key === 'Space' ||
                              event.key === 'Spacebar';

                            if (!isActionKey) {
                              return;
                            }

                            if (!(event.target instanceof HTMLElement)) {
                              event.preventDefault();
                              onRowClick(row);
                              return;
                            }

                            const interactiveElement = event.target.closest(
                              'a, button, input, textarea, select, label, [role="button"], [role="link"], [role="menuitem"], [data-prevent-row-click]'
                            );

                            if (interactiveElement) {
                              return;
                            }

                            event.preventDefault();
                            onRowClick(row);
                          }
                        : undefined
                    }
                  >
                    {bulkActions.length > 0 && (
                      <td 
                        className={styles.checkboxCell}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={selectedIds.has(rowId)}
                          onChange={() => handleSelectRow(rowId)}
                          aria-label={`Выбрать строку ${rowId}`}
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td key={column.key} className={styles.td}>
                        {column.render ? column.render(row[column.key], row) : row[column.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <div className={styles.paginationInfo}>
          <span>
            Показано {displayStart}-{displayEnd} из {filteredAndSortedData.length}
          </span>
          <Select
            options={[
              { value: '25', label: '25 на странице' },
              { value: '50', label: '50 на странице' },
              { value: '100', label: '100 на странице' },
            ]}
            value={String(pageSize)}
            onChange={(e) => handlePageSizeChange(e.target.value)}
          />
        </div>
        <div className={styles.paginationButtons}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Назад
          </Button>
          <span className={styles.pageIndicator}>
            {currentPage} / {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            Вперёд
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Table;
