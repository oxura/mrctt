import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../layouts/AppLayout';
import { Subscription, Payment, SubscriptionPlan } from '../../types';
import api from '../../utils/api';
import styles from './Billing.module.css';
import { useAuthStore } from '../../store/authStore';

interface BillingData {
  subscription: Subscription | null;
  payments: Payment[];
  plans: SubscriptionPlan[];
}

const Billing: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BillingData>({
    subscription: null,
    payments: [],
    plans: [],
  });
  const [manualRenewLoading, setManualRenewLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isOwner = user?.role === 'owner';

  useEffect(() => {
    if (!isOwner) {
      setLoading(false);
      setError('Доступ к биллингу разрешен только владельцу компании');
      return;
    }

    loadBillingData();
  }, [isOwner]);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/billing');
      setData(response.data);
    } catch (err) {
      setError('Не удалось загрузить данные биллинга');
      console.error('Error loading billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return `${styles.statusBadge} ${styles.statusActive}`;
      case 'trial':
        return `${styles.statusBadge} ${styles.statusTrial}`;
      case 'expired':
      case 'past_due':
        return `${styles.statusBadge} ${styles.statusExpired}`;
      case 'cancelled':
        return `${styles.statusBadge} ${styles.statusCancelled}`;
      default:
        return styles.statusBadge;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Активна';
      case 'trial':
        return 'Пробная';
      case 'expired':
        return 'Истекла';
      case 'cancelled':
        return 'Отменена';
      case 'past_due':
        return 'Просрочена';
      default:
        return status;
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Оплачен';
      case 'pending':
        return 'В ожидании';
      case 'failed':
        return 'Ошибка';
      case 'refunded':
        return 'Возврат';
      default:
        return status;
    }
  };

  const handleManualRenew = async () => {
    try {
      setManualRenewLoading(true);
      setError(null);
      setSuccessMessage(null);
      await api.post('/billing/renew', { months: 1 });
      setSuccessMessage('Подписка успешно продлена на 1 месяц');
      await loadBillingData();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError('Не удалось продлить подписку');
      console.error('Error renewing subscription:', err);
    } finally {
      setManualRenewLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout breadcrumbs={['Биллинг']}>
        <div className={styles.loading}>Загрузка...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={['Биллинг']}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Биллинг</h1>
          <p className={styles.subtitle}>Управление подпиской и платежами</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {successMessage && (
          <div
            style={{
              background: '#dcfce7',
              color: '#166534',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px',
              fontSize: '14px',
            }}
          >
            {successMessage}
          </div>
        )}

        {/* Текущая подписка */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Текущая подписка</h2>

          {data.subscription && data.subscription.plan ? (
            <div className={styles.currentPlan}>
              <div className={styles.planInfo}>
                <h3 className={styles.planName}>{data.subscription.plan.name}</h3>
                <div className={styles.planPrice}>
                  {formatPrice(data.subscription.plan.price)}
                  <span className={styles.planPeriod}>
                    {' '}
                    / {data.subscription.plan.billing_period === 'monthly' ? 'месяц' : 'год'}
                  </span>
                </div>

                <div className={styles.planDetails}>
                  <div className={styles.detailRow}>
                    <span>Статус:</span>
                    <span className={getStatusBadgeClass(data.subscription.status)}>
                      {getStatusLabel(data.subscription.status)}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span>Дата окончания:</span>
                    <strong>{formatDate(data.subscription.current_period_end)}</strong>
                  </div>
                  {data.subscription.trial_ends_at && (
                    <div className={styles.detailRow}>
                      <span>Пробный период до:</span>
                      <strong>{formatDate(data.subscription.trial_ends_at)}</strong>
                    </div>
                  )}
                </div>

                {data.subscription.plan.features && 
                 Array.isArray(data.subscription.plan.features) && 
                 data.subscription.plan.features.length > 0 && (
                  <ul className={styles.featuresList}>
                    {data.subscription.plan.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className={styles.planActions}>
                <button
                  className={`${styles.button} ${styles.buttonPrimary}`}
                  onClick={() => navigate('/billing/plans')}
                >
                  Изменить тариф
                </button>
                <button
                  className={`${styles.button} ${styles.buttonSecondary}`}
                  onClick={handleManualRenew}
                  disabled={manualRenewLoading}
                >
                  {manualRenewLoading ? 'Продление...' : 'Продлить на месяц'}
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>У вас еще нет активной подписки</p>
              <button
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={() => navigate('/billing/plans')}
                style={{ marginTop: '16px' }}
              >
                Выбрать тариф
              </button>
            </div>
          )}
        </div>

        {/* История платежей */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>История платежей</h2>

          {data.payments && data.payments.length > 0 ? (
            <div className={styles.paymentHistory}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Описание</th>
                    <th>Сумма</th>
                    <th>Статус</th>
                    <th>ID транзакции</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>{formatDate(payment.created_at)}</td>
                      <td>{payment.description || 'Платеж'}</td>
                      <td>{formatPrice(payment.amount)}</td>
                      <td>
                        <span className={getStatusBadgeClass(payment.status)}>
                          {getPaymentStatusLabel(payment.status)}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                        {payment.transaction_id || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>История платежей пуста</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Billing;
