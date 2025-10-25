/**
 * Input validation and sanitization utilities
 */

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate phone number (basic international format)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  return phoneRegex.test(cleanPhone);
}

/**
 * Validate password strength
 */
export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Пароль должен содержать минимум 8 символов');
  }
  
  if (password.length > 128) {
    errors.push('Пароль не должен превышать 128 символов');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Пароль должен содержать хотя бы одну строчную букву');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Пароль должен содержать хотя бы одну заглавную букву');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Пароль должен содержать хотя бы одну цифру');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Пароль должен содержать хотя бы один специальный символ');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  if (typeof document === 'undefined') {
    // Server-side fallback
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeHtml(html: string): string {
  if (typeof document === 'undefined') {
    return sanitizeString(html);
  }

  const allowedTags = ['b', 'i', 'em', 'strong', 'p', 'br'];
  const div = document.createElement('div');
  div.innerHTML = html;
  
  const walker = document.createTreeWalker(
    div,
    NodeFilter.SHOW_ELEMENT,
    null
  );
  
  const nodesToRemove: Node[] = [];
  
  while (walker.nextNode()) {
    const node = walker.currentNode as Element;
    if (!allowedTags.includes(node.tagName.toLowerCase())) {
      nodesToRemove.push(node);
    }
  }
  
  nodesToRemove.forEach(node => {
    node.parentNode?.removeChild(node);
  });
  
  return div.innerHTML;
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate date string
 */
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Sanitize form data object
 */
export function sanitizeFormData(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value;
    } else if (value === null || value === undefined) {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Validate required field
 */
export function isRequired(value: unknown): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
}

/**
 * Validate string length
 */
export function validateLength(
  value: string,
  min: number,
  max: number
): { isValid: boolean; error?: string } {
  const length = value.length;
  
  if (length < min) {
    return {
      isValid: false,
      error: `Минимальная длина: ${min} символов`,
    };
  }
  
  if (length > max) {
    return {
      isValid: false,
      error: `Максимальная длина: ${max} символов`,
    };
  }
  
  return { isValid: true };
}
