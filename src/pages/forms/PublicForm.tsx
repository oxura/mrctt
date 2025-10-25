import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { useAppStore } from '../../store/appStore';
import { generateSecureId } from '../../utils/crypto';
import { isValidEmail, isValidPhone, sanitizeFormData } from '../../utils/validation';
import { generateBrowserFingerprint, rateLimiter, RATE_LIMITS } from '../../utils/security';

export default function PublicForm() {
  const { formId } = useParams<{ formId: string }>();
  const { forms, products, addLead, company } = useAppStore();

  const form = forms.find((f) => f.id === formId);

  if (!form) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <h1 className="text-2xl font-bold text-gray-900">Анкета не найдена</h1>
          <p className="mt-2 text-gray-600">Проверьте ссылку и попробуйте снова</p>
        </div>
      </div>
    );
  }

  const product = products.find((p) => p.id === form.productId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4">
      <div className="mx-auto max-w-lg">
        <div className="rounded-3xl bg-white p-8 shadow-xl">
          <div className="mb-6 text-center">
            {company?.logoUrl ? (
              <img src={company.logoUrl} alt={company.name} className="mx-auto h-12" />
            ) : (
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-xl font-bold text-primary-600">
                {company?.name.charAt(0)}
              </div>
            )}
            <h1 className="mt-4 text-2xl font-bold text-gray-900">{form.name}</h1>
            {product && (
              <p className="mt-2 text-sm text-gray-500">Продукт: {product.name}</p>
            )}
          </div>

          <FormRenderer formId={form.id} />

          <p className="mt-6 text-center text-sm text-gray-500">{form.thankYouMessage}</p>
        </div>
      </div>
    </div>
  );
}

function FormRenderer({ formId }: { formId: string }) {
  const { forms, addLead, company, leads } = useAppStore();
  const form = forms.find((f) => f.id === formId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fingerprint = useMemo(() => generateBrowserFingerprint(), []);
  const rateLimitKey = useMemo(() => `form-${formId}-${fingerprint}`, [formId, fingerprint]);

  if (!form) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    if (!rateLimiter.isAllowed(rateLimitKey, RATE_LIMITS.publicForm)) {
      setErrors({ 
        submit: 'Слишком много попыток отправки. Пожалуйста, попробуйте через минуту.' 
      });
      return;
    }
    
    setErrors({});
    setSubmitSuccess(false);

    const formData = new FormData(e.currentTarget);
    const rawData = Object.fromEntries(formData.entries());
    const sanitizedData = sanitizeFormData(rawData) as Record<string, string | undefined>;

    const validationErrors: Record<string, string> = {};

    form.fields.forEach((field) => {
      const value = sanitizedData[field.id];
      
      if (field.required && !value) {
        validationErrors[field.id] = `${field.label} обязательно для заполнения`;
      }

      if (value && field.type === 'email' && !isValidEmail(value)) {
        validationErrors[field.id] = 'Введите корректный email адрес';
      }

      if (value && field.type === 'phone' && !isValidPhone(value)) {
        validationErrors[field.id] = 'Введите корректный номер телефона';
      }
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      if (!company) {
        setErrors({ submit: 'Данные компании недоступны. Попробуйте позже.' });
        return;
      }

      const statusId = company.leadStatuses[0]?.id || 'status-new';
      const sameStatusCount = leads.filter((lead) => lead.statusId === statusId).length;

      const nameField = form.fields.find((field) => field.type === 'text');
      const phoneField = form.fields.find((field) => field.type === 'phone');
      const emailField = form.fields.find((field) => field.type === 'email');

      const leadName = nameField ? sanitizedData[nameField.id] : undefined;
      const leadPhone = phoneField ? sanitizedData[phoneField.id] : undefined;
      const leadEmail = emailField ? sanitizedData[emailField.id] : undefined;

      const notes = form.fields
        .map((field) => {
          const value = sanitizedData[field.id];
          if (!value) return null;
          return `${field.label}: ${value}`;
        })
        .filter((value): value is string => Boolean(value));

      addLead({
        id: generateSecureId(),
        companyId: company.id,
        createdAt: new Date().toISOString(),
        email: typeof leadEmail === 'string' && leadEmail.trim() ? leadEmail.trim() : undefined,
        name: typeof leadName === 'string' && leadName.trim() ? leadName.trim() : 'Новый лид',
        phone: typeof leadPhone === 'string' && leadPhone.trim() ? leadPhone.trim() : undefined,
        productId: form.productId,
        statusId,
        kanbanOrder: sameStatusCount,
        ownerId: undefined,
        groupId: undefined,
        notes,
        history: [
          {
            id: generateSecureId(),
            type: 'creation',
            message: 'Лид создан через публичную форму',
            createdAt: new Date().toISOString(),
            createdBy: 'system',
          },
        ],
        source: 'public-form',
      });

      rateLimiter.recordSuccess(rateLimitKey);

      setSubmitSuccess(true);
      e.currentTarget.reset();
    } catch (error) {
      console.error('Public form submission error', error);
      setErrors({ submit: 'Произошла ошибка при отправке формы. Попробуйте снова.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="space-y-4 rounded-lg bg-green-50 p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Спасибо!</h3>
        <p className="text-sm text-gray-600">{form.thankYouMessage}</p>
        <Button type="button" className="w-full" onClick={() => setSubmitSuccess(false)}>
          Отправить ещё одну заявку
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.submit && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {errors.submit}
        </div>
      )}
      
      {form.fields.map((field) => {
        if (field.type === 'select' && field.options) {
          return (
            <Select 
              key={field.id} 
              label={field.label} 
              name={field.id} 
              required={field.required}
              error={errors[field.id]}
            >
              <option value="">Выберите...</option>
              {field.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          );
        }

        return (
          <Input
            key={field.id}
            label={field.label}
            name={field.id}
            required={field.required}
            type={field.type === 'text' ? 'text' : field.type}
            error={errors[field.id]}
          />
        );
      })}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Отправка...' : 'Отправить заявку'}
      </Button>
    </form>
  );
}
