import { useState } from 'react';
import { PlusIcon, ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { useAppStore } from '../../store/appStore';
import { FormField, LeadForm } from '../../types';
import { nanoid } from '../../utils/nanoid';

export default function FormBuilder() {
  const { forms, products, addForm } = useAppStore();
  const [showFormModal, setShowFormModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Конструктор анкет</h1>
          <p className="mt-1 text-gray-600">
            Создавайте формы для сбора лидов из соцсетей и веб-сайта
          </p>
        </div>
        <Button onClick={() => setShowFormModal(true)}>
          <PlusIcon className="mr-2 h-5 w-5" />
          Создать анкету
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {forms.map((form) => {
          const product = products.find((p) => p.id === form.productId);
          return (
            <div key={form.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{form.name}</h3>
                <ClipboardDocumentIcon className="h-6 w-6 text-gray-400" />
              </div>
              {product && (
                <p className="mb-2 text-sm text-gray-600">Продукт: {product.name}</p>
              )}
              <p className="mb-2 text-sm text-gray-500">{form.fields.length} полей</p>
              <div className="mt-4 rounded-lg bg-gray-50 p-3">
                <p className="text-xs font-medium text-gray-700">Публичная ссылка:</p>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={form.publicUrl}
                    readOnly
                    className="flex-1 rounded border border-gray-300 bg-white px-2 py-1 text-xs"
                  />
                  <button
                    onClick={() => handleCopyUrl(form.publicUrl)}
                    className="rounded bg-primary-600 p-2 text-white hover:bg-primary-700"
                  >
                    {copiedUrl === form.publicUrl ? (
                      <CheckIcon className="h-4 w-4" />
                    ) : (
                      <ClipboardDocumentIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {forms.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500 md:col-span-2 xl:col-span-3">
            Создайте первую анкету для сбора лидов
          </div>
        )}
      </div>

      {showFormModal && (
        <CreateFormModal onClose={() => setShowFormModal(false)} onCreate={addForm} />
      )}
    </div>
  );
}

interface CreateFormModalProps {
  onClose: () => void;
  onCreate: (form: LeadForm) => void;
}

function CreateFormModal({ onClose, onCreate }: CreateFormModalProps) {
  const { products } = useAppStore();
  const [formName, setFormName] = useState('');
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [thankYouMessage, setThankYouMessage] = useState('Спасибо! Мы свяжемся с вами в течение 15 минут.');
  
  const defaultFields: FormField[] = [
    { id: nanoid(), type: 'text', label: 'Имя', required: true },
    { id: nanoid(), type: 'phone', label: 'Телефон', required: true },
    { id: nanoid(), type: 'email', label: 'Email', required: false },
  ];

  const [fields] = useState<FormField[]>(defaultFields);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formId = nanoid();
    const newForm: LeadForm = {
      id: formId,
      name: formName,
      productId,
      thankYouMessage,
      fields,
      publicUrl: `${window.location.origin}/forms/${formId}/public`,
    };
    onCreate(newForm);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Создать анкету</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Название анкеты"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Например: Анкета на курс UX/UI"
            required
          />
          <Select
            label="К какому продукту привязать лиды?"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            <option value="">Не привязывать</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </Select>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Сообщение после отправки
            </label>
            <textarea
              value={thankYouMessage}
              onChange={(e) => setThankYouMessage(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
            />
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-gray-700">Поля формы (базовый набор):</h3>
            <div className="space-y-2 rounded-lg border border-gray-200 p-4">
              {fields.map((field) => (
                <div key={field.id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{field.label}</span>
                  <span className="text-xs text-gray-500">
                    {field.type} {field.required && '(обязательное)'}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Полноценный конструктор с drag-and-drop будет добавлен в следующей версии
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit">Создать анкету</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
