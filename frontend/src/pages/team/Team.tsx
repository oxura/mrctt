import React, { useState, useEffect } from 'react';
import AppLayout from '../../layouts/AppLayout';
import styles from './Team.module.css';
import api from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

interface TeamMember {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  is_active: boolean;
  teamMemberStatus: string;
  created_at: string;
}

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  status: string;
  invitedAt: string;
  expiresAt: string;
}

const Team: React.FC = () => {
  const tenant = useAuthStore((state) => state.tenant);
  const user = useAuthStore((state) => state.user);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'manager'>('manager');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/users/team');
      setMembers(response.data.data.users || []);
      setPendingInvites(response.data.data.pendingInvites || []);
    } catch (err) {
      console.error('Failed to fetch team members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setProcessing(true);

    try {
      await api.post('/api/v1/users/team/invite', {
        email: inviteEmail,
        role: inviteRole,
      });

      setSuccess('Приглашение отправлено на email');
      setInviteEmail('');
      setInviteRole('manager');
      setShowInviteModal(false);
      await fetchTeamMembers();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { data?: { message?: string } } }).response;
        setError(response?.data?.message || 'Не удалось отправить приглашение');
      } else {
        setError('Не удалось отправить приглашение');
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'manager') => {
    if (!window.confirm('Вы уверены, что хотите изменить роль этого участника?')) {
      return;
    }

    try {
      await api.patch(`/api/v1/users/team/${userId}/role`, { role: newRole });
      setSuccess('Роль успешно обновлена');
      await fetchTeamMembers();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { data?: { message?: string } } }).response;
        setError(response?.data?.message || 'Не удалось изменить роль');
      } else {
        setError('Не удалось изменить роль');
      }
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого участника из команды?')) {
      return;
    }

    try {
      await api.delete(`/api/v1/users/team/${userId}`);
      setSuccess('Участник успешно удален');
      await fetchTeamMembers();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { data?: { message?: string } } }).response;
        setError(response?.data?.message || 'Не удалось удалить участника');
      } else {
        setError('Не удалось удалить участника');
      }
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    if (!window.confirm('Отменить приглашение?')) {
      return;
    }

    try {
      await api.delete(`/api/v1/users/team/invite/${inviteId}`);
      setSuccess('Приглашение отменено');
      await fetchTeamMembers();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { data?: { message?: string } } }).response;
        setError(response?.data?.message || 'Не удалось отменить приглашение');
      } else {
        setError('Не удалось отменить приглашение');
      }
    }
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Владелец';
      case 'admin':
        return 'Администратор';
      case 'manager':
        return 'Менеджер';
      default:
        return role;
    }
  };

  const getInitials = (member: TeamMember) => {
    if (member.first_name) {
      return member.first_name[0] + (member.last_name ? member.last_name[0] : '');
    }
    return member.email[0].toUpperCase();
  };

  const getName = (member: TeamMember) => {
    if (member.first_name) {
      return `${member.first_name}${member.last_name ? ' ' + member.last_name : ''}`;
    }
    return member.email;
  };

  const canManageTeam = user?.role === 'owner' || user?.role === 'admin';

  if (loading) {
    return (
      <AppLayout breadcrumbs={['Команда']}>
        <div className={styles.team}>
          <p>Загрузка...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={['Команда']}>
      <div className={styles.team}>
        <div className={styles.header}>
          <h1>Команда и роли</h1>
          {canManageTeam && (
            <Button onClick={() => setShowInviteModal(true)}>+ Пригласить участника</Button>
          )}
        </div>

        {error && (
          <div className={styles.errorBanner}>
            <p>{error}</p>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {success && (
          <div className={styles.successBanner}>
            <p>{success}</p>
            <button onClick={() => setSuccess(null)}>×</button>
          </div>
        )}

        {pendingInvites.length > 0 && (
          <div className={styles.section}>
            <h2>Ожидают принятия приглашения</h2>
            <div className={styles.table}>
              <table>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Роль</th>
                    <th>Приглашен</th>
                    <th>Истекает</th>
                    {canManageTeam && <th>Действия</th>}
                  </tr>
                </thead>
                <tbody>
                  {pendingInvites.map((invite) => (
                    <tr key={invite.id}>
                      <td>{invite.email}</td>
                      <td>{getRoleDisplay(invite.role)}</td>
                      <td>{new Date(invite.invitedAt).toLocaleDateString('ru-RU')}</td>
                      <td>{new Date(invite.expiresAt).toLocaleDateString('ru-RU')}</td>
                      {canManageTeam && (
                        <td>
                          <button
                            className={styles.btnDanger}
                            onClick={() => handleCancelInvite(invite.id)}
                          >
                            Отменить
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className={styles.section}>
          <h2>Участники команды ({members.length})</h2>
          <div className={styles.table}>
            <table>
              <thead>
                <tr>
                  <th>Пользователь</th>
                  <th>Email</th>
                  <th>Роль</th>
                  <th>Статус</th>
                  {canManageTeam && <th>Действия</th>}
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <div className={styles.userCell}>
                        <div className={styles.avatar}>{getInitials(member)}</div>
                        <span>{getName(member)}</span>
                      </div>
                    </td>
                    <td>{member.email}</td>
                    <td>
                      {canManageTeam && member.role !== 'owner' && member.id !== user?.id ? (
                        <select
                          value={member.role}
                          onChange={(e) =>
                            handleUpdateRole(member.id, e.target.value as 'admin' | 'manager')
                          }
                          className={styles.roleSelect}
                        >
                          <option value="admin">Администратор</option>
                          <option value="manager">Менеджер</option>
                        </select>
                      ) : (
                        getRoleDisplay(member.role)
                      )}
                    </td>
                    <td>
                      <span
                        className={`${styles.badge} ${member.is_active ? styles.active : styles.inactive}`}
                      >
                        {member.is_active ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>
                    {canManageTeam && (
                      <td>
                        {member.role !== 'owner' && member.id !== user?.id && (
                          <button
                            className={styles.btnDanger}
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            Удалить
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showInviteModal && (
          <Modal onClose={() => setShowInviteModal(false)} title="Пригласить участника">
            <form onSubmit={handleInvite} className={styles.inviteForm}>
              <Input
                label="Email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />

              <div className={styles.formGroup}>
                <label>Роль</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'admin' | 'manager')}
                  className={styles.select}
                >
                  <option value="manager">Менеджер</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>

              <div className={styles.modalActions}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowInviteModal(false)}
                >
                  Отмена
                </Button>
                <Button type="submit" disabled={processing}>
                  {processing ? 'Отправка...' : 'Отправить приглашение'}
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </AppLayout>
  );
};

export default Team;
