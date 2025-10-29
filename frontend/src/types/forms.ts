export type FormFieldType = 'text' | 'phone' | 'email' | 'dropdown' | 'checkbox' | 'date';

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

export interface Form {
  id: string;
  tenant_id: string;
  product_id?: string | null;
  name: string;
  slug: string;
  fields: FormField[];
  success_message?: string | null;
  public_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product_name?: string;
}

export interface FormsListResponse {
  forms: Form[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CreateFormRequest {
  name: string;
  product_id?: string | null;
  fields?: FormField[];
  success_message?: string | null;
}

export interface UpdateFormRequest {
  name?: string;
  product_id?: string | null;
  fields?: FormField[];
  success_message?: string | null;
  is_active?: boolean;
}
