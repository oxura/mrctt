import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../layouts/AppLayout';
import { SubscriptionPlan } from '../../types';
import api from '../../utils/api';
import styles from './Plans.module.css';
import { useAuthStore } from '../../store/authStore';

interface PlansState {
  plans: SubscriptionPlan[];
  selectedPlan: SubscriptionPlan | null;
  showPaymentModal: boolean;
  processing: boolean;
  success: boolean;
  error: string | null;
}

const Plans: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<PlansState>({
    plans: [],
    selectedPlan: null,
    showPaymentModal: false,
    processing: false,
    success: false,
    error: null,
  });

  const isOwner = user?.role === 'owner';

  useEffect(() => {
    if (!isOwner) {
      setState((prev) => ({ ...prev, error: 'Доступ к выбору тарифов разрешен только владельцу компании' }));
      setLoading(false);
      return;
    }

    loadPlans();
  }, [isOwner]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await api.get('/billing');
      setState((prev) => ({ ...prev, plans: response.data.plans || [] }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: 'Не удалось загрузить тарифные планы',
      }));
      console.error('Error loading plans:', err);
    } finally {
      setLoading(false);
    }
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

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setState((prev) => ({
      ...prev,
      selectedPlan: plan,
      showPaymentModal: true,
      error: null,
    }));
  };

  const handleConfirmPayment = async () => {
    if (!state.selectedPlan) return;

    setState((prev) => ({ ...prev, processing: true, error: null }));

    try {
      await api.post('/billing/change-plan', {
        planId: state.selectedPlan.id,
      });

      const amount = parseFloat(state.selectedPlan.price);
      await api.post('/billing/payments', {
        planId: state.selectedPlan.id,
        amount,
        paymentMethod: 'test_payment',
      });

      setState((prev) => ({ ...prev, success: true, processing: false }));

      setTimeout(() => {
        navigate('/billing');
      }, 2000);
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        processing: false,
        error: err.response?.data?.message || 'Ошибка при обработке платежа',
      }));
    }
  };

  const handleCancelPayment = () => {
    setState((prev) => ({
      ...prev,
      selectedPlan: null,
      showPaymentModal: false,
      error: null,
    }));
  };

  if (loading) {
    return (
      <AppLayout breadcrumbs={['Биллинг', 'Тарифы']}>
        <div className={styles.loading}>Загрузка тарифных планов...</div>
      </AppLayout>
    );
  }

  if (state.success) {
    return (
      <AppLayout breadcrumbs={['Биллинг', 'Тарифы']}>
        <div className={styles.successState}>
          <h2>✓ Подписка успешно активирована!</h2>
          <p>Перенаправление на страницу биллинга...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={['Биллинг', 'Тарифы']}>
      <div className={styles.container}>
        <div
          className={styles.backButton}
          onClick={() => navigate('/billing')}
          role="button"
        >
          <span>←</span> Назад к биллингу
        </div>

        <div className={styles.header}>
          <h1 className={styles.title}>Выберите тарифный план</h1>
          <p className={styles.subtitle}>
            Выберите план, который подходит для вашего бизнеса
          </p>
        </div>

        {state.error && !state.showPaymentModal && (
          <div className={styles.errorState}>{state.error}</div>
        )}

        {/* План карточки */}
        <div className={styles.plansGrid}>
          {state.plans.map((plan) => (
            <div
              key={plan.id}
              className={`${styles.planCard} ${
                plan.id === 'pro' ? styles.planCardPopular : ''
              }`}
            >
              {plan.id === 'pro' && (
                <div className={styles.popularBadge}>Популярный</div>
              )}

              <div className={styles.planHeader}>
                <h3 className={styles.planName}>{plan.name}</h3>
                <p className={styles.planDescription}>
                  {plan.description || 'Отличный выбор для вашего бизнеса'}
                </p>
              </div>

              <div className={styles.planPrice}>
                {formatPrice(plan.price)}
                <span>
                  {' '}
                  / {plan.billing_period === 'monthly' ? 'месяц' : 'год'}
                </span>
              </div>

              <ul className={styles.planFeatures}>
                {(plan.features || []).map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>

              <div className={styles.planFooter}>
                <button
                  className={`${styles.button} ${
                    plan.id === 'pro'
                      ? styles.buttonPrimary
                      : styles.buttonSecondary
                  }`}
                  onClick={() => handleSelectPlan(plan)}
                >
                  Выбрать план
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Модальное окно оплаты */}
        {state.showPaymentModal && state.selectedPlan && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
            }}
            onClick={handleCancelPayment}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '32px',
                maxWidth: '500px',
                width: '90%',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ marginTop: 0, fontSize: '24px', fontWeight: '600' }}>
                Подтверждение оплаты
              </h2>

              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '16px' }}>
                  Вы выбрали план: <strong>{state.selectedPlan.name}</strong>
                </p>
                <p style={{ fontSize: '32px', fontWeight: '700', color: '#2563eb' }}>
                  {formatPrice(state.selectedPlan.price)}
                  <span style={{ fontSize: '16px', color: '#6b7280' }}>
                    {' '}
                    / {state.selectedPlan.billing_period === 'monthly' ? 'месяц' : 'год'}
                  </span>
                </p>
              </div>

              {state.error && (
                <div
                  style={{
                    background: '#fee2e2',
                    color: '#991b1b',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    fontSize: '14px',
                  }}
                >
                  {state.error}
                </div>
              )}

              <div
                style={{
                  background: '#f3f4f6',
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '24px',
                }}
              >
                <p
                  style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    margin: 0,
                    textAlign: 'center',
                  }}
                >
                  ℹ️ Это тестовая оплата (MVP). Реальный платежный шлюз будет подключен позже.
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                }}
              >
                <button
                  className={`${styles.button} ${styles.payButton}`}
                  onClick={handleConfirmPayment}
                  disabled={state.processing}
                >
                  {state.processing ? 'Обработка...' : 'Оплатить'}
                </button>
                <button
                  className={`${styles.button} ${styles.buttonSecondary}`}
                  onClick={handleCancelPayment}
                  disabled={state.processing}
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Plans;
