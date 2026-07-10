import cron from 'node-cron';
import Lead from '../models/Lead.js';
import { createNotification } from '../controllers/notificationController.js';

// Run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  try {
    const now = new Date();
    
    // 24 Hours Alert
    const time24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const leads24h = await Lead.find({
      deadline: { $lte: time24h, $gt: now },
      alert24hSent: false,
      status: { $nin: ['Closure', 'Converted'] }
    });

    for (const lead of leads24h) {
      await createNotification(`Urgent: Only 24 hours remaining to contact lead ${lead.company}`, 'urgent', lead.owner, lead._id);
      lead.alert24hSent = true;
      await lead.save();
    }

    // 1 Hour Alert
    const time1h = new Date(now.getTime() + 60 * 60 * 1000);
    const leads1h = await Lead.find({
      deadline: { $lte: time1h, $gt: now },
      alert1hSent: false,
      status: { $nin: ['Closure', 'Converted'] }
    });

    for (const lead of leads1h) {
      await createNotification(`Critical: Last 60 mins left to contact lead ${lead.company}`, 'urgent', lead.owner, lead._id);
      lead.alert1hSent = true;
      await lead.save();
    }

  } catch (error) {
    console.error('Error running deadline alerts cron:', error);
  }
});
