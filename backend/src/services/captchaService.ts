import { AppError } from '../utils/appError';
import { env } from '../config/env';
import logger from '../utils/logger';

type CaptchaProvider = 'recaptcha' | 'hcaptcha';

const PROVIDER_ENDPOINTS: Record<CaptchaProvider, string> = {
  recaptcha: 'https://www.google.com/recaptcha/api/siteverify',
  hcaptcha: 'https://hcaptcha.com/siteverify',
};

const provider = (env.PUBLIC_FORM_CAPTCHA_PROVIDER as CaptchaProvider | undefined) || 'recaptcha';
const secret = env.PUBLIC_FORM_CAPTCHA_SECRET;

export const isCaptchaEnabled = Boolean(secret);

export const verifyCaptcha = async (token?: string | null, ip?: string | null): Promise<void> => {
  if (!isCaptchaEnabled) {
    return;
  }

  if (!token) {
    throw new AppError('Captcha verification failed', 400);
  }

  const endpoint = PROVIDER_ENDPOINTS[provider];

  try {
    const body = new URLSearchParams({
      secret: secret!,
      response: token,
    });

    if (ip) {
      body.append('remoteip', ip);
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!response.ok) {
      logger.warn('Captcha verification request failed', {
        status: response.status,
        statusText: response.statusText,
      });
      throw new AppError('Captcha verification failed', 400);
    }

    const payload = (await response.json()) as { success: boolean; 'error-codes'?: string[] };

    if (!payload.success) {
      logger.warn('Captcha verification failed', {
        errorCodes: payload['error-codes'],
      });
      throw new AppError('Captcha verification failed', 400);
    }
  } catch (error) {
    logger.error('Captcha verification error', {
      error,
    });
    throw new AppError('Captcha verification failed', 400);
  }
};
