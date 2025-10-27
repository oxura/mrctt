import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(5000, 'Comment must be 5000 characters or less'),
});
