import express from 'express';
import { 
  getTenders, 
  createTender, 
  updateTender, 
  deleteTender, 
  importTenders,
  deleteMultipleTenders,
  updateMultipleTenders,
  resetTenderCounter
} from '../controllers/tenderController.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/rbacMiddleware.js';
import { logActivity } from '../middleware/auditMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/import', checkPermission('tenders.create'), logActivity('Tenders', 'IMPORT'), importTenders);
router.post('/bulk-delete', checkPermission('tenders.delete'), logActivity('Tenders', 'BULK_DELETE'), deleteMultipleTenders);
router.post('/bulk-update', checkPermission('tenders.edit'), logActivity('Tenders', 'BULK_UPDATE'), updateMultipleTenders);
router.post('/reset-counter', checkPermission('tenders.create'), logActivity('Tenders', 'RESET_COUNTER'), resetTenderCounter);

router.route('/')
  .get(checkPermission('tenders.view'), getTenders)
  .post(checkPermission('tenders.create'), logActivity('Tenders', 'CREATE'), createTender);

router.route('/:id')
  .put(checkPermission('tenders.edit'), logActivity('Tenders', 'UPDATE'), updateTender)
  .delete(checkPermission('tenders.delete'), logActivity('Tenders', 'DELETE'), deleteTender);

export default router;
