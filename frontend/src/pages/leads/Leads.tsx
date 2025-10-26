import React, { useEffect, useMemo, useState } from 'react';
import AppLayout from '../../layouts/AppLayout';
import styles from './Leads.module.css';
import {
  leadsMock,
  leadStatusMeta,
  LeadRecord,
  LeadStatus,
} from '../../data/leads';

const pageSizeOptions = [25, 50, 100];
const viewModes = [
  { id: 'list', label: 'Таблица' },
  { id: 'board', label: 'Канбан' },
] as const;

type ViewMode = (typeof viewModes)[number]['id'];

type SortColumn = 'createdAt' | 'name' | 'value' | 'status';

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
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | LeadStatus>('all');
  const [managerFilter, setManagerFilter] = useState<'all' | string>('all');
  const [pageSize, setPageSize] = useState(pageSizeOptions[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<SortColumn>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, managerFilter, pageSize]);

  useEffect(() => {
    if (viewMode === 'board' && selectedRows.length > 0) {
      setSelectedRows([]);
    }
  }, [viewMode, selectedRows.length]);

  const managerOptions = useMemo(() => {
    const managers = Array.from(new Set(leadsMock.map((lead) => lead.manager)));
    return managers.sort();
  }, []);

  const filteredLeads = useMemo(() => {
    return leadsMock.filter((lead) => {
      const matchesSearch = searchTerm.trim().length === 0
        ? true
        : [lead.name, lead.email, lead.phone, lead.product, lead.id]
            .join(' ')
            .toLowerCase()
            .includes(searchTerm.trim().toLowerCase());

      const matchesStatus = statusFilter === 'all' ? true : lead.status === statusFilter;
      const matchesManager = managerFilter === 'all' ? true : lead.manager === managerFilter;

      return matchesSearch && matchesStatus && matchesManager;
    });
  }, [searchTerm, statusFilter, managerFilter]);

  const sortedLeads = useMemo(() => {
    const leadsCopy = [...filteredLeads];

    leadsCopy.sort((a, b) => {
      let comparison = 0;

      if (sortColumn === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortColumn === 'value') {
        comparison = (a.value ?? 0) - (b.value ?? 0);
      } else if (sortColumn === 'name') {
        comparison = a.name.localeCompare(b.name, 'ru');
      } else if (sortColumn === 'status') {
        const order = Object.keys(leadStatusMeta) as LeadStatus[];
        comparison = order.indexOf(a.status) - order.indexOf(b.status);
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return leadsCopy;
  }, [filteredLeads, sortColumn, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedLeads.length / pageSize));
  const pageStartIndex = (currentPage - 1) * pageSize;
  const paginatedLeads = sortedLeads.slice(pageStartIndex, pageStartIndex + pageSize);
  const isAllSelected = paginatedLeads.length > 0 && paginatedLeads.every((lead) => selectedRows.includes(lead.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedRows((prev) => prev.filter((id) => !paginatedLeads.some((lead) => lead.id === id)));
    } else {
      const pageIds = paginatedLeads.map((lead) => lead.id);
      setSelectedRows((prev) => Array.from(new Set([...prev, ...pageIds])));
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

  const handleBulkAction = (action: 'delete' | 'status') => {
    // Placeholder для будущей интеграции с API
    console.info(`Bulk action: ${action}`, selectedRows);
    setSelectedRows([]);
  };

  const renderTableRows = (leads: LeadRecord[]) => {
    return leads.map((lead) => {
      const statusMeta = leadStatusMeta[lead.status];
      return (
        <tr key={lead.id} className={styles.tableRow}>
          <td>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={selectedRows.includes(lead.id)}
                onChange={() => toggleRow(lead.id)}
              />
              <span className={styles.customCheckbox} aria-hidden="true" />
            </label>
          </td>
          <td>
            <div className={styles.leadMainCell}>
              <div className={styles.leadName}>{lead.name}</div>
              <div className={styles.leadMeta}>
                <span>{lead.phone}</span>
                <span>{lead.email}</span>
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
            <div className={styles.tableProduct}>{lead.product}</div>
            {lead.cohortName && <div className={styles.tableSub}>{lead.cohortName}</div>}
          </td>
          <td>
            <div className={styles.managerBadge}>{lead.manager}</div>
          </td>
          <td>
            <div>{dateFormatter(lead.createdAt)}</div>
            {lead.appointmentDate && (
              <div className={styles.tableSub}>Визит: {dateFormatter(lead.appointmentDate)}</div>
            )}
          </td>
          <td>
            <div>{lead.source}</div>
            {lead.utmSource && <div className={styles.tableSub}>utm: {lead.utmSource}</div>}
          </td>
          <td>
            {lead.value ? (
              <div className={styles.value}>{currencyFormatter.format(lead.value)}</div>
            ) : (
              <span className={styles.tableSub}>—</span>
            )}
          </td>
          <td>
            <button type="button" className={styles.rowAction}>Открыть</button>
          </td>
        </tr>
      );
    });
  };

  const renderBoard = () => {
    const columns = (Object.keys(leadStatusMeta) as LeadStatus[]).map((status) => ({
      status,
      leads: sortedLeads.filter((lead) => lead.status === status),
    }));

    return (
      <div className={styles.board}>
        {columns.map((column) => {
          const statusMeta = leadStatusMeta[column.status];
          return (
            <section key={column.status} className={styles.boardColumn}>
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
                    <article key={lead.id} className={styles.boardCard}>
                      <header className={styles.boardCardHeader}>
                        <div>
                          <div className={styles.boardCardTitle}>{lead.name}</div>
                          <div className={styles.boardCardMeta}>{lead.product}</div>
                        </div>
                        {lead.value && (
                          <div className={styles.boardCardValue}>
                            {currencyFormatter.format(lead.value)}
                          </div>
                        )}
                      </header>

                      <div className={styles.boardCardInfo}>
                        <span>📞 {lead.phone}</span>
                        <span>👤 {lead.manager}</span>
                        <span>🕒 {dateFormatter(lead.createdAt, false)}</span>
                        {lead.appointmentDate && (
                          <span>📅 Прием: {dateFormatter(lead.appointmentDate)}</span>
                        )}
                        {lead.cohortName && (
                          <span>🎓 {lead.cohortName}</span>
                        )}
                      </div>

                      <footer className={styles.boardCardFooter}>
                        <button type="button">Связаться</button>
                        <button type="button" className={styles.boardPrimaryAction}>
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
            <button type="button" className={styles.primaryButton}>
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
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | LeadStatus)}
                >
                  <option value="all">Все</option>
                  {(Object.keys(leadStatusMeta) as LeadStatus[]).map((status) => (
                    <option key={status} value={status}>
                      {leadStatusMeta[status].label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Менеджер
                <select
                  value={managerFilter}
                  onChange={(e) => setManagerFilter(e.target.value as 'all' | string)}
                >
                  <option value="all">Все</option>
                  {managerOptions.map((manager) => (
                    <option key={manager} value={manager}>
                      {manager}
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
            <div>
              Выбрано: {selectedRows.length}
            </div>
            <div className={styles.bulkButtons}>
              <button type="button" onClick={() => handleBulkAction('status')}>
                Сменить статус
              </button>
              <button type="button" className={styles.dangerButton} onClick={() => handleBulkAction('delete')}>
                Удалить выбранные
              </button>
            </div>
            <button type="button" className={styles.clearSelection} onClick={() => setSelectedRows([])}>
              Снять выделение
            </button>
          </section>
        )}

        {viewMode === 'list' ? (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>
                    <label className={styles.checkboxLabel}>
                      <input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} />
                      <span className={styles.customCheckbox} aria-hidden="true" />
                    </label>
                  </th>
                  <th>
                    <button type="button" onClick={() => handleSort('name')} className={styles.sortButton}>
                      Лид
                      <span aria-hidden="true">{sortColumn === 'name' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}</span>
                    </button>
                  </th>
                  <th>
                    <button type="button" onClick={() => handleSort('status')} className={styles.sortButton}>
                      Статус
                      <span aria-hidden="true">{sortColumn === 'status' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}</span>
                    </button>
                  </th>
                  <th>Продукт</th>
                  <th>Ответственный</th>
                  <th>
                    <button type="button" onClick={() => handleSort('createdAt')} className={styles.sortButton}>
                      Дата
                      <span aria-hidden="true">{sortColumn === 'createdAt' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}</span>
                    </button>
                  </th>
                  <th>Источник</th>
                  <th>
                    <button type="button" onClick={() => handleSort('value')} className={styles.sortButton}>
                      Сумма
                      <span aria-hidden="true">{sortColumn === 'value' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}</span>
                    </button>
                  </th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paginatedLeads.length === 0 ? (
                  <tr>
                    <td colSpan={9} className={styles.emptyState}>
                      Под критерии поиска ничего не найдено. Попробуйте изменить фильтры.
                    </td>
                  </tr>
                ) : (
                  renderTableRows(paginatedLeads)
                )}
              </tbody>
            </table>

            {paginatedLeads.length > 0 && (
              <footer className={styles.pagination}>
                <div>
                  Показано {pageStartIndex + 1}–{Math.min(pageStartIndex + pageSize, sortedLeads.length)} из {sortedLeads.length}
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
                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                      <button
                        key={pageNumber}
                        type="button"
                        onClick={() => setCurrentPage(pageNumber)}
                        className={pageNumber === currentPage ? styles.currentPage : ''}
                      >
                        {pageNumber}
                      </button>
                    ))}
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

        <section className={styles.mobileSummary}>
          <h2>Быстрые метрики</h2>
          <div className={styles.mobileSummaryGrid}>
            {(Object.keys(leadStatusMeta) as LeadStatus[]).map((status) => (
              <div key={status} className={styles.mobileSummaryCard}>
                <span className={styles.mobileSummaryLabel}>{leadStatusMeta[status].label}</span>
                <span className={styles.mobileSummaryValue}>
                  {filteredLeads.filter((lead) => lead.status === status).length}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default Leads;
