import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createReservationSchema = z.object({
  date: z.string().regex(dateRegex, 'Date must be YYYY-MM-DD'),
  startTime: z.string().regex(timeRegex, 'Start time must be HH:mm'),
  endTime: z.string().regex(timeRegex, 'End time must be HH:mm'),
  guests: z.coerce.number().int().min(1).max(50),
  tableId: z.string().trim().optional().nullable(),
  notes: z.string().trim().max(500).optional().default('')
});

export const updateReservationSchema = createReservationSchema.partial().extend({
  status: z.enum(['confirmed', 'cancelled']).optional(),
  userId: z.string().trim().optional().nullable()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required'
});
