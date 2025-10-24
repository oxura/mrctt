import { CalendarIcon } from '@heroicons/react/24/outline';
import { useAppStore } from '../../store/appStore';

export default function Calendar() {
  const { tasks } = useAppStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Календарь и задачи</h1>
        <p className="mt-1 text-gray-600">
          Планируйте работу и напоминания для своих лидов
        </p>
      </div>

      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <CalendarIcon className="h-16 w-16 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-900">Календарь</h2>
          <p className="max-w-md text-gray-600">
            Полноценный календарь с просмотром по месяцам и неделям будет добавлен в следующей версии.
            Пока вы можете просматривать список задач ниже.
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Список задач</h2>
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
            >
              <div>
                <h3 className="font-medium text-gray-900">{task.title}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Дедлайн: {new Date(task.dueDate).toLocaleString('ru-RU')}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  task.status === 'overdue'
                    ? 'bg-red-100 text-red-700'
                    : task.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-primary-100 text-primary-700'
                }`}
              >
                {task.status === 'pending' && 'В работе'}
                {task.status === 'overdue' && 'Просрочено'}
                {task.status === 'completed' && 'Выполнено'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
