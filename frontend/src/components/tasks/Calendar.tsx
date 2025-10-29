import React, { useMemo } from 'react';
import { Task } from '../../hooks/useTasks';
import styles from './Calendar.module.css';

interface CalendarProps {
  tasks: Task[];
  currentDate: Date;
  viewType: 'month' | 'week' | 'day';
  onDateClick: (date: Date) => void;
  onTaskClick: (task: Task) => void;
}

const Calendar: React.FC<CalendarProps> = ({
  tasks,
  currentDate,
  viewType,
  onDateClick,
  onTaskClick,
}) => {
  const monthStart = useMemo(
    () => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
    [currentDate]
  );

  const monthEnd = useMemo(
    () => new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0),
    [currentDate]
  );

  const startDate = useMemo(() => {
    const day = monthStart.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    return new Date(monthStart.getTime() + diff * 86400000);
  }, [monthStart]);

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentMonth = (date: Date) => date.getMonth() === currentDate.getMonth();

  const getTasksForDate = (date: Date): Task[] => {
    return tasks.filter((task) => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date);
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const isOverdue = (task: Task): boolean => {
    if (!task.due_date || task.is_completed) return false;
    return new Date(task.due_date) < new Date();
  };

  const renderMonthView = () => {
    const weeks = [];
    let currentWeekDate = new Date(startDate);

    for (let week = 0; week < 6; week++) {
      const days = [];
      for (let day = 0; day < 7; day++) {
        const date = new Date(currentWeekDate);
        const dateTasks = getTasksForDate(date);

        days.push(
          <div
            key={date.toISOString()}
            className={`${styles.day} ${!isCurrentMonth(date) ? styles.otherMonth : ''} ${
              isToday(date) ? styles.today : ''
            }`}
            onClick={() => onDateClick(date)}
          >
            <div className={styles.dayNumber}>{date.getDate()}</div>
            <div className={styles.taskList}>
              {dateTasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className={`${styles.taskItem} ${isOverdue(task) ? styles.overdue : ''} ${
                    task.is_completed ? styles.completed : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTaskClick(task);
                  }}
                  title={task.title}
                >
                  {task.title}
                </div>
              ))}
              {dateTasks.length > 3 && (
                <div className={styles.moreIndicator}>+{dateTasks.length - 3} ещё</div>
              )}
            </div>
          </div>
        );

        currentWeekDate = new Date(currentWeekDate.getTime() + 86400000);
      }

      weeks.push(
        <div key={week} className={styles.week}>
          {days}
        </div>
      );
    }

    return weeks;
  };

  return (
    <div className={styles.calendar}>
      <div className={styles.weekDaysHeader}>
        {weekDays.map((day) => (
          <div key={day} className={styles.weekDay}>
            {day}
          </div>
        ))}
      </div>
      <div className={styles.monthGrid}>{renderMonthView()}</div>
    </div>
  );
};

export default Calendar;
