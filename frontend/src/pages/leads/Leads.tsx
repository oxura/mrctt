import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../layouts/AppLayout';
import AddLeadModal from '../../components/modals/AddLeadModal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useLeads, Lead, CreateLeadDto } from '../../hooks/useLeads';
import { useUsers } from '../../hooks/useUsers';
import { leadStatusMeta } from '../../data/leads';
import { useToast } from '../../components/ui/toastContext';
import styles from './Leads.module.css';

const pageSizeOptions = [25, 50, 100];
const viewModes = [
  { id: 'list', label: 'Таблица' },
  { id: 'board', label: 'Канбан' },
] as const;

type ViewMode = (typeof viewModes)[number]['id'];
type SortColumn = 'created_at' | 'first_name' | 'status';

const currencyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

const dateFormatter = (value: string, withTime = true) => {
  const date = new Date(value);
  const options: Intl.DateTimeFormatOptions = withTime
    ? { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('ru-RU', options).replace('.', '');
};

const Leads: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | string>('all');
  const [managerFilter, setManagerFilter] = useState<'all' | string>('all');
  const [pageSize, setPageSize] = useState(pageSizeOptions[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<SortColumn>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, loading, error, setFilters, createLead, updateLeadStatus, deleteLead } = useLeads({
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    assigned_to: managerFilter !== 'all' ? managerFilter : undefined,
    sort_by: sortColumn,
    sort_direction: sortDirection,
    page: currentPage,
    page_size: pageSize,
  });
  const { users } = useUsers();
  const { success: showToastSuccess, error: showToastError } = useToast();
  const [optimisticLeads, setOptimisticLeads] = useState<Lead[]>([]);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedRows([]);
  }, [searchTerm, statusFilter, managerFilter, pageSize, sortColumn, sortDirection]);

  useEffect(() => {
    if (viewMode === 'board' && selectedRows.length > 0) {
      setSelectedRows([]);
    }
  }, [viewMode, selectedRows.length]);

  useEffect(() => {
    setFilters({
      search: searchTerm || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      assigned_to: managerFilter !== 'all' ? managerFilter : undefined,
      sort_by: sortColumn,
      sort_direction: sortDirection,
      page: currentPage,
      page_size: pageSize,
    });
  }, [searchTerm, statusFilter, managerFilter, sortColumn, sortDirection, currentPage, pageSize, setFilters]);

  useEffect(() => {
    if (data?.leads) {
      setOptimisticLeads(data.leads);
      const validIds = new Set(data.leads.map((lead) => lead.id));
      setSelectedRows((prev) => prev.filter((id) => validIds.has(id)));
    } else if (!loading) {
      setOptimisticLeads([]);
      setSelectedRows([]);
    }
  }, [data?.leads, loading]);

  const getUserDisplayName = (userId: string | null, fallback?: string | null) => {
    if (!userId) return fallback ?? '';
    const user = users.find((item) => item.id === userId);
    if (!user) return fallback ?? '';
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
    return fullName || user.email;
  };

  const pluralizeLead = (count: number) => {
    const mod10 = count % 10;
    const mod100 = count % 100;

    if (mod10 === 1 && mod100 !== 11) {
      return `${count} лид`;
    }

    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
      return `${count} лида`;
    }

    return `${count} лидов`;
  };

  const managerOptions = useMemo(() => {
    return users
      .map((user) => ({
        id: user.id,
        name: [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || user.email,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }, [users]);

  const leads = optimisticLeads;
  const total = data?.total || 0;
  const totalPages = data?.total_pages || 1;

  const getLeadDisplayName = (lead: Lead) => {
    const parts = [lead.first_name, lead.last_name].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Без имени';
  };

  const selectedLeads = useMemo(
    () => leads.filter((lead) => selectedRows.includes(lead.id)),
    [leads, selectedRows]
  );

  const selectedLeadCount = selectedLeads.length;

  const sampleLeadNames = useMemo(() => {
    return selectedLeads.slice(0, 3).map((lead) => getLeadDisplayName(lead));
  }, [selectedLeads]);

  const deleteModalMessage = useMemo(() => {
    if (selectedLeadCount === 0) {
      return 'Нет лидов для удаления.';
    }

    const countLabel = pluralizeLead(selectedLeadCount);
    const base = selectedLeadCount === 1 ? 'Будет удален' : 'Будут удалены';
    const examples = sampleLeadNames.join(', ');
    const remaining = Math.max(selectedLeadCount - sampleLeadNames.length, 0);

    if (!examples) {
      return `${base} ${countLabel}.`;
    }

    if (remaining > 0) {
      return `${base} ${countLabel}. Например: ${examples} и еще ${pluralizeLead(remaining)}.`;
    }

    return `${base} ${countLabel}: ${examples}.`;
  }, [selectedLeadCount, sampleLeadNames]);

  const isAllSelected = leads.length > 0 && leads.every((lead) => selectedRows.includes(lead.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedRows([]);
    } else {
      setSelectedRows(leads.map((lead) => lead.id));
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
      setSortDirection(column === 'first_name' ? 'asc' : 'desc');
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const currentLeadsIds = new Set(optimisticLeads.map((lead) => lead.id));
      const validSelectedIds = selectedRows.filter((id) => currentLeadsIds.has(id));

      if (validSelectedIds.length === 0) {
        showToastError('Выбранные лиды недоступны для удаления');
        setSelectedRows([]);
        setIsDeleteModalOpen(false);
        return;
      }

      const results = await Promise.allSettled(validSelectedIds.map((id) => deleteLead(id)));

      const failedIds: string[] = [];
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          failedIds.push(validSelectedIds[index]);
        }
      });

      const successCount = validSelectedIds.length - failedIds.length;

      if (successCount > 0) {
        showToastSuccess(`Удалено лидов: ${successCount}`);
      }

      if (failedIds.length > 0) {
        showToastError(`Не удалось удалить ${failedIds.length} лидов`);
        setSelectedRows((prev) => prev.filter((id) => failedIds.includes(id)));
      } else {
        setSelectedRows([]);
        setIsDeleteModalOpen(false);
      }
    } catch (err: any) {
      showToastError(err?.message || 'Не удалось удалить лиды');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddLead = async (leadData: CreateLeadDto) => {
    await createLead(leadData);
  };

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    if (isStatusUpdating) {
      e.preventDefault();
      return;
    }

    setDraggedLeadId(leadId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (isStatusUpdating) {
      return;
    }

    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();

    if (!draggedLeadId || isStatusUpdating) {
      return;
    }

    const currentLead = leads.find((lead) => lead.id === draggedLeadId);

    if (!currentLead) {
      setDraggedLeadId(null);
      return;
    }

    if (currentLead.status === newStatus) {
      setDraggedLeadId(null);
      return;
    }

    const previousState = leads.map((lead) => ({ ...lead }));
    const statusMeta = leadStatusMeta[newStatus as keyof typeof leadStatusMeta];

    setIsStatusUpdating(true);
    setOptimisticLeads((prev) =>
      prev.map((lead) => (lead.id === draggedLeadId ? { ...lead, status: newStatus } : lead))
    );

    try {
      await updateLeadStatus(draggedLeadId, newStatus);
      const statusLabel = statusMeta?.label || newStatus;
      showToastSuccess(`Лид «${getLeadDisplayName(currentLead)}» перемещен в «${statusLabel}».`);
    } catch (err) {
      console.error('Failed to update status:', err);
      setOptimisticLeads(previousState);
      showToastError('Не удалось обновить статус лида. Попробуйте снова.');
    } finally {
      setDraggedLeadId(null);
      setIsStatusUpdating(false);
    }
  };

  const renderTableRows = (leadsToRender: Lead[]) => {
    return leadsToRender.map((lead) => {
      const statusMeta = leadStatusMeta[lead.status as keyof typeof leadStatusMeta] || {
        label: lead.status,
        description: '',
        accent: '#6b7280',
      };
      const assignedName = getUserDisplayName(lead.assigned_to, lead.assigned_name);

      return (
        <tr key={lead.id} className={styles.tableRow}>
          <td>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={selectedRows.includes(lead.id)}
                onChange={() => toggleRow(lead.id)}
                aria-label={`Выбрать лид ${getLeadDisplayName(lead)}`}
              />
              <span className={styles.customCheckbox} aria-hidden="true" />
            </label>
          </td>
          <td>
            <div className={styles.leadMainCell}>
              <div className={styles.leadName}>{getLeadDisplayName(lead)}</div>
              <div className={styles.leadMeta}>
                {lead.phone && <span>{lead.phone}</span>}
                {lead.email && <span>{lead.email}</span>}
              </div>
            </div>
          </td>
          <td>
            <span
              className={styles.statusChip}
              style={{ backgroundColor: `${statusMeta.accent}1a`, color: statusMeta.accent }}
            >
              {statusMeta.label}
            </span>
            <div className={styles.statusHint}>{statusMeta.description}</div>
          </td>
          <td>
            <div className={styles.tableProduct}>{lead.product_name || '—'}</div>
            {lead.group_name && <div className={styles.tableSub}>{lead.group_name}</div>}
          </td>
          <td>
            <div className={styles.managerBadge}>{assignedName || '—'}</div>
          </td>
          <td>
            <div>{dateFormatter(lead.created_at)}</div>
            {lead.custom_fields?.appointmentDate && (
              <div className={styles.tableSub}>
                Визит: {dateFormatter(lead.custom_fields.appointmentDate)}
              </div>
            )}
          </td>
          <td>
            <div>{lead.source || '—'}</div>
            {lead.utm_source && <div className={styles.tableSub}>utm: {lead.utm_source}</div>}
          </td>
          <td>
            {lead.custom_fields?.value ? (
              <div className={styles.value}>{currencyFormatter.format(lead.custom_fields.value)}</div>
            ) : (
              <span className={styles.tableSub}>—</span>
            )}
          </td>
          <td>
            <button
              type="button"
              className={styles.rowAction}
              aria-label={`Открыть лид ${getLeadDisplayName(lead)}`}
              onClick={() => navigate(`/leads/${lead.id}`)}
            >
              Открыть
            </button>
          </td>
        </tr>
      );
    });
  };

  const renderBoard = () => {
    const statuses = Object.keys(leadStatusMeta) as Array<keyof typeof leadStatusMeta>;
    const columns = statuses.map((status) => ({
      status,
      leads: leads.filter((lead) => lead.status === status),
    }));

    return (
      <div className={styles.board}>
        {columns.map((column) => {
          const statusMeta = leadStatusMeta[column.status];
          return (
            <section
              key={column.status}
              className={`${styles.boardColumn} ${isStatusUpdating ? styles.boardColumnDisabled : ''}`.trim()}
              onDragOver={(e) => {
                if (!isStatusUpdating) {
                  handleDragOver(e);
                }
              }}
              onDrop={(e) => handleDrop(e, column.status)}
              aria-disabled={isStatusUpdating}
            >
              <header
                className={styles.boardColumnHeader}
                style={{ borderColor: `${statusMeta.accent}40` }}
              >
                <div>
                  <h3>{statusMeta.label}</h3>
                  <p>{statusMeta.description}</p>
                </div>
                <span className={styles.boardCount}>{column.leads.length}</span>
              </header>

              <div className={styles.boardCards}>
                {column.leads.length === 0 ? (
                  <div className={styles.boardEmpty}>Лидов нет</div>
                ) : (
                  column.leads.map((lead) => (
                    <article
                      key={lead.id}
                      className={styles.boardCard}
                      draggable={!isStatusUpdating}
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                    >
                      <header className={styles.boardCardHeader}>
                        <div>
                          <div className={styles.boardCardTitle}>{getLeadDisplayName(lead)}</div>
                          <div className={styles.boardCardMeta}>{lead.product_name || '—'}</div>
                        </div>
                        {lead.custom_fields?.value && (
                          <div className={styles.boardCardValue}>
                            {currencyFormatter.format(lead.custom_fields.value)}
                          </div>
                        )}
                      </header>

                      <div className={styles.boardCardInfo}>
                        {lead.phone && <span>📞 {lead.phone}</span>}
                        {lead.assigned_name && <span>👤 {lead.assigned_name}</span>}
                        <span>🕒 {dateFormatter(lead.created_at, false)}</span>
                        {lead.custom_fields?.appointmentDate && (
                          <span>📅 Прием: {dateFormatter(lead.custom_fields.appointmentDate)}</span>
                        )}
                        {lead.group_name && <span>🎓 {lead.group_name}</span>}
                      </div>

                      <footer className={styles.boardCardFooter}>
                        <button type="button">Связаться</button>
                        <button
                          type="button"
                          className={styles.boardPrimaryAction}
                          onClick={() => navigate(`/leads/${lead.id}`)}
                        >
                          Открыть карточку
                        </button>
                      </footer>
                    </article>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    );
  };

  return (
    <AppLayout breadcrumbs={['Лиды']}>
      <div className={styles.wrapper}>
        <header className={styles.pageHeader}>
          <div>
            <p className={styles.pageEyebrow}>CRM Pipeline</p>
            <h1>Лиды и сделки</h1>
          </div>
          <div className={styles.headerActions}>
            <button type="button" className={styles.secondaryButton}>
              Импорт CSV
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => setIsAddModalOpen(true)}
            >
              + Добавить лид
            </button>
          </div>
        </header>

        <section className={styles.toolbar}>
          <div className={styles.searchBlock}>
            <div className={styles.searchField}>
              <span aria-hidden="true">🔍</span>
              <input
                type="search"
                placeholder="Поиск по имени, телефону, email, продукту"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className={styles.filters}>
              <label>
                Статус
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Все</option>
                  {Object.entries(leadStatusMeta).map(([status, meta]) => (
                    <option key={status} value={status}>
                      {meta.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Менеджер
                <select
                  value={managerFilter}
                  onChange={(e) => setManagerFilter(e.target.value)}
                >
                  <option value="all">Все</option>
                  {managerOptions.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Отображать по
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                >
                  {pageSizeOptions.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className={styles.viewSwitch}>
            {viewModes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setViewMode(mode.id)}
                className={`${styles.viewSwitchButton} ${viewMode === mode.id ? styles.viewSwitchActive : ''}`}
                aria-pressed={viewMode === mode.id}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </section>

        {selectedRows.length > 0 && (
          <section className={styles.bulkActions}>
            <div>Выбрано: {selectedRows.length}</div>
            <div className={styles.bulkButtons}>
              <button
                type="button"
                className={styles.dangerButton}
                onClick={() => setIsDeleteModalOpen(true)}
              >
                Удалить выбранные
              </button>
            </div>
            <button
              type="button"
              className={styles.clearSelection}
              onClick={() => setSelectedRows([])}
            >
              Снять выделение
            </button>
          </section>
        )}

        {loading && <div className={styles.loading}>Загрузка...</div>}
        {error && <div className={styles.error}>Ошибка: {error}</div>}

        {!loading && !error && (
          <>
            {viewMode === 'list' ? (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={toggleSelectAll}
                            aria-label={
                              isAllSelected
                                ? 'Снять выделение со всех лидов в таблице'
                                : 'Выбрать всех лидов в таблице'
                            }
                          />
                          <span className={styles.customCheckbox} aria-hidden="true" />
                        </label>
                      </th>
                      <th>
                        <button
                          type="button"
                          onClick={() => handleSort('first_name')}
                          className={styles.sortButton}
                        >
                          Лид
                          <span aria-hidden="true">
                            {sortColumn === 'first_name'
                              ? sortDirection === 'asc'
                                ? '▲'
                                : '▼'
                              : '↕'}
                          </span>
                        </button>
                      </th>
                      <th>
                        <button
                          type="button"
                          onClick={() => handleSort('status')}
                          className={styles.sortButton}
                        >
                          Статус
                          <span aria-hidden="true">
                            {sortColumn === 'status'
                              ? sortDirection === 'asc'
                                ? '▲'
                                : '▼'
                              : '↕'}
                          </span>
                        </button>
                      </th>
                      <th>Продукт</th>
                      <th>Ответственный</th>
                      <th>
                        <button
                          type="button"
                          onClick={() => handleSort('created_at')}
                          className={styles.sortButton}
                        >
                          Дата
                          <span aria-hidden="true">
                            {sortColumn === 'created_at'
                              ? sortDirection === 'asc'
                                ? '▲'
                                : '▼'
                              : '↕'}
                          </span>
                        </button>
                      </th>
                      <th>Источник</th>
                      <th>Сумма</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.length === 0 ? (
                      <tr>
                        <td colSpan={9} className={styles.emptyState}>
                          Лиды не найдены. Попробуйте изменить фильтры или добавьте первый лид.
                        </td>
                      </tr>
                    ) : (
                      renderTableRows(leads)
                    )}
                  </tbody>
                </table>

                {leads.length > 0 && (
                  <footer className={styles.pagination}>
                    <div>
                      Показано {(currentPage - 1) * pageSize + 1}–
                      {Math.min(currentPage * pageSize, total)} из {total}
                    </div>
                    <div className={styles.paginationControls}>
                      <button
                        type="button"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Назад
                      </button>
                      <div className={styles.paginationPages}>
                        {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                          (pageNumber) => (
                            <button
                              key={pageNumber}
                              type="button"
                              onClick={() => setCurrentPage(pageNumber)}
                              className={pageNumber === currentPage ? styles.currentPage : ''}
                            >
                              {pageNumber}
                            </button>
                          )
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Далее
                      </button>
                    </div>
                  </footer>
                )}
              </div>
            ) : (
              renderBoard()
            )}
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!isDeleting) {
            setIsDeleteModalOpen(false);
          }
        }}
        onConfirm={handleBulkDelete}
        title="Удалить выбранные лиды?"
        message={deleteModalMessage}
        confirmText={selectedLeadCount > 0 ? `Удалить ${pluralizeLead(selectedLeadCount)}` : 'Удалить'}
        cancelText="Отмена"
        variant="danger"
        loading={isDeleting}
      />

      <AddLeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddLead}
      />
    </AppLayout>
  );
};

export default Leads;
