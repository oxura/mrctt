import { z } from 'zod';

export const productTypeEnum = z.enum(['course', 'service', 'other']);
export const productStatusEnum = z.enum(['active', 'archived']);

export const productsListQuerySchema = z.object({
  type: productTypeEnum.optional(),
  status: productStatusEnum.optional(),
  search: z.string().max(255, 'Search term must be 255 characters or less').optional(),
  sort_by: z.enum(['created_at', 'updated_at', 'name', 'price']).optional(),
  sort_direction: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().min(1, 'Page must be at least 1').optional(),
  page_size: z.coerce
    .number()
    .int()
    .min(1, 'Page size must be at least 1')
    .max(100, 'Page size must not exceed 100')
    .optional(),
});

export const createProductSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(1, 'Name is required')
    .max(255, 'Name must be 255 characters or less'),
  description: z.string().max(5000, 'Description must be 5000 characters or less').nullable().optional(),
  type: productTypeEnum,
  price: z
    .number({ invalid_type_error: 'Price must be a number' })
    .nonnegative('Price must be greater than or equal to 0')
    .optional(),
  status: productStatusEnum.optional(),
}).strict();

export const updateProductSchema = createProductSchema.partial().extend({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(255, 'Name must be 255 characters or less')
    .optional(),
  type: productTypeEnum.optional(),
  price: z
    .number({ invalid_type_error: 'Price must be a number' })
    .nonnegative('Price must be greater than or equal to 0')
    .nullable()
    .optional(),
}).strict();

export const updateProductStatusSchema = z.object({
  status: productStatusEnum,
}).strict();
