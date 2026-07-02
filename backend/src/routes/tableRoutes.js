import { Router } from 'express';
import { createTable, deleteTable, listTables, updateTable } from '../controllers/tableController.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createTableSchema, updateTableSchema } from '../validators/tableSchemas.js';

const router = Router();

router.get('/', requireAuth, listTables);
router.post('/', requireAuth, requireRole('admin'), validate(createTableSchema), createTable);
router.put('/:id', requireAuth, requireRole('admin'), validate(updateTableSchema), updateTable);
router.delete('/:id', requireAuth, requireRole('admin'), deleteTable);

export default router;
