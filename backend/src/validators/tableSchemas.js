import { z } from 'zod';

export const createTableSchema = z.object({
  name: z.string().trim().min(1).max(100),
  capacity: z.coerce.number().int().min(1).max(50),
  isActive: z.coerce.boolean().optional().default(true),
  notes: z.string().trim().max(500).optional().default('')
});

export const updateTableSchema = createTableSchema.partial().refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required'
});
