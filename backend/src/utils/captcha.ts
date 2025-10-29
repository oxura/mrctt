import { URLSearchParams } from 'url';
import { env } from '../config/env';
import logger from './logger';
import { AppError } from './appError';

type CaptchaProvider = 'hcaptcha' | 'turnstile';

const getConfiguredProvider = (): CaptchaProvider | null => {
  if (env.CAPTCHA_PROVIDER) {
    if (env.CAPTCHA_PROVIDER === 'hcaptcha' && env.HCAPTCHA_SECRET) {
      return 'hcaptcha';
    }
    if (env.CAPTCHA_PROVIDER === 'turnstile' && env.TURNSTILE_SECRET) {
      return 'turnstile';
    }
    logger.warn('Captcha provider configured without corresponding secret', {
      provider: env.CAPTCHA_PROVIDER,
    });
    return null;
  }

  if (env.TURNSTILE_SECRET) {
    return 'turnstile';
  }

  if (env.HCAPTCHA_SECRET) {
    return 'hcaptcha';
  }

  return null;
};

const provider = getConfiguredProvider();

export const isCaptchaEnabled = (): boolean => provider !== null;

const verifyWithProvider = async (token: string, remoteIp: string | null): Promise<void> => {
  if (!provider) {
    logger.warn('Captcha verification attempted without provider configured');
    throw new AppError('Captcha verification unavailable', 503);
  }

  try {
    if (provider === 'hcaptcha' && env.HCAPTCHA_SECRET) {
      const body = new URLSearchParams({
        secret: env.HCAPTCHA_SECRET,
        response: token,
      });
      if (remoteIp) {
        body.append('remoteip', remoteIp);
      }

      const result = await fetch('https://hcaptcha.com/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });

      if (!result.ok) {
        logger.error('hCaptcha verification HTTP failure', {
          status: result.status,
        });
        throw new AppError('Captcha verification failed', 400);
      }

      const json = (await result.json()) as { success: boolean; [key: string]: unknown };

      if (!json.success) {
        logger.warn('hCaptcha verification failed', {
          remoteIp,
          errors: json['error-codes'],
        });
        throw new AppError('Captcha verification failed', 400);
      }

      return;
    }

    if (provider === 'turnstile' && env.TURNSTILE_SECRET) {
      const body = new URLSearchParams({
        secret: env.TURNSTILE_SECRET,
        response: token,
      });
      if (remoteIp) {
        body.append('remoteip', remoteIp);
      }

      const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });

      if (!result.ok) {
        logger.error('Turnstile verification HTTP failure', {
          status: result.status,
        });
        throw new AppError('Captcha verification failed', 400);
      }

      const json = (await result.json()) as { success: boolean; [key: string]: unknown };

      if (!json.success) {
        logger.warn('Turnstile verification failed', {
          remoteIp,
          errors: json['error-codes'],
        });
        throw new AppError('Captcha verification failed', 400);
      }

      return;
    }

    logger.error('Captcha provider mismatch', {
      provider,
    });
    throw new AppError('Captcha verification failed', 400);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error('Unexpected captcha verification failure', {
      message: error instanceof Error ? error.message : 'Unknown error',
      provider,
    });
    throw new AppError('Captcha verification failed', 400);
  }
};

export const verifyCaptchaToken = async (token: string | undefined, remoteIp: string | null): Promise<void> => {
  if (!isCaptchaEnabled()) {
    return;
  }

  if (!token) {
    logger.warn('Captcha token missing', {
      remoteIp,
    });
    throw new AppError('Captcha token is required', 400);
  }

  await verifyWithProvider(token, remoteIp);
};
