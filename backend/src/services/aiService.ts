import { TasksRepository } from '../repositories/tasksRepository';
import { UserRepository } from '../repositories/userRepository';

const taskRepo = new TasksRepository();
const userRepo = new UserRepository();

export class AIService {
  async processCommand(command: string, userId: string, tenantId: string): Promise<{ type: string; message: string; data?: any }> {
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('календарь') || lowerCommand.includes('напомни') || lowerCommand.includes('пометь') || lowerCommand.includes('запланируй') || lowerCommand.includes('днюха') || lowerCommand.includes('событие')) {
      return this.handleCalendarCommand(command, userId, tenantId);
    }

    return {
      type: 'unknown',
      message: 'Я пока не понимаю эту команду. Попробуйте попросить добавить событие в календарь (например: "12 ноября у друга днюха").',
    };
  }

  private async handleCalendarCommand(command: string, userId: string, tenantId: string) {
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    
    let date: Date | null = null;
    let title = command;

    // Check for "12 ноября" pattern
    const dateRegex = /(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)/i;
    const match = command.match(dateRegex);

    if (match) {
      const day = parseInt(match[1], 10);
      const monthIndex = months.indexOf(match[2].toLowerCase());
      const year = new Date().getFullYear();
      date = new Date(year, monthIndex, day);
      
      if (date < new Date()) {
         // If the date has passed this year, assume next year
         date.setFullYear(year + 1);
      }
    } else if (command.toLowerCase().includes('завтра')) {
       date = new Date();
       date.setDate(date.getDate() + 1);
    } else if (command.toLowerCase().includes('сегодня')) {
       date = new Date();
    }

    if (!date) {
       return {
         type: 'error',
         message: 'Я не понял, на какую дату поставить событие. Пожалуйста, укажите дату (например, 12 ноября).',
       };
    }
    
    // Create Task
    const task = await taskRepo.create(tenantId, {
        title: title,
        description: 'Created by AI Assistant',
        due_date: date,
        assigned_to: userId,
        priority: 'medium',
    }, userId);

    return {
        type: 'success',
        message: `Готово! Я добавил "${title}" в ваш календарь на ${date.toLocaleDateString('ru-RU')}.`,
        data: task
    };
  }
}
