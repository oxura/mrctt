import nodemailer from 'nodemailer';
import { env } from '../config/env';
import logger from '../utils/logger';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    if (env.NODE_ENV === 'development' && !env.EMAIL_HOST) {
      logger.warn('Email service not configured. Emails will be logged to console only.');
      return;
    }

    if (!env.EMAIL_HOST || !env.EMAIL_PORT || !env.EMAIL_USER || !env.EMAIL_PASSWORD) {
      logger.warn('Email configuration incomplete. Emails will be logged to console only.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: env.EMAIL_HOST,
        port: env.EMAIL_PORT,
        secure: env.EMAIL_SECURE,
        auth: {
          user: env.EMAIL_USER,
          pass: env.EMAIL_PASSWORD,
        },
      });

      this.transporter.verify().catch((error) => {
        logger.warn('Email transporter verification failed', error);
      });

      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.transporter) {
        logger.info('Email would be sent (transporter not configured):', {
          to: options.to,
          subject: options.subject,
          preview: options.text?.substring(0, 100) || options.html.substring(0, 100),
        });
        return true;
      }

      const fromAddress = env.EMAIL_FROM_ADDRESS || env.EMAIL_USER || 'no-reply@ecosystem.app';
      const fromName = env.EMAIL_FROM_NAME || 'Экосистема заявок';

      const info = await this.transporter.sendMail({
        from: `${fromName} <${fromAddress}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      logger.info('Email sent successfully:', {
        to: options.to,
        subject: options.subject,
        messageId: info.messageId,
      });

      return true;
    } catch (error) {
      logger.error('Failed to send email:', {
        to: options.to,
        subject: options.subject,
        error,
      });
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, resetUrl: string, firstName?: string): Promise<boolean> {
    const recipientName = firstName || 'Пользователь';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌿 Экосистема заявок</h1>
            <p>Восстановление пароля</p>
          </div>
          <div class="content">
            <p>Здравствуйте, ${recipientName}!</p>
            <p>Вы получили это письмо, потому что был запрошен сброс пароля для вашего аккаунта.</p>
            <p>Чтобы создать новый пароль, нажмите на кнопку ниже:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Создать новый пароль</a>
            </div>
            <p>Или скопируйте эту ссылку в браузер:</p>
            <p style="word-break: break-all; background: white; padding: 10px; border-radius: 4px;">${resetUrl}</p>
            <div class="warning">
              <strong>⏱️ Важно:</strong> Эта ссылка действительна в течение 1 часа.
            </div>
            <p>Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо. Ваш пароль останется без изменений.</p>
            <div class="footer">
              <p>С уважением,<br>Команда Экосистема заявок</p>
              <p style="margin-top: 20px;">Это автоматическое письмо, пожалуйста, не отвечайте на него.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Здравствуйте, ${recipientName}!

Вы получили это письмо, потому что был запрошен сброс пароля для вашего аккаунта в системе "Экосистема заявок".

Чтобы создать новый пароль, перейдите по следующей ссылке:
${resetUrl}

Важно: Эта ссылка действительна в течение 1 часа.

Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо. Ваш пароль останется без изменений.

С уважением,
Команда Экосистема заявок
    `.trim();

    return this.sendEmail({
      to: email,
      subject: 'Восстановление пароля - Экосистема заявок',
      html,
      text,
    });
  }

  async sendWelcomeEmail(email: string, firstName?: string, companyName?: string): Promise<boolean> {
    const recipientName = firstName || 'Пользователь';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #667eea; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Добро пожаловать!</h1>
            <p>Ваш аккаунт успешно создан</p>
          </div>
          <div class="content">
            <p>Здравствуйте, ${recipientName}!</p>
            <p>Спасибо за регистрацию в системе <strong>Экосистема заявок</strong>!</p>
            ${companyName ? `<p>Ваша компания <strong>${companyName}</strong> готова к работе.</p>` : ''}
            <h3>Что дальше?</h3>
            <div class="feature">
              <strong>1. Завершите онбординг</strong><br>
              Выберите нишу вашего бизнеса и настройте модули системы
            </div>
            <div class="feature">
              <strong>2. Создайте первый продукт/услугу</strong><br>
              Добавьте то, что вы предлагаете клиентам
            </div>
            <div class="feature">
              <strong>3. Создайте форму для сбора лидов</strong><br>
              Получите ссылку и разместите её в соцсетях или на сайте
            </div>
            <div class="feature">
              <strong>4. Пригласите команду</strong><br>
              Добавьте менеджеров и настройте права доступа
            </div>
            <p>У вас есть 14 дней бесплатного пробного периода, чтобы оценить все возможности системы.</p>
            <div style="text-align: center;">
              <a href="${env.FRONTEND_URL}/onboarding" class="button">Начать настройку</a>
            </div>
            <div class="footer">
              <p>Если у вас возникнут вопросы, мы всегда готовы помочь!</p>
              <p>С уважением,<br>Команда Экосистема заявок</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Здравствуйте, ${recipientName}!

Спасибо за регистрацию в системе "Экосистема заявок"!

${companyName ? `Ваша компания ${companyName} готова к работе.` : ''}

Что дальше?

1. Завершите онбординг - выберите нишу вашего бизнеса и настройте модули системы
2. Создайте первый продукт/услугу - добавьте то, что вы предлагаете клиентам
3. Создайте форму для сбора лидов - получите ссылку и разместите её в соцсетях или на сайте
4. Пригласите команду - добавьте менеджеров и настройте права доступа

У вас есть 14 дней бесплатного пробного периода, чтобы оценить все возможности системы.

Начать настройку: ${env.FRONTEND_URL}/onboarding

Если у вас возникнут вопросы, мы всегда готовы помочь!

С уважением,
Команда Экосистема заявок
    `.trim();

    return this.sendEmail({
      to: email,
      subject: 'Добро пожаловать в Экосистему заявок!',
      html,
      text,
    });
  }
}

export const emailService = new EmailService();
