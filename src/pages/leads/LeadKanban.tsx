import { useMemo } from 'react';
import { Lead } from '../../types';
import { useAppStore } from '../../store/appStore';
import { Link } from 'react-router-dom';

interface LeadKanbanProps {
  leads: Lead[];
}

export default function LeadKanban({ leads }: LeadKanbanProps) {
  const { company, products, groups } = useAppStore();

  const columns = useMemo(() => {
    return company?.leadStatuses.map((status) => ({
      ...status,
      leads: leads.filter((lead) => lead.statusId === status.id),
    })) || [];
  }, [company?.leadStatuses, leads]);

  const getProductName = (productId?: string) =>
    products.find((product) => product.id === productId)?.name;

  const getGroupName = (groupId?: string) =>
    groups.find((group) => group.id === groupId)?.name;

  return (
    <div className="mt-4 grid gap-4 overflow-x-auto md:grid-cols-2 xl:grid-cols-4">
      {columns.map((column) => (
        <div key={column.id} className="flex h-full min-h-[400px] flex-col rounded-2xl bg-gray-50">
          <div className="flex items-center justify-between rounded-t-2xl bg-white px-4 py-3 shadow-sm">
            <div className="font-medium text-gray-800">{column.name}</div>
            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
              {column.leads.length}
            </span>
          </div>
          <div className="flex-1 space-y-3 p-4">
            {column.leads.map((lead) => (
              <Link
                to={`/leads/${lead.id}`}
                key={lead.id}
                className="block rounded-xl bg-white p-4 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{lead.name}</h3>
                  <span className="text-xs text-gray-500">
                    {new Date(lead.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-600">{lead.phone}</div>
                {lead.appointmentDate && (
                  <div className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
                    Прием: {new Date(lead.appointmentDate).toLocaleString('ru-RU')}
                  </div>
                )}
                {lead.groupId && (
                  <div className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                    Группа: {getGroupName(lead.groupId)}
                  </div>
                )}
                {lead.productId && (
                  <p className="mt-2 text-xs text-gray-500">
                    Продукт: {getProductName(lead.productId)}
                  </p>
                )}
              </Link>
            ))}
            {column.leads.length === 0 && (
              <div className="flex h-full flex-1 items-center justify-center rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-400">
                Нет лидов
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
