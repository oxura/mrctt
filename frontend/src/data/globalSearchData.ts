export interface SearchLead {
  id: string;
  name: string;
  phone: string;
  status: string;
  manager: string;
  product?: string;
}

// Mock data for global search demonstration
// TODO: Replace with API call to /api/v1/leads/search in production
export const searchLeads: SearchLead[] = [
  { id: 'L-101', name: 'Иван Петров', phone: '+7 (901) 123-45-67', status: 'В работе', manager: 'Анна Кузнецова', product: 'Курс по дизайну' },
  { id: 'L-102', name: 'Мария Сидорова', phone: '+7 (921) 555-01-02', status: 'Новый', manager: 'Олег Пастухов', product: 'Тур в Грузию' },
  { id: 'L-103', name: 'ООО «Путешествуем вместе»', phone: '+7 (495) 765-43-21', status: 'Договор', manager: 'Екатерина Иванова', product: 'B2B сопровождение' },
  { id: 'L-104', name: 'ИП Алексеев', phone: '+7 (903) 234-56-78', status: 'Оплачен', manager: 'Анна Кузнецова', product: 'CRM внедрение' },
  { id: 'L-105', name: 'Елена Смирнова', phone: '+7 (911) 349-67-80', status: 'Повторный контакт', manager: 'Олег Пастухов', product: 'Онлайн-курс «Маркетинг»' },
];
