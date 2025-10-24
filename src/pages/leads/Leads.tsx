import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  TableCellsIcon,
  Squares2X2Icon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { useAppStore } from '../../store/appStore';
import { Lead } from '../../types';
import { nanoid } from '../../utils/nanoid';
import LeadKanban from './LeadKanban';

export default function Leads() {
  const { leads, products, company, addLead, team, viewMode, setViewMode } = useAppStore();
  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone.includes(searchQuery) ||
        lead.email?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || lead.statusId === statusFilter;
      const matchesProduct = productFilter === 'all' || lead.productId === productFilter;
      const matchesOwner = ownerFilter === 'all' || lead.ownerId === ownerFilter;

      return matchesSearch && matchesStatus && matchesProduct && matchesOwner;
    });
  }, [leads, searchQuery, statusFilter, productFilter, ownerFilter]);

  const handleAddLead = (data: Omit<Lead, 'id' | 'companyId' | 'createdAt' | 'history'>) => {
    const newLead: Lead = {
      ...data,
      id: nanoid(),
      companyId: company!.id,
      createdAt: new Date().toISOString(),
      history: [
        {
          id: nanoid(),
          type: 'creation',
          message: 'Лид создан вручную',
          createdAt: new Date().toISOString(),
          createdBy: 'system',
        },
      ],
    };
    addLead(newLead);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Лиды</h1>
          <p className="mt-1 text-gray-600">
            Управляйте заявками и обрабатывайте лиды в одном месте
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <PlusIcon className="mr-2 h-5 w-5" />
          Добавить лид
        </Button>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по имени, телефону, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('table')}
              className={`rounded-lg p-2 ${
                viewMode === 'table'
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-400 hover:bg-gray-100'
              }`}
            >
              <TableCellsIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`rounded-lg p-2 ${
                viewMode === 'kanban'
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-400 hover:bg-gray-100'
              }`}
            >
              <Squares2X2Icon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mb-4 flex gap-3 overflow-x-auto pb-2">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-w-[150px]"
          >
            <option value="all">Все статусы</option>
            {company?.leadStatuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </Select>

          <Select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="min-w-[150px]"
          >
            <option value="all">Все продукты</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </Select>

          <Select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="min-w-[150px]"
          >
            <option value="all">Все менеджеры</option>
            {team.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </Select>
        </div>

        {viewMode === 'table' ? (
          <LeadsTable leads={filteredLeads} />
        ) : (
          <LeadKanban leads={filteredLeads} />
        )}
      </div>

      {showAddModal && (
        <AddLeadModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddLead}
        />
      )}
    </div>
  );
}

function LeadsTable({ leads }: { leads: Lead[] }) {
  const { company, products, team } = useAppStore();

  const getStatusName = (statusId: string) =>
    company?.leadStatuses.find((s) => s.id === statusId)?.name || statusId;

  const getProductName = (productId?: string) =>
    products.find((p) => p.id === productId)?.name || '-';

  const getOwnerName = (ownerId?: string) =>
    team.find((u) => u.id === ownerId)?.name || '-';

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b text-gray-700">
          <tr>
            <th className="pb-3 font-medium">Имя</th>
            <th className="pb-3 font-medium">Контакт</th>
            <th className="pb-3 font-medium">Статус</th>
            <th className="pb-3 font-medium">Продукт</th>
            <th className="pb-3 font-medium">Ответственный</th>
            <th className="pb-3 font-medium">Дата создания</th>
            <th className="pb-3 font-medium">Источник</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {leads.length === 0 && (
            <tr>
              <td colSpan={7} className="py-8 text-center text-gray-500">
                Лиды не найдены
              </td>
            </tr>
          )}
          {leads.map((lead) => {
            const status = company?.leadStatuses.find((s) => s.id === lead.statusId);
            return (
              <tr key={lead.id} className="hover:bg-gray-50">
                <td className="py-3">
                  <Link to={`/leads/${lead.id}`} className="font-medium text-primary-600 hover:underline">
                    {lead.name}
                  </Link>
                </td>
                <td className="py-3">
                  <div className="text-gray-700">{lead.phone}</div>
                  {lead.email && <div className="text-xs text-gray-500">{lead.email}</div>}
                </td>
                <td className="py-3">
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-medium text-white"
                    style={{ backgroundColor: status?.color }}
                  >
                    {getStatusName(lead.statusId)}
                  </span>
                </td>
                <td className="py-3 text-gray-700">{getProductName(lead.productId)}</td>
                <td className="py-3 text-gray-700">{getOwnerName(lead.ownerId)}</td>
                <td className="py-3 text-gray-500">
                  {new Date(lead.createdAt).toLocaleDateString('ru-RU')}
                </td>
                <td className="py-3 text-gray-500">{lead.source || '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface AddLeadModalProps {
  onClose: () => void;
  onSubmit: (data: Omit<Lead, 'id' | 'companyId' | 'createdAt' | 'history'>) => void;
}

function AddLeadModal({ onClose, onSubmit }: AddLeadModalProps) {
  const { products, company, team } = useAppStore();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    productId: '',
    statusId: company?.leadStatuses[0]?.id || '',
    ownerId: '',
    source: '',
    notes: [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Добавить лид вручную</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Имя"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Телефон"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Select
            label="Продукт"
            value={formData.productId}
            onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
          >
            <option value="">Не выбран</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </Select>
          <Select
            label="Ответственный"
            value={formData.ownerId}
            onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
          >
            <option value="">Не назначен</option>
            {team.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </Select>
          <Input
            label="Источник (utm_source)"
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            placeholder="instagram, website, facebook..."
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit">Создать лид</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
