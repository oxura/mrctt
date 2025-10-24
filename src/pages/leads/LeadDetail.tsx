import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  ArrowLeftIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import Input from '../../components/common/Input';
import { useAppStore } from '../../store/appStore';
import { nanoid } from '../../utils/nanoid';

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { leads, company, products, groups, team, updateLead, addLeadHistory, addNoteToLead, addTask } = useAppStore();

  const lead = leads.find((l) => l.id === id);
  const [comment, setComment] = useState('');
  const [activeTab, setActiveTab] = useState<'comments' | 'history' | 'tasks'>('comments');
  const [showTaskModal, setShowTaskModal] = useState(false);

  if (!lead) {
    return (
      <div className="text-center">
        <p className="text-gray-500">Лид не найден</p>
        <Button onClick={() => navigate('/leads')} className="mt-4">
          Вернуться к списку лидов
        </Button>
      </div>
    );
  }

  const product = products.find((p) => p.id === lead.productId);
  const group = groups.find((g) => g.id === lead.groupId);
  const owner = team.find((u) => u.id === lead.ownerId);
  const currentStatus = company?.leadStatuses.find((s) => s.id === lead.statusId);

  const handleStatusChange = (newStatusId: string) => {
    const newStatus = company?.leadStatuses.find((s) => s.id === newStatusId);
    updateLead(lead.id, { statusId: newStatusId });
    addLeadHistory(lead.id, {
      id: nanoid(),
      type: 'status_change',
      message: `Статус изменен на "${newStatus?.name}"`,
      createdAt: new Date().toISOString(),
      createdBy: 'current-user',
    });
  };

  const handleCommentSubmit = () => {
    if (comment.trim()) {
      addNoteToLead(lead.id, comment);
      setComment('');
    }
  };

  const handleCreateTask = (taskData: { title: string; dueDate: string }) => {
    addTask({
      id: nanoid(),
      title: taskData.title,
      dueDate: taskData.dueDate,
      leadId: lead.id,
      ownerId: lead.ownerId || 'current-user',
      status: 'pending',
    });
    setShowTaskModal(false);
  };

  return (
    <div>
      <Button variant="ghost" onClick={() => navigate('/leads')} className="mb-6">
        <ArrowLeftIcon className="mr-2 h-4 w-4" />
        Назад к лидам
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">{lead.name}</h1>
              <span
                className="rounded-full px-3 py-1 text-sm font-medium text-white"
                style={{ backgroundColor: currentStatus?.color }}
              >
                {currentStatus?.name}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center text-gray-700">
                <PhoneIcon className="mr-3 h-5 w-5 text-gray-400" />
                <a href={`tel:${lead.phone}`} className="hover:text-primary-600">
                  {lead.phone}
                </a>
                <a
                  href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-3 text-sm text-green-600 hover:underline"
                >
                  WhatsApp
                </a>
              </div>

              {lead.email && (
                <div className="flex items-center text-gray-700">
                  <EnvelopeIcon className="mr-3 h-5 w-5 text-gray-400" />
                  <a href={`mailto:${lead.email}`} className="hover:text-primary-600">
                    {lead.email}
                  </a>
                </div>
              )}

              {lead.appointmentDate && (
                <div className="flex items-center text-gray-700">
                  <CalendarIcon className="mr-3 h-5 w-5 text-gray-400" />
                  <span>
                    Прием: {new Date(lead.appointmentDate).toLocaleString('ru-RU')}
                  </span>
                </div>
              )}

              <div className="mt-4 grid grid-cols-2 gap-4 border-t pt-4">
                {product && (
                  <div>
                    <p className="text-sm text-gray-500">Продукт</p>
                    <p className="mt-1 font-medium text-gray-900">{product.name}</p>
                  </div>
                )}
                {group && (
                  <div>
                    <p className="text-sm text-gray-500">Группа</p>
                    <p className="mt-1 font-medium text-gray-900">{group.name}</p>
                  </div>
                )}
                {lead.source && (
                  <div>
                    <p className="text-sm text-gray-500">Источник</p>
                    <p className="mt-1 font-medium text-gray-900">{lead.source}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Создан</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {new Date(lead.createdAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white shadow-sm">
            <div className="flex border-b">
              {(['comments', 'history', 'tasks'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'border-b-2 border-primary-600 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {tab === 'comments' && 'Комментарии'}
                  {tab === 'history' && 'История'}
                  {tab === 'tasks' && 'Задачи'}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === 'comments' && (
                <div className="space-y-4">
                  <div>
                    <textarea
                      placeholder="Оставить комментарий..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      rows={3}
                    />
                    <Button onClick={handleCommentSubmit} className="mt-2" size="sm">
                      Отправить
                    </Button>
                  </div>
                  <div className="space-y-3 border-t pt-4">
                    {lead.history
                      .filter((h) => h.type === 'comment')
                      .map((item) => (
                        <div key={item.id} className="rounded-lg bg-gray-50 p-3">
                          <p className="text-sm text-gray-700">{item.message}</p>
                          <p className="mt-2 text-xs text-gray-500">
                            {new Date(item.createdAt).toLocaleString('ru-RU')}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-4">
                  {lead.history.map((item) => (
                    <div key={item.id} className="flex items-start space-x-3">
                      <div className="mt-1 h-2 w-2 rounded-full bg-primary-600" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">{item.message}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {new Date(item.createdAt).toLocaleString('ru-RU')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'tasks' && (
                <div>
                  <Button onClick={() => setShowTaskModal(true)} size="sm">
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Создать задачу
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Действия</h2>

            <Select
              label="Статус"
              value={lead.statusId}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              {company?.leadStatuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </Select>

            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-gray-700">Ответственный</p>
              <Select
                value={lead.ownerId || ''}
                onChange={(e) => updateLead(lead.id, { ownerId: e.target.value })}
              >
                <option value="">Не назначен</option>
                {team.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="mt-6 space-y-2">
              <Button variant="secondary" className="w-full" size="sm">
                Позвонить
              </Button>
              <Button variant="secondary" className="w-full" size="sm">
                Написать в Telegram
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showTaskModal && (
        <TaskModal
          onClose={() => setShowTaskModal(false)}
          onCreate={handleCreateTask}
        />
      )}
    </div>
  );
}

interface TaskModalProps {
  onClose: () => void;
  onCreate: (data: { title: string; dueDate: string }) => void;
}

function TaskModal({ onClose, onCreate }: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && dueDate) {
      onCreate({ title, dueDate });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Новая задача</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Название задачи"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Перезвонить клиенту"
            required
          />
          <Input
            label="Дедлайн"
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit">Создать задачу</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
