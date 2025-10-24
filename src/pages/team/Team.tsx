import { PlusIcon, UserIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { useAppStore, roleLabels } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { nanoid } from '../../utils/nanoid';
import { User } from '../../types';

export default function Team() {
  const { team, company } = useAppStore();
  const { user } = useAuthStore();
  const [showInviteModal, setShowInviteModal] = useState(false);

  const canManageTeam = user?.role === 'owner' || user?.role === 'admin';

  if (company?.modules.find((m) => m.key === 'team' && !m.enabled)) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <UserIcon className="h-16 w-16 text-gray-300 mx-auto" />
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Режим соло</h1>
        <p className="mt-2 text-gray-600">
          Командный модуль отключен. Вы можете включить его в настройках компании.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Команда</h1>
          <p className="mt-1 text-gray-600">
            Управляйте пользователями, ролями и доступами в системе
          </p>
        </div>
        {canManageTeam && (
          <Button onClick={() => setShowInviteModal(true)}>
            <PlusIcon className="mr-2 h-5 w-5" />
            Пригласить участника
          </Button>
        )}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b text-gray-700">
            <tr>
              <th className="pb-3 font-medium">Имя</th>
              <th className="pb-3 font-medium">Email</th>
              <th className="pb-3 font-medium">Роль</th>
              <th className="pb-3 font-medium">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {team.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="py-3 font-medium text-gray-900">{member.name}</td>
                <td className="py-3 text-gray-600">{member.email}</td>
                <td className="py-3 text-gray-600">{roleLabels[member.role]}</td>
                <td className="py-3">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                    Активен
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showInviteModal && (
        <InviteModal onClose={() => setShowInviteModal(false)} />
      )}
    </div>
  );
}

interface InviteModalProps {
  onClose: () => void;
}

function InviteModal({ onClose }: InviteModalProps) {
  const { team, addTeamMember } = useAppStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'manager',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newMember: User = {
      id: nanoid(),
      name: formData.name,
      email: formData.email,
      role: formData.role as User['role'],
      onboardingCompleted: true,
      companyId: team[0]?.companyId,
    };
    addTeamMember(newMember);
    onClose();
    alert('Приглашение отправлено!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Пригласить участника</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Имя"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <Select
            label="Роль"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          >
            <option value="admin">Администратор</option>
            <option value="manager">Менеджер</option>
          </Select>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit">Отправить приглашение</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
