import express from 'express';
import { getDocs, createDoc, deleteDoc } from '../controllers/docController.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/rbacMiddleware.js';
import { logActivity } from '../middleware/auditMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(checkPermission('docs.view'), getDocs)
  .post(checkPermission('docs.create'), logActivity('Documents', 'CREATE'), createDoc);

router.route('/:id')
  .delete(checkPermission('docs.delete'), logActivity('Documents', 'DELETE'), deleteDoc);

export default router;
