import Button from '../../components/common/Button';
import { useAppStore } from '../../store/appStore';
import { CreditCardIcon } from '@heroicons/react/24/outline';

export default function Billing() {
  const { billing } = useAppStore();
  const currentPlan = billing.plans.find((plan) => plan.id === billing.currentPlanId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Биллинг</h1>
        <p className="mt-1 text-gray-600">
          Управляйте подпиской и историей платежей вашей компании
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Текущий тариф</p>
              <h2 className="mt-1 text-2xl font-semibold text-gray-900">{currentPlan?.name}</h2>
            </div>
            <CreditCardIcon className="h-8 w-8 text-primary-500" />
          </div>
          <p className="mt-4 text-sm text-gray-600">{currentPlan?.description}</p>
          <div className="mt-6 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900">
              {currentPlan?.pricePerMonth.toLocaleString('ru-RU')} ₽
            </span>
            <span className="text-sm text-gray-500">/ месяц</span>
          </div>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            {currentPlan?.features.map((feature) => (
              <li key={feature}>• {feature}</li>
            ))}
          </ul>
          <div className="mt-6 flex gap-3">
            <Button>Изменить тариф</Button>
            <Button variant="secondary">Продлить подписку</Button>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">История платежей</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-gray-700">
                <tr>
                  <th className="pb-3 font-medium">Дата</th>
                  <th className="pb-3 font-medium">Сумма</th>
                  <th className="pb-3 font-medium">Статус</th>
                  <th className="pb-3 font-medium">Инвойс</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {billing.payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="py-3 text-gray-600">
                      {new Date(payment.date).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="py-3 text-gray-600">
                      {payment.amount.toLocaleString('ru-RU')} ₽
                    </td>
                    <td className="py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          payment.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-700'
                            : payment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {payment.status === 'paid' && 'Оплачено'}
                        {payment.status === 'pending' && 'Ожидает'}
                        {payment.status === 'failed' && 'Ошибка'}
                      </span>
                    </td>
                    <td className="py-3">
                      <Button variant="ghost" size="sm">
                        Скачать
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Доступные тарифы</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {billing.plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl border p-6 ${
                plan.id === billing.currentPlanId
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
              <p className="mt-2 text-sm text-gray-600">{plan.description}</p>
              <p className="mt-4 text-2xl font-bold text-gray-900">
                {plan.pricePerMonth.toLocaleString('ru-RU')} ₽
              </p>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                {plan.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
              <Button variant="secondary" className="mt-4 w-full">
                Выбрать
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
