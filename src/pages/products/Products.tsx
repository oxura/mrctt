import { useState } from 'react';
import {
  PlusIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { useAppStore } from '../../store/appStore';
import { Product, GroupFlow } from '../../types';
import { nanoid } from '../../utils/nanoid';

export default function Products() {
  const { products, addProduct, updateProduct, groups, addGroup, company } = useAppStore();
  const [showProductModal, setShowProductModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleAddProduct = (data: Omit<Product, 'id' | 'companyId'>) => {
    addProduct({ ...data, id: nanoid(), companyId: company!.id });
    setShowProductModal(false);
  };

  const handleAddGroup = (data: Omit<GroupFlow, 'id' | 'status'>) => {
    addGroup({
      ...data,
      id: nanoid(),
      status: data.enrolled >= data.capacity ? 'closed' : 'open',
    });
    setShowGroupModal(false);
  };

  const groupsEnabled = company?.modules.find((m) => m.key === 'groups')?.enabled;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Продукты и услуги</h1>
          <p className="mt-1 text-gray-600">
            Управляйте каталогом курсов, услуг и направлений
          </p>
        </div>
        <div className="flex gap-3">
          {groupsEnabled && (
            <Button variant="secondary" onClick={() => setShowGroupModal(true)}>
              <UserGroupIcon className="mr-2 h-5 w-5" />
              Добавить группу
            </Button>
          )}
          <Button onClick={() => setShowProductModal(true)}>
            <PlusIcon className="mr-2 h-5 w-5" />
            Новый продукт
          </Button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Каталог продуктов</h2>
          <Button variant="ghost" size="sm">
            <ClipboardDocumentListIcon className="mr-2 h-4 w-4" />
            Экспорт
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-gray-700">
              <tr>
                <th className="pb-3 font-medium">Название</th>
                <th className="pb-3 font-medium">Тип</th>
                <th className="pb-3 font-medium">Цена</th>
                <th className="pb-3 font-medium">Статус</th>
                <th className="pb-3 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="py-3 text-gray-900">{product.name}</td>
                  <td className="py-3 capitalize text-gray-600">{product.type}</td>
                  <td className="py-3 text-gray-600">{product.price.toLocaleString('ru-RU')} ₽</td>
                  <td className="py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        product.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {product.status === 'active' ? 'Активен' : 'Архив'}
                    </span>
                  </td>
                  <td className="py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedProduct(product)}
                    >
                      Редактировать
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {groupsEnabled && (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Группы и потоки</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {groups.map((group) => {
              const product = products.find((p) => p.id === group.productId);
              const progress = Math.round((group.enrolled / group.capacity) * 100);
              return (
                <div key={group.id} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{group.name}</h3>
                    <span className={`text-xs font-medium ${
                      group.status === 'open' ? 'text-emerald-600' : 'text-gray-500'
                    }`}>
                      {group.status === 'open' ? 'Открыт' : 'Закрыт'}
                    </span>
                  </div>
                  {product && (
                    <p className="mt-1 text-sm text-gray-500">Продукт: {product.name}</p>
                  )}
                  <p className="mt-2 text-sm text-gray-700">
                    Старт: {new Date(group.startDate).toLocaleDateString('ru-RU')}
                  </p>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Заполнено</span>
                      <span>
                        {group.enrolled} из {group.capacity} ({progress}%)
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-primary-500"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            {groups.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                Группы еще не созданы
              </div>
            )}
          </div>
        </div>
      )}

      {showProductModal && (
        <ProductModal onClose={() => setShowProductModal(false)} onSubmit={handleAddProduct} />
      )}

      {selectedProduct && (
        <ProductModal
          initialValue={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onSubmit={(data) => {
            updateProduct(selectedProduct.id, data);
            setSelectedProduct(null);
          }}
        />
      )}

      {showGroupModal && (
        <GroupModal onClose={() => setShowGroupModal(false)} onSubmit={handleAddGroup} />
      )}
    </div>
  );
}

interface ProductModalProps {
  initialValue?: Product;
  onClose: () => void;
  onSubmit: (data: Omit<Product, 'id' | 'companyId'>) => void;
}

function ProductModal({ initialValue, onClose, onSubmit }: ProductModalProps) {
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    type: Product['type'];
    price: string;
    status: Product['status'];
  }>({
    name: initialValue?.name || '',
    description: initialValue?.description || '',
    type: initialValue?.type ?? 'course',
    price: initialValue?.price?.toString() || '',
    status: initialValue?.status ?? 'active',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...initialValue,
      name: formData.name,
      description: formData.description,
      type: formData.type,
      status: formData.status,
      price: Number(formData.price) || 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">
          {initialValue ? 'Редактировать продукт' : 'Новый продукт'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Название"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Описание</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <Select
            label="Тип"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as Product['type'] })}
          >
            <option value="course">Курс</option>
            <option value="service">Услуга</option>
            <option value="medical">Медицина</option>
            <option value="travel">Туризм</option>
            <option value="other">Другое</option>
          </Select>
          <Input
            label="Цена"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="0"
          />
          <Select
            label="Статус"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as Product['status'] })}
          >
            <option value="active">Активен</option>
            <option value="archived">Архив</option>
          </Select>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit">
              {initialValue ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface GroupModalProps {
  onClose: () => void;
  onSubmit: (data: Omit<GroupFlow, 'id' | 'status'>) => void;
}

function GroupModal({ onClose, onSubmit }: GroupModalProps) {
  const { products } = useAppStore();
  const [formData, setFormData] = useState({
    productId: products[0]?.id || '',
    name: '',
    startDate: '',
    capacity: 20,
    enrolled: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      productId: formData.productId,
      name: formData.name,
      startDate: formData.startDate,
      capacity: formData.capacity,
      enrolled: formData.enrolled,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Новая группа / поток</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Продукт"
            value={formData.productId}
            onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
          >
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </Select>
          <Input
            label="Название"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Дата старта"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
          <Input
            label="Лимит мест"
            type="number"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
            required
          />
          <Input
            label="Уже записано"
            type="number"
            value={formData.enrolled}
            onChange={(e) => setFormData({ ...formData, enrolled: Number(e.target.value) })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit">Создать</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
