import express from 'express';
import { getDeals, createDeal, updateDeal, deleteDeal, revertDeal } from '../controllers/dealController.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/rbacMiddleware.js';
import { logActivity } from '../middleware/auditMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(checkPermission('deals.view'), getDeals)
  .post(checkPermission('deals.create'), logActivity('Deals', 'CREATE'), createDeal);

router.route('/:id')
  .put(checkPermission('deals.edit'), logActivity('Deals', 'UPDATE'), updateDeal)
  .delete(checkPermission('deals.delete'), logActivity('Deals', 'DELETE'), deleteDeal);

router.post('/:id/revert', checkPermission('deals.edit'), logActivity('Deals', 'REVERT'), revertDeal);

export default router;
