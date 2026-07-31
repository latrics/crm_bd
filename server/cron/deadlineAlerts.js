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
      status: 'Leads'
    });

    for (const lead of leads24h) {
      await createNotification({ message: `Urgent: Only 24 hours remaining to contact lead ${lead.company}`, type: 'urgent', recipientUser: lead.owner, relatedId: lead._id });
      lead.alert24hSent = true;
      await lead.save();
    }

    // 1 Hour Alert
    const time1h = new Date(now.getTime() + 60 * 60 * 1000);
    const leads1h = await Lead.find({
      deadline: { $lte: time1h, $gt: now },
      alert1hSent: false,
      status: 'Leads'
    });

    for (const lead of leads1h) {
      await createNotification({ message: `Critical: Last 60 mins left to contact lead ${lead.company}`, type: 'urgent', recipientUser: lead.owner, relatedId: lead._id });
      lead.alert1hSent = true;
      await lead.save();
    }

  } catch (error) {
    console.error('Error running deadline alerts cron:', error);
  }
});

// Run daily at 9:00 AM to summarize overdue leads for Admins
cron.schedule('0 9 * * *', async () => {
  try {
    const now = new Date();
    const overdueLeads = await Lead.find({
      deadline: { $lt: now },
      status: 'Leads'
    });

    if (overdueLeads.length === 0) return;

    // Group by owner
    const overdueByOwner = overdueLeads.reduce((acc, lead) => {
      if (!lead.owner) return acc;
      acc[lead.owner] = (acc[lead.owner] || 0) + 1;
      return acc;
    }, {});

    for (const [owner, count] of Object.entries(overdueByOwner)) {
      await createNotification({
        message: `Action Required: ${owner} has ${count} overdue leads.`,
        type: 'warning',
        recipientRoles: ['Super Admin', 'Admin']
      });
    }
  } catch (error) {
    console.error('Error running daily overdue summary cron:', error);
  }
});
