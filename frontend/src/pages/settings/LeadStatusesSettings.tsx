import React, { useState, useEffect } from 'react';
import { Button, Input, useToast } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import type { TenantLeadStatus } from '../../types';
import api from '../../utils/api';
import styles from './LeadStatusesSettings.module.css';

const defaultStatuses: TenantLeadStatus[] = [
  { key: 'new', label: 'Новый', color: '#38bdf8', order: 0 },
  { key: 'contacted', label: 'Связались', color: '#8b5cf6', order: 1 },
  { key: 'qualified', label: 'Квалифицирован', color: '#6366f1', order: 2 },
  { key: 'proposal_sent', label: 'Отправлено КП', color: '#f97316', order: 3 },
  { key: 'negotiation', label: 'Переговоры', color: '#eab308', order: 4 },
  { key: 'won', label: 'Успех', color: '#22c55e', order: 5 },
  { key: 'lost', label: 'Отказ', color: '#ef4444', order: 6 },
  { key: 'on_hold', label: 'Отложено', color: '#64748b', order: 7 },
];

const LeadStatusesSettings: React.FC = () => {
  const { tenant, updateTenant } = useAuthStore();
  const { showToast } = useToast();

  const [statuses, setStatuses] = useState<TenantLeadStatus[]>(defaultStatuses);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tenant?.settings?.lead_statuses && Array.isArray(tenant.settings.lead_statuses)) {
      setStatuses(tenant.settings.lead_statuses);
    }
  }, [tenant]);

  const handleAddStatus = () => {
    const newOrder = Math.max(...statuses.map((s) => s.order), -1) + 1;
    const newStatus: TenantLeadStatus = {
      key: `status_${Date.now()}`,
      label: 'Новый статус',
      color: '#6366f1',
      order: newOrder,
    };
    setStatuses([...statuses, newStatus]);
  };

  const handleUpdateStatus = (index: number, field: keyof TenantLeadStatus, value: string | number) => {
    const updated = [...statuses];
    updated[index] = { ...updated[index], [field]: value };
    setStatuses(updated);
  };

  const handleDeleteStatus = (index: number) => {
    if (statuses.length <= 1) {
      showToast('Должен быть хотя бы один статус', 'error');
      return;
    }
    const updated = statuses.filter((_, i) => i !== index);
    setStatuses(updated);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...statuses];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    updated.forEach((status, idx) => {
      status.order = idx;
    });
    setStatuses(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === statuses.length - 1) return;
    const updated = [...statuses];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    updated.forEach((status, idx) => {
      status.order = idx;
    });
    setStatuses(updated);
  };

  const handleSave = async () => {
    const uniqueKeys = new Set();
    for (const status of statuses) {
      if (!status.label.trim()) {
        showToast('Название статуса не может быть пустым', 'error');
        return;
      }
      if (uniqueKeys.has(status.key)) {
        showToast('Обнаружены дублирующиеся ключи статусов', 'error');
        return;
      }
      uniqueKeys.add(status.key);
    }

    setLoading(true);

    try {
      const response = await api.put('/api/v1/tenants/current/settings', {
        lead_statuses: statuses,
      });

      if (response.data?.data?.tenant) {
        updateTenant(response.data.data.tenant);
        showToast('Статусы успешно сохранены', 'success');
      }
    } catch (error) {
      console.error('Failed to save lead statuses:', error);
      showToast('Не удалось сохранить статусы', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Статусы лидов</h2>
          <p className={styles.description}>
            Настройте воронку продаж под ваш бизнес-процесс
          </p>
        </div>
        <Button onClick={handleAddStatus} variant="outline">
          + Добавить статус
        </Button>
      </div>

      <div className={styles.statusesList}>
        {statuses.map((status, index) => (
          <div key={status.key} className={styles.statusItem}>
            <div className={styles.statusOrder}>
              <button
                type="button"
                onClick={() => handleMoveUp(index)}
                disabled={index === 0}
                className={styles.orderButton}
                title="Переместить вверх"
              >
                ↑
              </button>
              <span className={styles.orderNumber}>{index + 1}</span>
              <button
                type="button"
                onClick={() => handleMoveDown(index)}
                disabled={index === statuses.length - 1}
                className={styles.orderButton}
                title="Переместить вниз"
              >
                ↓
              </button>
            </div>

            <div className={styles.statusFields}>
              <div className={styles.statusField}>
                <label>Название</label>
                <Input
                  value={status.label}
                  onChange={(e) => handleUpdateStatus(index, 'label', e.target.value)}
                  placeholder="Название статуса"
                />
              </div>

              <div className={styles.statusField}>
                <label>Цвет</label>
                <div className={styles.colorInput}>
                  <input
                    type="color"
                    value={status.color}
                    onChange={(e) => handleUpdateStatus(index, 'color', e.target.value)}
                    className={styles.colorPicker}
                  />
                  <Input
                    value={status.color}
                    onChange={(e) => handleUpdateStatus(index, 'color', e.target.value)}
                    placeholder="#6366f1"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleDeleteStatus(index)}
              className={styles.deleteButton}
              title="Удалить статус"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Сохранение...' : 'Сохранить изменения'}
        </Button>
      </div>
    </div>
  );
};

export default LeadStatusesSettings;
