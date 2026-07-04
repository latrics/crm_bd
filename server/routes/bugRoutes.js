import express from 'express';
import { createBugReport } from '../controllers/bugController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All bug routes are private (protected)
router.use(protect);

router.post('/report', createBugReport);

export default router;
