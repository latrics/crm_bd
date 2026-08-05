import cron from 'node-cron';
import Lead from '../models/Lead.js';
import Deal from '../models/Deal.js';
import Tender from '../models/Tender.js';
import { createNotification } from '../controllers/notificationController.js';

// Run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  try {
    const now = new Date();
    
    // --- 1. LEAD DEADLINE ALERTS ---
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

    // --- 2. DEAL DEADLINE ALERTS ---
    const activeDeals = await Deal.find({ stage: 'Negotiation' });
    for (const deal of activeDeals) {
      if (!deal.close_date) continue;
      const closeDate = new Date(deal.close_date);
      if (isNaN(closeDate.getTime())) continue;

      const timeDiff = closeDate.getTime() - now.getTime();
      
      // 7 Days Warning
      if (timeDiff > 0 && timeDiff <= 7 * 24 * 60 * 60 * 1000 && !deal.alert7dSent) {
        if (deal.owner) {
          await createNotification({
            message: `Deal Close Date Warning: The deal ${deal.title} close date is approaching in less than 7 days (${deal.close_date}).`,
            type: 'info',
            recipientUser: deal.owner,
            relatedId: deal._id
          });
        }
        deal.alert7dSent = true;
        await deal.save();
      }

      // 24 Hours Warning
      if (timeDiff > 0 && timeDiff <= 24 * 60 * 60 * 1000 && !deal.alert24hSent) {
        if (deal.owner) {
          await createNotification({
            message: `Urgent Close Warning: Deal ${deal.title} close date is in less than 24 hours!`,
            type: 'urgent',
            recipientUser: deal.owner,
            relatedId: deal._id
          });
        }
        deal.alert24hSent = true;
        await deal.save();
      }
    }

    // --- 3. TENDER DEADLINE ALERTS ---
    const activeTenders = await Tender.find({ status: { $nin: ['Submitted', 'Won', 'Lost', 'Awarded'] } });
    for (const tender of activeTenders) {
      if (!tender.closing_date) continue;
      const closingDate = new Date(tender.closing_date);
      if (isNaN(closingDate.getTime())) continue;

      const timeDiff = closingDate.getTime() - now.getTime();

      // 48 Hours Warning
      if (timeDiff > 0 && timeDiff <= 48 * 60 * 60 * 1000 && !tender.alert48hSent) {
        if (tender.owner) {
          await createNotification({
            message: `Urgent Closing Alert: Tender ${tender.tender_no} is closing in less than 48 hours (${tender.closing_date})!`,
            type: 'urgent',
            recipientUser: tender.owner,
            relatedId: tender._id
          });
        }
        tender.alert48hSent = true;
        await tender.save();
      }
    }

  } catch (error) {
    console.error('Error running deadline alerts cron:', error);
  }
});

// Run daily at 9:00 AM to summarize overdue entities for Admins
cron.schedule('0 9 * * *', async () => {
  try {
    const now = new Date();
    
    // --- 1. OVERDUE LEADS REPORT ---
    const overdueLeads = await Lead.find({
      deadline: { $lt: now },
      status: 'Leads'
    });

    if (overdueLeads.length > 0) {
      const overdueByOwner = overdueLeads.reduce((acc, lead) => {
        const owner = lead.owner || 'Unassigned';
        acc[owner] = (acc[owner] || 0) + 1;
        return acc;
      }, {});

      for (const [owner, count] of Object.entries(overdueByOwner)) {
        await createNotification({
          message: `Action Required: ${owner} has ${count} overdue leads.`,
          type: 'warning',
          recipientRoles: ['Super Admin', 'Admin']
        });
      }
    }

    // --- 2. OVERDUE DEALS REPORT ---
    const activeDeals = await Deal.find({ stage: 'Negotiation' });
    const overdueDeals = activeDeals.filter(deal => {
      if (!deal.close_date) return false;
      const closeDate = new Date(deal.close_date);
      return !isNaN(closeDate.getTime()) && closeDate.getTime() < now.getTime();
    });

    if (overdueDeals.length > 0) {
      const overdueDealsByOwner = overdueDeals.reduce((acc, deal) => {
        const owner = deal.owner || 'Unassigned';
        acc[owner] = (acc[owner] || 0) + 1;
        return acc;
      }, {});

      for (const [owner, count] of Object.entries(overdueDealsByOwner)) {
        await createNotification({
          message: `Action Required: ${owner} has ${count} overdue Deals past close date.`,
          type: 'warning',
          recipientRoles: ['Super Admin', 'Admin']
        });
      }
    }

    // --- 3. OVERDUE TENDERS REPORT ---
    const activeTenders = await Tender.find({ status: { $nin: ['Submitted', 'Won', 'Lost', 'Awarded'] } });
    const overdueTenders = activeTenders.filter(tender => {
      if (!tender.closing_date) return false;
      const closingDate = new Date(tender.closing_date);
      return !isNaN(closingDate.getTime()) && closingDate.getTime() < now.getTime();
    });

    if (overdueTenders.length > 0) {
      const overdueTendersByOwner = overdueTenders.reduce((acc, tender) => {
        const owner = tender.owner || 'Unassigned';
        acc[owner] = (acc[owner] || 0) + 1;
        return acc;
      }, {});

      for (const [owner, count] of Object.entries(overdueTendersByOwner)) {
        await createNotification({
          message: `Action Required: ${owner} has ${count} unsubmitted tenders past closing date.`,
          type: 'warning',
          recipientRoles: ['Super Admin', 'Admin']
        });
      }
    }

  } catch (error) {
    console.error('Error running daily overdue summary cron:', error);
  }
});
