import { useState } from 'react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  PlusIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useAppStore } from '../../store/appStore';
import { Task } from '../../types';
import Button from '../../components/common/Button';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  isToday,
  startOfDay,
  endOfDay,
  parseISO,
} from 'date-fns';
import { ru } from 'date-fns/locale';

type ViewMode = 'month' | 'week' | 'day';

export default function Calendar() {
  const { tasks, leads } = useAppStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  const navigate = (direction: 'prev' | 'next') => {
    if (viewMode === 'month') {
      setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === 'prev' ? subDays(currentDate, 1) : addDays(currentDate, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      const taskDate = parseISO(task.dueDate);
      return isSameDay(taskDate, date);
    });
  };

  const getEventsForDate = (date: Date) => {
    const dateStart = startOfDay(date);
    const dateEnd = endOfDay(date);
    
    return leads.filter(lead => {
      if (!lead.appointmentDate) return false;
      const appointmentDate = parseISO(lead.appointmentDate);
      return appointmentDate >= dateStart && appointmentDate <= dateEnd;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Календарь</h1>
          <p className="mt-1 text-gray-600">
            Планируйте работу и напоминания для своих лидов
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={goToToday}>
            Сегодня
          </Button>
          <Button size="sm">
            <PlusIcon className="mr-2 h-4 w-4" />
            Новая задача
          </Button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('prev')}
              className="rounded-lg p-2 hover:bg-gray-100"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900">
              {viewMode === 'month' && format(currentDate, 'LLLL yyyy', { locale: ru })}
              {viewMode === 'week' && `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'd MMM', { locale: ru })} - ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'd MMM yyyy', { locale: ru })}`}
              {viewMode === 'day' && format(currentDate, 'd MMMM yyyy', { locale: ru })}
            </h2>
            <button
              onClick={() => navigate('next')}
              className="rounded-lg p-2 hover:bg-gray-100"
            >
              <ChevronRightIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          <div className="flex gap-2 rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                viewMode === 'month'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Месяц
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                viewMode === 'week'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Неделя
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                viewMode === 'day'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              День
            </button>
          </div>
        </div>

        {viewMode === 'month' && (
          <MonthView
            currentDate={currentDate}
            getTasksForDate={getTasksForDate}
            getEventsForDate={getEventsForDate}
          />
        )}
        {viewMode === 'week' && (
          <WeekView
            currentDate={currentDate}
            getTasksForDate={getTasksForDate}
            getEventsForDate={getEventsForDate}
          />
        )}
        {viewMode === 'day' && (
          <DayView
            currentDate={currentDate}
            getTasksForDate={getTasksForDate}
            getEventsForDate={getEventsForDate}
          />
        )}
      </div>
    </div>
  );
}

interface CalendarViewProps {
  currentDate: Date;
  getTasksForDate: (date: Date) => Task[];
  getEventsForDate: (date: Date) => any[];
}

function MonthView({ currentDate, getTasksForDate, getEventsForDate }: CalendarViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-px">
        {weekDays.map(day => (
          <div key={day} className="py-2 text-center text-sm font-medium text-gray-600">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px rounded-lg bg-gray-200 overflow-hidden">
        {days.map((day, index) => {
          const dayTasks = getTasksForDate(day);
          const dayEvents = getEventsForDate(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isDayToday = isToday(day);

          return (
            <div
              key={index}
              className={`min-h-[120px] bg-white p-2 ${
                !isCurrentMonth ? 'bg-gray-50' : ''
              }`}
            >
              <div
                className={`mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                  isDayToday
                    ? 'bg-primary-600 font-semibold text-white'
                    : isCurrentMonth
                    ? 'font-medium text-gray-900'
                    : 'text-gray-400'
                }`}
              >
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayTasks.slice(0, 2).map(task => (
                  <div
                    key={task.id}
                    className={`truncate rounded px-2 py-1 text-xs ${
                      task.status === 'overdue'
                        ? 'bg-red-100 text-red-700'
                        : task.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {task.title}
                  </div>
                ))}
                {dayEvents.slice(0, 1).map(event => (
                  <div
                    key={event.id}
                    className="truncate rounded bg-purple-100 px-2 py-1 text-xs text-purple-700"
                  >
                    {event.name}
                  </div>
                ))}
                {(dayTasks.length + dayEvents.length > 3) && (
                  <div className="text-xs text-gray-500">
                    +{dayTasks.length + dayEvents.length - 3} еще
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ currentDate, getTasksForDate, getEventsForDate }: CalendarViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        <div className="grid grid-cols-8 gap-px bg-gray-200">
          <div className="bg-white p-2 text-sm font-medium text-gray-600">Время</div>
          {days.map((day, index) => {
            const isDayToday = isToday(day);
            return (
              <div
                key={index}
                className={`bg-white p-2 text-center ${
                  isDayToday ? 'bg-primary-50' : ''
                }`}
              >
                <div className="text-sm font-medium text-gray-900">
                  {format(day, 'EEE', { locale: ru })}
                </div>
                <div
                  className={`mt-1 text-2xl font-semibold ${
                    isDayToday ? 'text-primary-600' : 'text-gray-700'
                  }`}
                >
                  {format(day, 'd')}
                </div>
              </div>
            );
          })}
        </div>
        <div className="relative">
          {hours.map(hour => (
            <div key={hour} className="grid grid-cols-8 gap-px bg-gray-200">
              <div className="bg-white p-2 text-xs text-gray-500">
                {hour.toString().padStart(2, '0')}:00
              </div>
              {days.map((day, dayIndex) => {
                const dayTasks = getTasksForDate(day);
                const dayEvents = getEventsForDate(day);
                const isDayToday = isToday(day);
                
                return (
                  <div
                    key={dayIndex}
                    className={`min-h-[60px] bg-white p-1 ${
                      isDayToday ? 'bg-primary-50/30' : ''
                    }`}
                  >
                    {hour === 9 && dayTasks.map((task, idx) => (
                      <div
                        key={task.id}
                        className={`mb-1 rounded px-2 py-1 text-xs ${
                          task.status === 'overdue'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                        style={{ marginTop: `${idx * 22}px` }}
                      >
                        {task.title}
                      </div>
                    ))}
                    {hour === 14 && dayEvents.map((event, idx) => (
                      <div
                        key={event.id}
                        className="mb-1 rounded bg-purple-100 px-2 py-1 text-xs text-purple-700"
                        style={{ marginTop: `${idx * 22}px` }}
                      >
                        {event.name}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DayView({ currentDate, getTasksForDate, getEventsForDate }: CalendarViewProps) {
  const dayTasks = getTasksForDate(currentDate);
  const dayEvents = getEventsForDate(currentDate);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="rounded-lg border border-gray-200">
          {hours.map(hour => (
            <div key={hour} className="border-b border-gray-100 last:border-0">
              <div className="flex">
                <div className="w-20 flex-shrink-0 border-r border-gray-100 p-3 text-xs text-gray-500">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div className="flex-1 p-3">
                  {hour === 9 && dayTasks.map(task => (
                    <div
                      key={task.id}
                      className={`mb-2 rounded-lg p-3 ${
                        task.status === 'overdue'
                          ? 'bg-red-50 border-l-4 border-red-500'
                          : 'bg-blue-50 border-l-4 border-blue-500'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <ClockIcon className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-900">{task.title}</span>
                      </div>
                      <div className="mt-1 text-xs text-gray-600">
                        {format(parseISO(task.dueDate), 'HH:mm', { locale: ru })}
                      </div>
                    </div>
                  ))}
                  {hour === 14 && dayEvents.map(event => (
                    <div
                      key={event.id}
                      className="mb-2 rounded-lg border-l-4 border-purple-500 bg-purple-50 p-3"
                    >
                      <div className="font-medium text-gray-900">{event.name}</div>
                      <div className="mt-1 text-xs text-gray-600">
                        Встреча: {format(parseISO(event.appointmentDate), 'HH:mm', { locale: ru })}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">{event.phone}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="rounded-lg bg-gray-50 p-4">
          <h3 className="mb-4 font-semibold text-gray-900">Сводка дня</h3>
          <div className="space-y-4">
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <div className="text-sm text-gray-600">Всего задач</div>
              <div className="mt-1 text-2xl font-bold text-gray-900">{dayTasks.length}</div>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <div className="text-sm text-gray-600">Встреч</div>
              <div className="mt-1 text-2xl font-bold text-gray-900">{dayEvents.length}</div>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <div className="text-sm text-gray-600">Просрочено</div>
              <div className="mt-1 text-2xl font-bold text-red-600">
                {dayTasks.filter(t => t.status === 'overdue').length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
