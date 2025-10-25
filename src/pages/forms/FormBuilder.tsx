import { useState } from 'react';
import { 
  PlusIcon, 
  ClipboardDocumentIcon, 
  CheckIcon,
  TrashIcon,
  PencilIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { useAppStore } from '../../store/appStore';
import { FormField, LeadForm } from '../../types';
import { nanoid } from '../../utils/nanoid';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const fieldTypes = [
  { value: 'text', label: 'Текст', icon: '📝' },
  { value: 'phone', label: 'Телефон', icon: '📞' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'select', label: 'Выбор', icon: '📋' },
  { value: 'checkbox', label: 'Чекбокс', icon: '☑️' },
  { value: 'date', label: 'Дата', icon: '📅' },
];

export default function FormBuilder() {
  const { forms, products, addForm, updateForm } = useAppStore();
  const [showFormModal, setShowFormModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<LeadForm | null>(null);

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleCreateForm = () => {
    setEditingForm(null);
    setShowFormModal(true);
  };

  const handleEditForm = (form: LeadForm) => {
    setEditingForm(form);
    setShowFormModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Конструктор анкет</h1>
          <p className="mt-1 text-gray-600">
            Создавайте формы для сбора лидов с drag-and-drop полями
          </p>
        </div>
        <Button onClick={handleCreateForm}>
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
                <button
                  onClick={() => handleEditForm(form)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
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
        <FormBuilderModal 
          onClose={() => setShowFormModal(false)} 
          onCreate={addForm}
          onUpdate={updateForm}
          existingForm={editingForm}
        />
      )}
    </div>
  );
}

interface FormBuilderModalProps {
  onClose: () => void;
  onCreate: (form: LeadForm) => void;
  onUpdate: (formId: string, updates: Partial<LeadForm>) => void;
  existingForm?: LeadForm | null;
}

function FormBuilderModal({ onClose, onCreate, onUpdate, existingForm }: FormBuilderModalProps) {
  const { products } = useAppStore();
  const [formName, setFormName] = useState(existingForm?.name || '');
  const [productId, setProductId] = useState(existingForm?.productId || products[0]?.id || '');
  const [thankYouMessage, setThankYouMessage] = useState(
    existingForm?.thankYouMessage || 'Спасибо! Мы свяжемся с вами в течение 15 минут.'
  );
  const [fields, setFields] = useState<FormField[]>(
    existingForm?.fields || [
      { id: nanoid(), type: 'text', label: 'Имя', required: true },
      { id: nanoid(), type: 'phone', label: 'Телефон', required: true },
      { id: nanoid(), type: 'email', label: 'Email', required: false },
    ]
  );
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<FormField | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveFieldId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
    
    setActiveFieldId(null);
  };

  const addField = (type: FormField['type']) => {
    const newField: FormField = {
      id: nanoid(),
      type,
      label: fieldTypes.find(ft => ft.value === type)?.label || 'Новое поле',
      required: false,
      ...(type === 'select' ? { options: ['Вариант 1', 'Вариант 2'] } : {}),
    };
    setFields([...fields, newField]);
  };

  const removeField = (fieldId: string) => {
    setFields(fields.filter(f => f.id !== fieldId));
    if (editingField?.id === fieldId) {
      setEditingField(null);
    }
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === fieldId ? { ...f, ...updates } : f));
    if (editingField?.id === fieldId) {
      setEditingField({ ...editingField, ...updates });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formId = existingForm?.id || nanoid();
    const newForm: LeadForm = {
      id: formId,
      name: formName,
      productId,
      thankYouMessage,
      fields,
      publicUrl: existingForm?.publicUrl || `${window.location.origin}/forms/${formId}/public`,
    };

    if (existingForm) {
      onUpdate(formId, newForm);
    } else {
      onCreate(newForm);
    }

    onClose();
  };

  const activeField = activeFieldId ? fields.find(f => f.id === activeFieldId) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-5xl rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {existingForm ? 'Редактировать анкету' : 'Создать анкету'}
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
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
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Сообщение после отправки
              </label>
              <textarea
                value={thankYouMessage}
                onChange={(e) => setThankYouMessage(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={2}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700">Поля формы</h3>
                  <span className="text-xs text-gray-500">Перетащите для изменения порядка</span>
                </div>
                
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {fields.map((field) => (
                        <SortableFieldItem
                          key={field.id}
                          field={field}
                          isEditing={editingField?.id === field.id}
                          onEdit={() => setEditingField(field)}
                          onRemove={() => removeField(field.id)}
                          onUpdate={(updates) => updateField(field.id, updates)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                  <DragOverlay>
                    {activeField ? (
                      <div className="rounded-lg border-2 border-primary-500 bg-white p-4 shadow-lg">
                        <div className="flex items-center gap-3">
                          <Bars3Icon className="h-5 w-5 text-gray-400" />
                          <span className="font-medium text-gray-900">{activeField.label}</span>
                        </div>
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-medium text-gray-700">Добавить поле</h3>
                <div className="space-y-2">
                  {fieldTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => addField(type.value as FormField['type'])}
                      className="flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 text-left hover:border-primary-500 hover:bg-primary-50"
                    >
                      <span className="text-xl">{type.icon}</span>
                      <span className="text-sm font-medium text-gray-700">{type.label}</span>
                    </button>
                  ))}
                </div>

                {editingField && (
                  <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h4 className="mb-3 text-sm font-semibold text-gray-900">Настройки поля</h4>
                    <div className="space-y-3">
                      <Input
                        label="Название"
                        value={editingField.label}
                        onChange={(e) => updateField(editingField.id, { label: e.target.value })}
                      />
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editingField.required}
                          onChange={(e) => updateField(editingField.id, { required: e.target.checked })}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">Обязательное</span>
                      </label>
                      {editingField.type === 'select' && (
                        <div>
                          <label className="mb-2 block text-xs font-medium text-gray-700">
                            Варианты (по одному на строку)
                          </label>
                          <textarea
                            value={editingField.options?.join('\n') || ''}
                            onChange={(e) => 
                              updateField(editingField.id, { 
                                options: e.target.value.split('\n').filter(o => o.trim()) 
                              })
                            }
                            className="w-full rounded border border-gray-300 p-2 text-xs"
                            rows={4}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        <div className="border-t border-gray-200 p-6">
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Отмена
            </Button>
            <Button onClick={handleSubmit}>
              {existingForm ? 'Сохранить изменения' : 'Создать анкету'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SortableFieldItemProps {
  field: FormField;
  isEditing: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onUpdate: (updates: Partial<FormField>) => void;
}

function SortableFieldItem({ field, isEditing, onEdit, onRemove }: SortableFieldItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border bg-white p-4 ${
        isEditing ? 'border-primary-500 ring-2 ring-primary-100' : 'border-gray-200'
      }`}
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <Bars3Icon className="h-5 w-5 text-gray-400" />
      </button>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{field.label}</span>
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {fieldTypes.find(t => t.value === field.type)?.label}
          </span>
          {field.required && (
            <span className="text-xs text-red-500">*</span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      >
        <PencilIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
