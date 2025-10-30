import { z } from 'zod';

export const formFieldTypeEnum = z.enum(['text', 'phone', 'email', 'dropdown', 'checkbox', 'date']);

const fieldOptionsSchema = z
  .array(z.string().trim().min(1, 'Option cannot be empty').max(255, 'Option must be 255 characters or less'))
  .max(50, 'Maximum 50 options allowed');

export const formFieldSchema = z
  .object({
    id: z.string().min(1, 'Field ID is required'),
    type: formFieldTypeEnum,
    label: z
      .string()
      .trim()
      .min(1, 'Label is required')
      .max(255, 'Label must be 255 characters or less'),
    placeholder: z
      .string()
      .trim()
      .max(255, 'Placeholder must be 255 characters or less')
      .optional(),
    required: z.boolean(),
    options: fieldOptionsSchema.optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.type === 'dropdown' && (!data.options || data.options.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options'],
        message: 'Dropdown fields must include at least one option',
      });
    }

    if (data.type !== 'dropdown' && data.options && data.options.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options'],
        message: 'Options are only supported for dropdown fields',
      });
    }
  });

export const formsListQuerySchema = z
  .object({
    product_id: z.string().uuid().optional(),
    is_active: z
      .union([z.boolean(), z.string().transform((val) => val === 'true')])
      .optional(),
    search: z.string().trim().max(255, 'Search term must be 255 characters or less').optional(),
    sort_by: z.enum(['created_at', 'updated_at', 'name']).optional(),
    sort_direction: z.enum(['asc', 'desc']).optional(),
    page: z.coerce.number().int().min(1, 'Page must be at least 1').optional(),
    page_size: z.coerce
      .number()
      .int()
      .min(1, 'Page size must be at least 1')
      .max(100, 'Page size must not exceed 100')
      .optional(),
  })
  .strict();

const baseFormSchema = z
  .object({
    name: z
      .string({ required_error: 'Name is required' })
      .trim()
      .min(1, 'Name is required')
      .max(255, 'Name must be 255 characters or less'),
    product_id: z.string().uuid().nullable().optional(),
    fields: z.array(formFieldSchema).max(50, 'Maximum 50 fields allowed').optional(),
    success_message: z
      .string()
      .trim()
      .max(1000, 'Success message must be 1000 characters or less')
      .nullable()
      .optional(),
  })
  .strict();

export const createFormSchema = baseFormSchema;

export const updateFormSchema = baseFormSchema
  .partial()
  .extend({
    name: z
      .string()
      .trim()
      .min(1, 'Name is required')
      .max(255, 'Name must be 255 characters or less')
      .optional(),
    is_active: z.boolean().optional(),
  })
  .strict();

const utmParamSchema = z
  .string()
  .trim()
  .max(100, 'UTM parameter must be 100 characters or less')
  .regex(/^[a-zA-Z0-9_\-\.]*$/, 'UTM parameter contains unsupported characters')
  .optional()
  .nullable();

const fieldValueSchema = z.union([
  z.string().max(1000, 'Field value must be 1000 characters or less'),
  z.boolean(),
  z.array(z.string().max(255, 'Field value must be 255 characters or less')).max(20, 'Maximum 20 selections allowed'),
  z.null(),
]);

export const submitFormSchema = z
  .object({
    values: z
      .record(z.string().min(1).max(200), fieldValueSchema)
      .superRefine((values, ctx) => {
        const keys = Object.keys(values);
        if (keys.length > 100) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Too many fields submitted',
            path: [],
          });
        }
      }),
    utm_source: utmParamSchema,
    utm_medium: utmParamSchema,
    utm_campaign: utmParamSchema,
    captcha_token: z
      .string()
      .trim()
      .min(10, 'Captcha token is too short')
      .max(1000, 'Captcha token is too long')
      .optional(),
  })
  .strict();
