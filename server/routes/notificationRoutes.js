import express from 'express';
import { 
  getNotifications, 
  markAsRead, 
  markAsUnread, 
  markAllAsRead, 
  deleteNotification 
} from '../controllers/notificationController.js';

const router = express.Router();

router.get('/', getNotifications);
router.post('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.patch('/:id/unread', markAsUnread);
router.delete('/:id', deleteNotification);

export default router;
