import { z } from 'zod';

export const formFieldTypeEnum = z.enum(['text', 'phone', 'email', 'dropdown', 'checkbox', 'date']);

export const formFieldSchema = z.object({
  id: z.string().uuid(),
  type: formFieldTypeEnum,
  label: z.string().min(1, 'Label is required').max(255, 'Label must be 255 characters or less'),
  placeholder: z.string().max(255, 'Placeholder must be 255 characters or less').optional(),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
}).strict();

export const formsListQuerySchema = z.object({
  product_id: z.string().uuid().optional(),
  is_active: z
    .union([z.boolean(), z.string().transform((val) => val === 'true')])
    .optional(),
  search: z.string().max(255, 'Search term must be 255 characters or less').optional(),
  sort_by: z.enum(['created_at', 'updated_at', 'name']).optional(),
  sort_direction: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().min(1, 'Page must be at least 1').optional(),
  page_size: z.coerce
    .number()
    .int()
    .min(1, 'Page size must be at least 1')
    .max(100, 'Page size must not exceed 100')
    .optional(),
});

export const createFormSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(1, 'Name is required')
    .max(255, 'Name must be 255 characters or less'),
  product_id: z.string().uuid().nullable().optional(),
  fields: z.array(formFieldSchema).optional(),
  success_message: z.string().max(1000, 'Success message must be 1000 characters or less').nullable().optional(),
}).strict();

export const updateFormSchema = createFormSchema.partial().extend({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(255, 'Name must be 255 characters or less')
    .optional(),
  is_active: z.boolean().optional(),
}).strict();

export const submitFormSchema = z.object({
  values: z.record(
    z.union([
      z.string(),
      z.boolean(),
      z.array(z.string()),
      z.null(),
    ])
  ),
  utm_source: z.string().max(255).optional().nullable(),
  utm_medium: z.string().max(255).optional().nullable(),
  utm_campaign: z.string().max(255).optional().nullable(),
}).strict();
