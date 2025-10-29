import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be 255 characters or less'),
  description: z.string().max(5000, 'Description must be 5000 characters or less').nullable().optional(),
  assigned_to: z.string().uuid('assigned_to must be a valid UUID').nullable().optional(),
  due_date: z.string().datetime().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
}).strict();

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be 255 characters or less').optional(),
  description: z.string().max(5000, 'Description must be 5000 characters or less').nullable().optional(),
  assigned_to: z.string().uuid('assigned_to must be a valid UUID').nullable().optional(),
  due_date: z.string().datetime().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  is_completed: z.boolean().optional(),
}).strict();
