import React, { useEffect, useMemo, useState } from 'react';
import AppLayout from '../../layouts/AppLayout';
import GroupModal from './GroupModal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useGroups, CreateGroupDto, UpdateGroupDto } from '../../hooks/useGroups';
import { useProducts } from '../../hooks/useProducts';
import { Group, GroupStatus } from '../../types';
import { useToast } from '../../components/ui/toastContext';
import { useAuthStore } from '../../store/authStore';
import { Navigate } from 'react-router-dom';
import styles from '../products/Products.module.css';
import groupStyles from './Groups.module.css';

const pageSizeOptions = [25, 50, 100];
type SortColumn = 'created_at' | 'updated_at' | 'name' | 'start_date' | 'status';

const dateFormatter = (value: string | null | undefined) => {
  if (!value) return '—';
  const date = new Date(value);
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  };
  return date.toLocaleDateString('ru-RU', options).replace('.', '');
};

const groupStatusLabels: Record<GroupStatus, string> = {
  open: 'Набор открыт',
  full: 'Набор закрыт',
  closed: 'Набор закрыт',
  cancelled: 'Отменено',
};

const groupStatusColors: Record<GroupStatus, string> = {
  open: groupStyles.statusOpen,
  full: groupStyles.statusClosed,
  closed: groupStyles.statusClosed,
  cancelled: groupStyles.statusCancelled,
};

const Groups: React.FC = () => {
  const tenant = useAuthStore((state) => state.tenant);
  const groupsModuleEnabled = tenant?.settings?.modules?.groups ?? false;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | GroupStatus>('all');
  const [productFilter, setProductFilter] = useState<'all' | string>('all');
  const [pageSize, setPageSize] = useState(pageSizeOptions[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<SortColumn>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, loading, error, setFilters, createGroup, updateGroup, deleteGroup } = useGroups({
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    product_id: productFilter !== 'all' ? productFilter : undefined,
    sort_by: sortColumn,
    sort_direction: sortDirection,
    page: currentPage,
    page_size: pageSize,
  });

  const { data: productsData } = useProducts({ type: 'course', status: 'active', page_size: 100 });

  const { success: showToastSuccess, error: showToastError } = useToast();
  const [optimisticGroups, setOptimisticGroups] = useState<Group[]>([]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedRows([]);
  }, [searchTerm, statusFilter, productFilter, pageSize, sortColumn, sortDirection]);

  useEffect(() => {
    setFilters({
      search: searchTerm || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      product_id: productFilter !== 'all' ? productFilter : undefined,
      sort_by: sortColumn,
      sort_direction: sortDirection,
      page: currentPage,
      page_size: pageSize,
    });
  }, [searchTerm, statusFilter, productFilter, sortColumn, sortDirection, currentPage, pageSize, setFilters]);

  useEffect(() => {
    if (data?.groups) {
      setOptimisticGroups(data.groups);
      const validIds = new Set(data.groups.map((group) => group.id));
      setSelectedRows((prev) => prev.filter((id) => validIds.has(id)));
    } else if (!loading) {
      setOptimisticGroups([]);
      setSelectedRows([]);
    }
  }, [data?.groups, loading]);

  const groups = optimisticGroups;
  const total = data?.total || 0;
  const totalPages = data?.total_pages || 1;

  const selectedGroups = useMemo(
    () => groups.filter((group) => selectedRows.includes(group.id)),
    [groups, selectedRows]
  );

  const selectedGroupCount = selectedGroups.length;

  const isAllSelected = groups.length > 0 && groups.every((group) => selectedRows.includes(group.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedRows([]);
    } else {
      setSelectedRows(groups.map((group) => group.id));
    }
  };

  const toggleRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection(column === 'name' ? 'asc' : 'desc');
    }
  };

  const handleCreateGroup = async (groupData: CreateGroupDto) => {
    try {
      await createGroup(groupData);
      showToastSuccess('Группа успешно создана');
    } catch (error: any) {
      showToastError(error.message || 'Не удалось создать группу');
      throw error;
    }
  };

  const handleUpdateGroup = async (groupData: UpdateGroupDto) => {
    if (!editingGroup) return;

    try {
      await updateGroup(editingGroup.id, groupData);
      showToastSuccess('Группа успешно обновлена');
      setEditingGroup(null);
    } catch (error: any) {
      showToastError(error.message || 'Не удалось обновить группу');
      throw error;
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const deletePromises = selectedRows.map((id) => deleteGroup(id));
      await Promise.all(deletePromises);

      showToastSuccess(`Удалено групп: ${selectedRows.length}`);
      setSelectedRows([]);
      setIsDeleteModalOpen(false);
    } catch (error: any) {
      showToastError(error.message || 'Не удалось удалить группы');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditClick = (group: Group) => {
    setEditingGroup(group);
    setIsEditModalOpen(true);
  };

  const renderSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <span className={styles.sortIcon}>↕</span>;
    }
    return sortDirection === 'asc' ? (
      <span className={styles.sortIcon}>↑</span>
    ) : (
      <span className={styles.sortIcon}>↓</span>
    );
  };

  const renderCapacityProgress = (group: Group) => {
    if (!group.max_capacity) {
      return <span className={groupStyles.noLimit}>Без лимита</span>;
    }

    const percentage = (group.current_capacity / group.max_capacity) * 100;
    const isAlmostFull = percentage >= 80 && percentage < 100;
    const isFull = percentage >= 100;

    return (
      <div className={groupStyles.capacityContainer}>
        <div className={groupStyles.capacityBar}>
          <div
            className={`${groupStyles.capacityFill} ${
              isFull ? groupStyles.capacityFull : isAlmostFull ? groupStyles.capacityAlmostFull : ''
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <span className={groupStyles.capacityText}>
          {group.current_capacity} / {group.max_capacity}
        </span>
      </div>
    );
  };

  if (!groupsModuleEnabled) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AppLayout breadcrumbs={['Группы']}>
      <div className={styles.wrapper}>
        <div className={styles.pageHeader}>
          <div>
            <p className={styles.pageEyebrow}>УПРАВЛЕНИЕ</p>
            <h1>Группы и Потоки</h1>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.primaryButton} onClick={() => setIsAddModalOpen(true)}>
              + Создать группу
            </button>
          </div>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.searchBlock}>
            <div className={styles.searchField}>
              <span>🔍</span>
              <input
                type="text"
                placeholder="Поиск по названию"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className={styles.filters}>
              <label>
                <span>Статус</span>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
                  <option value="all">Все статусы</option>
                  <option value="open">Набор открыт</option>
                  <option value="full">Набор закрыт</option>
                  <option value="closed">Набор закрыт</option>
                  <option value="cancelled">Отменено</option>
                </select>
              </label>
              <label>
                <span>Продукт</span>
                <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)}>
                  <option value="all">Все продукты</option>
                  {productsData?.products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>

        {selectedGroupCount > 0 && (
          <div className={styles.bulkActionsBar}>
            <span className={styles.bulkCount}>Выбрано: {selectedGroupCount}</span>
            <div className={styles.bulkButtons}>
              <button
                className={styles.bulkDeleteButton}
                onClick={() => setIsDeleteModalOpen(true)}
              >
                🗑 Удалить
              </button>
            </div>
          </div>
        )}

        <div className={styles.tableCard}>
          {loading && groups.length === 0 ? (
            <div className={styles.loader}>Загрузка...</div>
          ) : error ? (
            <div className={styles.errorMessage}>{error}</div>
          ) : groups.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyIcon}>👥</p>
              <p className={styles.emptyTitle}>Нет групп</p>
              <p className={styles.emptySubtitle}>
                {searchTerm || statusFilter !== 'all' || productFilter !== 'all'
                  ? 'Попробуйте изменить фильтры'
                  : 'Создайте первую группу для управления потоками'}
              </p>
            </div>
          ) : (
            <>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.checkboxCell}>
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        aria-label="Выбрать все группы"
                      />
                    </th>
                    <th
                      className={styles.sortableHeader}
                      onClick={() => handleSort('name')}
                      aria-sort={sortColumn === 'name' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      Название {renderSortIcon('name')}
                    </th>
                    <th>Продукт</th>
                    <th
                      className={styles.sortableHeader}
                      onClick={() => handleSort('start_date')}
                      aria-sort={sortColumn === 'start_date' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      Дата старта {renderSortIcon('start_date')}
                    </th>
                    <th>Занятость</th>
                    <th
                      className={styles.sortableHeader}
                      onClick={() => handleSort('status')}
                      aria-sort={sortColumn === 'status' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      Статус {renderSortIcon('status')}
                    </th>
                    <th
                      className={styles.sortableHeader}
                      onClick={() => handleSort('created_at')}
                      aria-sort={sortColumn === 'created_at' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      Создана {renderSortIcon('created_at')}
                    </th>
                    <th className={styles.actionsCell}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => (
                    <tr key={group.id} className={styles.tableRow}>
                      <td className={styles.checkboxCell}>
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(group.id)}
                          onChange={() => toggleRow(group.id)}
                          aria-label={`Выбрать группу ${group.name}`}
                        />
                      </td>
                      <td className={styles.nameCell}>
                        <div className={styles.productName}>{group.name}</div>
                      </td>
                      <td>
                        <span className={styles.typeBadge}>
                          {group.product_name || '—'}
                        </span>
                      </td>
                      <td className={styles.dateCell}>{dateFormatter(group.start_date)}</td>
                      <td>{renderCapacityProgress(group)}</td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${groupStatusColors[group.status]}`}
                        >
                          {groupStatusLabels[group.status]}
                        </span>
                      </td>
                      <td className={styles.dateCell}>{dateFormatter(group.created_at)}</td>
                      <td className={styles.actionsCell}>
                        <button
                          className={styles.actionButton}
                          onClick={() => handleEditClick(group)}
                          aria-label={`Редактировать группу ${group.name}`}
                        >
                          ✏️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className={styles.pagination}>
                <div className={styles.paginationInfo}>
                  Показано {(currentPage - 1) * pageSize + 1}–
                  {Math.min(currentPage * pageSize, total)} из {total}
                </div>
                <div className={styles.paginationControls}>
                  <label className={styles.pageSizeSelector}>
                    <span>Показывать:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value) as 25 | 50 | 100);
                        setCurrentPage(1);
                      }}
                    >
                      {pageSizeOptions.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className={styles.pageButtons}>
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className={styles.pageButton}
                    >
                      ←
                    </button>
                    <span className={styles.pageNumber}>
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className={styles.pageButton}
                    >
                      →
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <GroupModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateGroup}
        products={productsData?.products || []}
        mode="create"
      />

      <GroupModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingGroup(null);
        }}
        onSubmit={handleUpdateGroup}
        products={productsData?.products || []}
        group={editingGroup}
        mode="edit"
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Удалить группы"
        message={`Вы уверены, что хотите удалить выбранные группы (${selectedGroupCount})? Это действие нельзя отменить.`}
        confirmLabel={isDeleting ? 'Удаление...' : 'Удалить'}
        cancelLabel="Отмена"
        onConfirm={handleBulkDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        variant="danger"
      />
    </AppLayout>
  );
};

export default Groups;
