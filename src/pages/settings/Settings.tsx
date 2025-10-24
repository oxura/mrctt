import { useState } from 'react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useAppStore } from '../../store/appStore';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

export default function Settings() {
  const { company, toggleModule, updateLeadStatuses } = useAppStore();
  const [activeTab, setActiveTab] = useState<'general' | 'modules' | 'statuses'>('general');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Настройки компании</h1>
        <p className="mt-1 text-gray-600">
          Управляйте параметрами вашего рабочего пространства
        </p>
      </div>

      <div className="flex gap-4 border-b">
        {(['general', 'modules', 'statuses'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-4 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'general' && 'Общие настройки'}
            {tab === 'modules' && 'Модули'}
            {tab === 'statuses' && 'Статусы лидов'}
          </button>
        ))}
      </div>

      {activeTab === 'general' && (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Общая информация</h2>
          <div className="space-y-4">
            <Input label="Название компании" defaultValue={company?.name} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Страна" defaultValue={company?.country} />
              <Input label="Город" defaultValue={company?.city} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Логотип</label>
              <div className="flex items-center gap-4">
                {company?.logoUrl ? (
                  <img src={company.logoUrl} alt="Logo" className="h-16 w-16 rounded" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded bg-gray-200 text-2xl font-bold text-gray-500">
                    {company?.name.charAt(0)}
                  </div>
                )}
                <Button variant="secondary" size="sm">
                  Загрузить новый
                </Button>
              </div>
            </div>
            <Button className="mt-6">Сохранить изменения</Button>
          </div>
        </div>
      )}

      {activeTab === 'modules' && (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Включенные модули</h2>
          <p className="mb-4 text-sm text-gray-600">
            Отключите ненужные разделы, чтобы упростить интерфейс
          </p>
          <div className="space-y-3">
            {company?.modules.map((module) => (
              <label
                key={module.key}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50 cursor-pointer"
              >
                <div>
                  <p className="font-medium text-gray-900">{module.label}</p>
                  {module.description && (
                    <p className="mt-1 text-sm text-gray-500">{module.description}</p>
                  )}
                </div>
                <input
                  type="checkbox"
                  checked={module.enabled}
                  onChange={(e) => toggleModule(module.key, e.target.checked)}
                  disabled={module.key === 'dashboard' || module.key === 'leads'}
                  className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
                />
              </label>
            ))}
          </div>
          <p className="mt-4 text-xs text-gray-500">
            * Главная и Лиды обязательны для всех
          </p>
        </div>
      )}

      {activeTab === 'statuses' && (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Статусы воронки продаж</h2>
          <p className="mb-4 text-sm text-gray-600">
            Настройте этапы, через которые проходит ваш клиент
          </p>
          <div className="space-y-3">
            {company?.leadStatuses.map((status) => (
              <div
                key={status.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded" style={{ backgroundColor: status.color }} />
                  <span className="font-medium text-gray-900">{status.name}</span>
                </div>
                <span className="text-sm text-gray-500">Порядок: {status.order}</span>
              </div>
            ))}
          </div>
          <Button variant="secondary" className="mt-4">
            Добавить статус
          </Button>
        </div>
      )}
    </div>
  );
}
