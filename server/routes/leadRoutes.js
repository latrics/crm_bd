import express from 'express';
import { getLeads, createLead, updateLead, deleteLead, convertLead, importLeads, deleteMultipleLeads, updateMultipleLeads, resetCounter, cleanupOrphanedLeads } from '../controllers/leadController.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/rbacMiddleware.js';
import { logActivity } from '../middleware/auditMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/reset-counter', logActivity('Leads', 'RESET_COUNTER'), resetCounter);
router.post('/cleanup-orphans', checkPermission('leads.edit'), logActivity('Leads', 'CLEANUP_ORPHANS'), cleanupOrphanedLeads);
router.post('/import', checkPermission('leads.create'), logActivity('Leads', 'BULK_IMPORT'), importLeads);
router.post('/bulk-update', checkPermission('leads.edit'), logActivity('Leads', 'BULK_UPDATE'), updateMultipleLeads);
router.post('/bulk-delete', checkPermission('leads.delete'), logActivity('Leads', 'BULK_DELETE'), deleteMultipleLeads);

router.route('/')
  .get(checkPermission('leads.view'), getLeads)
  .post(checkPermission('leads.create'), logActivity('Leads', 'CREATE'), createLead);

router.route('/:id')
  .put(checkPermission('leads.edit'), logActivity('Leads', 'UPDATE'), updateLead)
  .delete(checkPermission('leads.delete'), logActivity('Leads', 'DELETE'), deleteLead);

router.post('/:id/convert', checkPermission('leads.edit'), logActivity('Leads', 'CONVERT'), convertLead);

export default router;
