import { useParams } from 'react-router-dom';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { useAppStore } from '../../store/appStore';
import { nanoid } from '../../utils/nanoid';

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

  if (!form) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const leadData = Object.fromEntries(formData.entries());

    const statusId = company?.leadStatuses[0]?.id || 'status-new';
    const sameStatusCount = leads.filter((lead) => lead.statusId === statusId).length;

    addLead({
      id: nanoid(),
      companyId: company!.id,
      createdAt: new Date().toISOString(),
      email: (leadData.email as string) || '',
      name: (leadData.name as string) || 'Новый лид',
      phone: (leadData.phone as string) || '',
      productId: form.productId,
      statusId,
      kanbanOrder: sameStatusCount,
      ownerId: undefined,
      groupId: undefined,
      notes: [],
      history: [],
      source: 'public-form',
    });

    alert('Спасибо! Мы свяжемся с вами.');
    e.currentTarget.reset();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {form.fields.map((field) => {
        if (field.type === 'select' && field.options) {
          return (
            <Select key={field.id} label={field.label} name={field.id} required={field.required}>
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
          />
        );
      })}

      <Button type="submit" className="w-full">
        Отправить заявку
      </Button>
    </form>
  );
}
