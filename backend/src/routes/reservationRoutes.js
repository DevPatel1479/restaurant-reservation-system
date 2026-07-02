import { Router } from 'express';
import {
  cancelReservation,
  createReservation,
  getMyReservations,
  getReservationById,
  listReservations,
  reservationStats,
  updateReservation
} from '../controllers/reservationController.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createReservationSchema, updateReservationSchema } from '../validators/reservationSchemas.js';

const router = Router();

router.get('/stats', requireAuth, requireRole('admin'), reservationStats);
router.get('/my', requireAuth, getMyReservations);
router.get('/', requireAuth, requireRole('admin'), listReservations);
router.post('/', requireAuth, validate(createReservationSchema), createReservation);
router.get('/:id', requireAuth, getReservationById);
router.put('/:id', requireAuth, validate(updateReservationSchema), updateReservation);
router.patch('/:id/cancel', requireAuth, cancelReservation);

export default router;
