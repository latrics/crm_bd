import express from 'express';
import { getLeads, createLead, updateLead, deleteLead, convertLead } from '../controllers/leadController.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/rbacMiddleware.js';
import { logActivity } from '../middleware/auditMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(checkPermission('leads.view'), getLeads)
  .post(checkPermission('leads.create'), logActivity('Leads', 'CREATE'), createLead);

router.route('/:id')
  .put(checkPermission('leads.edit'), logActivity('Leads', 'UPDATE'), updateLead)
  .delete(checkPermission('leads.delete'), logActivity('Leads', 'DELETE'), deleteLead);

router.post('/:id/convert', checkPermission('leads.edit'), logActivity('Leads', 'CONVERT'), convertLead);

export default router;
