import { z } from 'zod';

export const groupStatusEnum = z.enum(['open', 'full', 'closed', 'cancelled']);

const dateStringSchema = z
  .string()
  .trim()
  .min(1, 'Дата обязательна')
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'Некорректный формат даты',
  });

export const groupsListQuerySchema = z.object({
  product_id: z.string().uuid('Некорректный идентификатор продукта').optional(),
  status: groupStatusEnum.optional(),
  search: z.string().max(255, 'Поисковая строка не должна превышать 255 символов').optional(),
  sort_by: z.enum(['created_at', 'updated_at', 'name', 'start_date', 'status']).optional(),
  sort_direction: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().min(1, 'Страница должна быть не меньше 1').optional(),
  page_size: z.coerce
    .number()
    .int()
    .min(1, 'Размер страницы должен быть не меньше 1')
    .max(100, 'Размер страницы должен быть не больше 100')
    .optional(),
});

export const createGroupSchema = z.object({
  product_id: z.string({ required_error: 'Продукт обязателен' }).uuid('Некорректный идентификатор продукта'),
  name: z
    .string({ required_error: 'Название обязательно' })
    .trim()
    .min(1, 'Название обязательно')
    .max(255, 'Название не должно превышать 255 символов'),
  start_date: dateStringSchema.nullable().optional(),
  end_date: dateStringSchema.nullable().optional(),
  max_capacity: z
    .number({ invalid_type_error: 'Лимит должен быть числом' })
    .int('Лимит должен быть целым числом')
    .positive('Лимит должен быть больше 0')
    .optional(),
});

export const updateGroupSchema = createGroupSchema.partial().extend({
  name: z
    .string()
    .trim()
    .min(1, 'Название обязательно')
    .max(255, 'Название не должно превышать 255 символов')
    .optional(),
  max_capacity: z
    .number({ invalid_type_error: 'Лимит должен быть числом' })
    .int('Лимит должен быть целым числом')
    .positive('Лимит должен быть больше 0')
    .nullable()
    .optional(),
  status: groupStatusEnum.optional(),
});
