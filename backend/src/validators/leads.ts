import { z } from 'zod';

export const leadStatusEnum = z.enum(['new', 'working', 'awaiting_payment', 'won', 'lost']);

export const leadsListQuerySchema = z.object({
  status: leadStatusEnum.optional(),
  assigned_to: z.string().uuid('assigned_to must be a valid UUID').optional(),
  product_id: z.string().uuid('product_id must be a valid UUID').optional(),
  search: z.string().max(255, 'Search term must be 255 characters or less').optional(),
  sort_by: z.enum(['created_at', 'updated_at', 'status', 'first_name', 'last_name']).optional(),
  sort_direction: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().min(1, 'Page must be at least 1').optional(),
  page_size: z.coerce.number().int().min(1, 'Page size must be at least 1').max(100, 'Page size must not exceed 100').optional(),
});

export const createLeadSchema = z.object({
  product_id: z.string().uuid('product_id must be a valid UUID').nullable().optional(),
  group_id: z.string().uuid('group_id must be a valid UUID').nullable().optional(),
  assigned_to: z.string().uuid('assigned_to must be a valid UUID').nullable().optional(),
  status: leadStatusEnum.optional(),
  first_name: z.string().max(255, 'First name must be 255 characters or less').nullable().optional(),
  last_name: z.string().max(255, 'Last name must be 255 characters or less').nullable().optional(),
  email: z.string().email('Invalid email format').max(255, 'Email must be 255 characters or less').nullable().optional(),
  phone: z.string().max(50, 'Phone must be 50 characters or less').nullable().optional(),
  source: z.string().max(255, 'Source must be 255 characters or less').nullable().optional(),
  utm_source: z.string().max(255, 'UTM source must be 255 characters or less').nullable().optional(),
  utm_medium: z.string().max(255, 'UTM medium must be 255 characters or less').nullable().optional(),
  utm_campaign: z.string().max(255, 'UTM campaign must be 255 characters or less').nullable().optional(),
  custom_fields: z.record(z.any()).optional(),
});

export const updateLeadSchema = z.object({
  product_id: z.string().uuid('product_id must be a valid UUID').nullable().optional(),
  group_id: z.string().uuid('group_id must be a valid UUID').nullable().optional(),
  assigned_to: z.string().uuid('assigned_to must be a valid UUID').nullable().optional(),
  status: leadStatusEnum.optional(),
  first_name: z.string().max(255, 'First name must be 255 characters or less').nullable().optional(),
  last_name: z.string().max(255, 'Last name must be 255 characters or less').nullable().optional(),
  email: z.string().email('Invalid email format').max(255, 'Email must be 255 characters or less').nullable().optional(),
  phone: z.string().max(50, 'Phone must be 50 characters or less').nullable().optional(),
  source: z.string().max(255, 'Source must be 255 characters or less').nullable().optional(),
  utm_source: z.string().max(255, 'UTM source must be 255 characters or less').nullable().optional(),
  utm_medium: z.string().max(255, 'UTM medium must be 255 characters or less').nullable().optional(),
  utm_campaign: z.string().max(255, 'UTM campaign must be 255 characters or less').nullable().optional(),
  custom_fields: z.record(z.any()).optional(),
});

export const updateLeadStatusSchema = z.object({
  status: leadStatusEnum,
});
