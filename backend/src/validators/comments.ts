import { z } from 'zod';

const stripHtmlTags = (text: string): string => {
  return text.replace(/<[^>]*>/g, '');
};

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment content is required')
    .max(5000, 'Comment must be 5000 characters or less')
    .transform(stripHtmlTags)
    .refine((val) => val.trim().length > 0, {
      message: 'Comment content cannot be empty after sanitization',
    }),
});
