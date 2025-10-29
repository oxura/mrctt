import React, { useEffect, useMemo, useState } from 'react';
import AppLayout from '../../layouts/AppLayout';
import ProductModal from '../../components/modals/ProductModal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useProducts, CreateProductDto, UpdateProductDto } from '../../hooks/useProducts';
import { Product, ProductType, ProductStatus } from '../../types';
import { useToast } from '../../components/ui/toastContext';
import styles from './Products.module.css';

const pageSizeOptions = [25, 50, 100];
type SortColumn = 'created_at' | 'updated_at' | 'name' | 'price';

const currencyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

const dateFormatter = (value: string) => {
  const date = new Date(value);
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  };
  return date.toLocaleDateString('ru-RU', options).replace('.', '');
};

const productTypeLabels: Record<ProductType, string> = {
  course: 'Курс',
  service: 'Услуга',
  other: 'Другое',
};

const productStatusLabels: Record<ProductStatus, string> = {
  active: 'Активен',
  archived: 'Архивирован',
};

const Products: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ProductType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ProductStatus>('all');
  const [pageSize, setPageSize] = useState(pageSizeOptions[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<SortColumn>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, loading, error, setFilters, createProduct, updateProduct, updateProductStatus, deleteProduct } =
    useProducts({
      search: searchTerm || undefined,
      type: typeFilter !== 'all' ? typeFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      sort_by: sortColumn,
      sort_direction: sortDirection,
      page: currentPage,
      page_size: pageSize,
    });

  const { success: showToastSuccess, error: showToastError } = useToast();
  const [optimisticProducts, setOptimisticProducts] = useState<Product[]>([]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedRows([]);
  }, [searchTerm, typeFilter, statusFilter, pageSize, sortColumn, sortDirection]);

  useEffect(() => {
    setFilters({
      search: searchTerm || undefined,
      type: typeFilter !== 'all' ? typeFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      sort_by: sortColumn,
      sort_direction: sortDirection,
      page: currentPage,
      page_size: pageSize,
    });
  }, [searchTerm, typeFilter, statusFilter, sortColumn, sortDirection, currentPage, pageSize, setFilters]);

  useEffect(() => {
    if (data?.products) {
      setOptimisticProducts(data.products);
      const validIds = new Set(data.products.map((product) => product.id));
      setSelectedRows((prev) => prev.filter((id) => validIds.has(id)));
    } else if (!loading) {
      setOptimisticProducts([]);
      setSelectedRows([]);
    }
  }, [data?.products, loading]);

  const products = optimisticProducts;
  const total = data?.total || 0;
  const totalPages = data?.total_pages || 1;

  const selectedProducts = useMemo(
    () => products.filter((product) => selectedRows.includes(product.id)),
    [products, selectedRows]
  );

  const selectedProductCount = selectedProducts.length;

  const isAllSelected = products.length > 0 && products.every((product) => selectedRows.includes(product.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedRows([]);
    } else {
      setSelectedRows(products.map((product) => product.id));
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

  const handleCreateProduct = async (productData: CreateProductDto) => {
    try {
      await createProduct(productData);
      showToastSuccess('Продукт успешно создан');
    } catch (error: any) {
      showToastError(error.message || 'Не удалось создать продукт');
      throw error;
    }
  };

  const handleUpdateProduct = async (productData: UpdateProductDto) => {
    if (!editingProduct) return;
    
    try {
      await updateProduct(editingProduct.id, productData);
      showToastSuccess('Продукт успешно обновлен');
      setEditingProduct(null);
    } catch (error: any) {
      showToastError(error.message || 'Не удалось обновить продукт');
      throw error;
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const deletePromises = selectedRows.map((id) => deleteProduct(id));
      await Promise.all(deletePromises);

      showToastSuccess(`Удалено продуктов: ${selectedRows.length}`);
      setSelectedRows([]);
      setIsDeleteModalOpen(false);
    } catch (error: any) {
      showToastError(error.message || 'Не удалось удалить продукты');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkArchive = async () => {
    setIsDeleting(true);
    try {
      const archivePromises = selectedRows.map((id) => updateProductStatus(id, 'archived'));
      await Promise.all(archivePromises);

      showToastSuccess(`Архивировано продуктов: ${selectedRows.length}`);
      setSelectedRows([]);
      setIsArchiveModalOpen(false);
    } catch (error: any) {
      showToastError(error.message || 'Не удалось архивировать продукты');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
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

  return (
    <AppLayout breadcrumbs={['Продукты']}>
      <div className={styles.wrapper}>
        <div className={styles.pageHeader}>
          <div>
            <p className={styles.pageEyebrow}>КАТАЛОГ</p>
            <h1>Продукты и услуги</h1>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.primaryButton} onClick={() => setIsAddModalOpen(true)}>
              + Добавить продукт
            </button>
          </div>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.searchBlock}>
            <div className={styles.searchField}>
              <span>🔍</span>
              <input
                type="text"
                placeholder="Поиск по названию или описанию"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className={styles.filters}>
              <label>
                <span>Тип</span>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)}>
                  <option value="all">Все типы</option>
                  <option value="course">Курс</option>
                  <option value="service">Услуга</option>
                  <option value="other">Другое</option>
                </select>
              </label>
              <label>
                <span>Статус</span>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
                  <option value="all">Все статусы</option>
                  <option value="active">Активен</option>
                  <option value="archived">Архивирован</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        {selectedProductCount > 0 && (
          <div className={styles.bulkActionsBar}>
            <span className={styles.bulkCount}>Выбрано: {selectedProductCount}</span>
            <div className={styles.bulkButtons}>
              <button
                className={styles.bulkActionButton}
                onClick={() => setIsArchiveModalOpen(true)}
              >
                📦 Архивировать
              </button>
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
          {loading && products.length === 0 ? (
            <div className={styles.loader}>Загрузка...</div>
          ) : error ? (
            <div className={styles.errorMessage}>{error}</div>
          ) : products.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyIcon}>📦</p>
              <p className={styles.emptyTitle}>Нет продуктов</p>
              <p className={styles.emptySubtitle}>
                {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'Попробуйте изменить фильтры'
                  : 'Добавьте первый продукт, чтобы начать'}
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
                      />
                    </th>
                    <th className={styles.sortableHeader} onClick={() => handleSort('name')}>
                      Название {renderSortIcon('name')}
                    </th>
                    <th>Тип</th>
                    <th className={styles.sortableHeader} onClick={() => handleSort('price')}>
                      Цена {renderSortIcon('price')}
                    </th>
                    <th>Статус</th>
                    <th className={styles.sortableHeader} onClick={() => handleSort('created_at')}>
                      Создан {renderSortIcon('created_at')}
                    </th>
                    <th className={styles.actionsCell}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className={styles.tableRow}>
                      <td className={styles.checkboxCell}>
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(product.id)}
                          onChange={() => toggleRow(product.id)}
                        />
                      </td>
                      <td className={styles.nameCell}>
                        <div className={styles.productName}>{product.name}</div>
                        {product.description && (
                          <div className={styles.productDescription}>{product.description}</div>
                        )}
                      </td>
                      <td>
                        <span className={styles.typeBadge}>
                          {productTypeLabels[product.type]}
                        </span>
                      </td>
                      <td>
                        {product.price ? currencyFormatter.format(parseFloat(product.price)) : '—'}
                      </td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${
                            product.status === 'active' ? styles.statusActive : styles.statusArchived
                          }`}
                        >
                          {productStatusLabels[product.status]}
                        </span>
                      </td>
                      <td className={styles.dateCell}>{dateFormatter(product.created_at)}</td>
                      <td className={styles.actionsCell}>
                        <button
                          className={styles.actionButton}
                          onClick={() => handleEditClick(product)}
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

      <ProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateProduct}
        mode="create"
      />

      <ProductModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleUpdateProduct}
        product={editingProduct}
        mode="edit"
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Удалить продукты"
        message={`Вы уверены, что хотите удалить выбранные продукты (${selectedProductCount})? Это действие нельзя отменить.`}
        confirmLabel={isDeleting ? 'Удаление...' : 'Удалить'}
        cancelLabel="Отмена"
        onConfirm={handleBulkDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        variant="danger"
      />

      <ConfirmModal
        isOpen={isArchiveModalOpen}
        title="Архивировать продукты"
        message={`Вы уверены, что хотите архивировать выбранные продукты (${selectedProductCount})?`}
        confirmLabel={isDeleting ? 'Архивирование...' : 'Архивировать'}
        cancelLabel="Отмена"
        onConfirm={handleBulkArchive}
        onCancel={() => setIsArchiveModalOpen(false)}
        variant="primary"
      />
    </AppLayout>
  );
};

export default Products;
